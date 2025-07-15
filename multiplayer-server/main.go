package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types
const (
	MessageTypeRegister      = "register"
	MessageTypeResponse      = "response"
	MessageTypeError         = "error"
	MessageTypePlayerCount   = "player_count"
	MessageTypeScoreUpdate   = "score_update"
	MessageTypeLiveLeaderboard = "live_leaderboard"
	MessageTypeAllTimeLeaderboard = "alltime_leaderboard"
)

// Message represents a WebSocket message
type Message struct {
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	Username string      `json:"username,omitempty"`
}

// RegisterData represents user registration data
type RegisterData struct {
	Username string `json:"username"`
	DeviceID string `json:"deviceId"`
}

// ResponseData represents server response data
type ResponseData struct {
	Username string `json:"username"`
	Message  string `json:"message"`
}

// PlayerCountData represents player count data
type PlayerCountData struct {
	Count int `json:"count"`
}

// ScoreUpdateData represents score update data
type ScoreUpdateData struct {
	Score int `json:"score"`
}

// LeaderboardEntry represents a leaderboard entry
type LeaderboardEntry struct {
	Username string `json:"username"`
	Score    int    `json:"score"`
}

// LeaderboardData represents leaderboard data
type LeaderboardData struct {
	Entries []LeaderboardEntry `json:"entries"`
}

// Client represents a connected client
type Client struct {
	ID       string
	Username string
	DeviceID string
	Score    int
	Conn     *websocket.Conn
	Send     chan []byte
}

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Device ID to client mapping for deduplication
	deviceClients map[string]*Client

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe operations
	mutex sync.RWMutex

	// All-time high scores (persistent storage would be better)
	allTimeScores []LeaderboardEntry
}

func newHub() *Hub {
	return &Hub{
		clients:       make(map[*Client]bool),
		deviceClients: make(map[string]*Client),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		allTimeScores: make([]LeaderboardEntry, 0),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			
			// If device already has a connection, close the old one
			if client.DeviceID != "" {
				if oldClient, exists := h.deviceClients[client.DeviceID]; exists {
					log.Printf("Replacing existing connection for device %s", client.DeviceID)
					delete(h.clients, oldClient)
					close(oldClient.Send)
					oldClient.Conn.Close()
				}
				h.deviceClients[client.DeviceID] = client
			}
			
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client registered: %s (%s) Device: %s", client.Username, client.ID, client.DeviceID)
			h.broadcastPlayerCount()

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				
				// Also remove from device mapping
				if client.DeviceID != "" {
					delete(h.deviceClients, client.DeviceID)
				}
				
				log.Printf("Client unregistered: %s (%s) Device: %s", client.Username, client.ID, client.DeviceID)
			}
			h.mutex.Unlock()
			h.broadcastPlayerCount()
		}
	}
}

func (h *Hub) broadcastPlayerCount() {
	h.mutex.RLock()
	count := len(h.clients)
	h.mutex.RUnlock()

	message := Message{
		Type: MessageTypePlayerCount,
		Data: PlayerCountData{
			Count: count,
		},
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal player count message: %v", err)
		return
	}

	h.mutex.RLock()
	for client := range h.clients {
		select {
		case client.Send <- messageBytes:
		default:
			close(client.Send)
			delete(h.clients, client)
		}
	}
	h.mutex.RUnlock()
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin for development
		return true
	},
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) readPump(hub *Hub) {
	defer func() {
		hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		switch msg.Type {
		case MessageTypeRegister:
			c.handleRegister(msg)
		case MessageTypeScoreUpdate:
			c.handleScoreUpdate(hub, msg)
		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}

func (c *Client) handleRegister(msg Message) {
	// Parse registration data
	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		c.sendError("Failed to process registration data")
		return
	}

	var regData RegisterData
	if err := json.Unmarshal(dataBytes, &regData); err != nil {
		c.sendError("Invalid registration data format")
		return
	}

	// Validate username
	if regData.Username == "" {
		c.sendError("Username cannot be empty")
		return
	}

	// Validate device ID
	if regData.DeviceID == "" {
		c.sendError("Device ID cannot be empty")
		return
	}

	// Set client username and device ID
	c.Username = regData.Username
	c.DeviceID = regData.DeviceID

	// Send success response
	response := Message{
		Type: MessageTypeResponse,
		Data: ResponseData{
			Username: regData.Username,
			Message:  fmt.Sprintf("Welcome %s! You have been registered successfully.", regData.Username),
		},
	}

	responseBytes, err := json.Marshal(response)
	if err != nil {
		c.sendError("Failed to create response")
		return
	}

	select {
	case c.Send <- responseBytes:
	default:
		close(c.Send)
	}

	log.Printf("User registered: %s", regData.Username)
}

func (c *Client) handleScoreUpdate(hub *Hub, msg Message) {
	// Parse score update data
	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		c.sendError("Failed to process score update data")
		return
	}

	var scoreData ScoreUpdateData
	if err := json.Unmarshal(dataBytes, &scoreData); err != nil {
		c.sendError("Invalid score update data format")
		return
	}

	// Update client score
	c.Score = scoreData.Score
	log.Printf("Score updated for %s: %d", c.Username, c.Score)

	// Update all-time high scores if this is a new high score
	hub.updateAllTimeScores(c.Username, c.Score)
	
	// Broadcast updated all-time leaderboard
	hub.broadcastAllTimeLeaderboard()
}

