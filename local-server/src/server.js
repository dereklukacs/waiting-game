const express = require('express');
const cors = require('cors');
const StatusManager = require('./status-manager');
const createStatusRoutes = require('./routes/status');

const PORT = process.env.PORT || 3001;

const app = express();
const statusManager = new StatusManager();

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'https://waiting-game.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

app.use('/', createStatusRoutes(statusManager));

app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`[Server] Waiting Game local server running on http://localhost:${PORT}`);
  console.log(`[Server] Game can poll status at http://localhost:${PORT}/status`);
});

process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, statusManager };