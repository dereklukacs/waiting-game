package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types
const (
	MessageTypeRegister    = "register"
	MessageTypeResponse    = "response"
	MessageTypeError       = "error"
	MessageTypePlayerCount = "player_count"
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
}

// ResponseData represents server response data
type ResponseData struct {
	Username string `json:"username"`
	Message  string `json:"message"`
}

// Client represents a connected client
type Client struct {
	ID       string
	Username string
	Conn     *websocket.Conn
	Send     chan []byte
}

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe operations
	mutex sync.RWMutex
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client registered: %s (%s)", client.Username, client.ID)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				log.Printf("Client unregistered: %s (%s)", client.Username, client.ID)
			}
			h.mutex.Unlock()
		}
	}
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

	// Set client username
	c.Username = regData.Username

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

	port := ":8080"
	log.Printf("Multiplayer server starting on port %s", port)
	log.Fatal(http.ListenAndServe(port, nil))
}