func (h *Hub) updateAllTimeScores(username string, score int) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Check if user already has a score in all-time leaderboard
	found := false
	for i := range h.allTimeScores {
		if h.allTimeScores[i].Username == username {
			if score > h.allTimeScores[i].Score {
				h.allTimeScores[i].Score = score
			}
			found = true
			break
		}
	}

	// If not found, add new entry
	if !found {
		h.allTimeScores = append(h.allTimeScores, LeaderboardEntry{
			Username: username,
			Score:    score,
		})
	}

	// Sort by score (descending)
	for i := 0; i < len(h.allTimeScores); i++ {
		for j := i + 1; j < len(h.allTimeScores); j++ {
			if h.allTimeScores[j].Score > h.allTimeScores[i].Score {
				h.allTimeScores[i], h.allTimeScores[j] = h.allTimeScores[j], h.allTimeScores[i]
			}
		}
	}

	// Keep only top 10 all-time scores
	if len(h.allTimeScores) > 10 {
		h.allTimeScores = h.allTimeScores[:10]
	}
}

func (h *Hub) getLiveLeaderboard() []LeaderboardEntry {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	// Collect current scores from active players
	var entries []LeaderboardEntry
	for client := range h.clients {
		if client.Username != "" {
			entries = append(entries, LeaderboardEntry{
				Username: client.Username,
				Score:    client.Score,
			})
		}
	}

	// Sort by score (descending)
	for i := 0; i < len(entries); i++ {
		for j := i + 1; j < len(entries); j++ {
			if entries[j].Score > entries[i].Score {
				entries[i], entries[j] = entries[j], entries[i]
			}
		}
	}

	// Return top 5
	if len(entries) > 5 {
		return entries[:5]
	}
	return entries
}

func (h *Hub) broadcastLiveLeaderboard() {
	entries := h.getLiveLeaderboard()

	message := Message{
		Type: MessageTypeLiveLeaderboard,
		Data: LeaderboardData{
			Entries: entries,
		},
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal live leaderboard message: %v", err)
		return
	}

	h.mutex.RLock()
	for client := range h.clients {
		select {
		case client.Send <- messageBytes:
		default:
			close(client.Send)
			delete(h.clients, client)
		}
	}
	h.mutex.RUnlock()
}

func (h *Hub) broadcastAllTimeLeaderboard() {
	h.mutex.RLock()
	allTimeEntries := make([]LeaderboardEntry, len(h.allTimeScores))
	copy(allTimeEntries, h.allTimeScores)
	h.mutex.RUnlock()

	message := Message{
		Type: MessageTypeAllTimeLeaderboard,
		Data: LeaderboardData{
			Entries: allTimeEntries,
		},
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal all-time leaderboard message: %v", err)
		return
	}

	h.mutex.RLock()
	for client := range h.clients {
		select {
		case client.Send <- messageBytes:
		default:
			close(client.Send)
			delete(h.clients, client)
		}
	}
	h.mutex.RUnlock()
}

func (c *Client) sendError(message string) {
	errorMsg := Message{
		Type: MessageTypeError,
		Data: map[string]string{"message": message},
	}

	errorBytes, err := json.Marshal(errorMsg)
	if err != nil {
		log.Printf("Failed to marshal error message: %v", err)
		return
	}

	select {
	case c.Send <- errorBytes:
	default:
		close(c.Send)
	}
}

func serveWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Generate unique client ID
	clientID := fmt.Sprintf("client_%d", time.Now().UnixNano())

	client := &Client{
		ID:   clientID,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in new goroutines
	go client.writePump()
	go client.readPump(hub)
}

func main() {
	hub := newHub()
	go hub.run()

	// Start periodic leaderboard broadcasting
	go func() {
		ticker := time.NewTicker(500 * time.Millisecond) // Every 500ms
		defer ticker.Stop()
		
		for range ticker.C {
			hub.broadcastLiveLeaderboard()
		}
	}()

	// WebSocket endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWS(hub, w, r)
	})

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// CORS middleware for development
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		w.WriteHeader(http.StatusNotFound)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Multiplayer server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}