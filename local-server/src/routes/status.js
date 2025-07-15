const express = require('express');
const router = express.Router();

function createStatusRoutes(statusManager) {
  router.get('/status', (req, res) => {
    try {
      const status = statusManager.getStatus();
      res.json(status);
    } catch (error) {
      console.error('[Status Route] Error getting status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: Date.now(),
      uptime: process.uptime()
    });
  });

  router.post('/hooks/tool-start', (req, res) => {
    try {
      console.log('[Hook] Tool execution started');
      statusManager.markToolExecuting();
      res.json({ success: true });
    } catch (error) {
      console.error('[Hook] Error handling tool-start:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/hooks/tool-complete', (req, res) => {
    try {
      console.log('[Hook] Tool execution completed');
      statusManager.markWorking();
      res.json({ success: true });
    } catch (error) {
      console.error('[Hook] Error handling tool-complete:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/hooks/session-end', (req, res) => {
    try {
      console.log('[Hook] Claude session ended');
      statusManager.markIdle();
      res.json({ success: true });
    } catch (error) {
      console.error('[Hook] Error handling session-end:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/hooks/permission-request', (req, res) => {
    try {
      console.log('[Hook] Claude is waiting for permission');
      statusManager.markWaitingForPermission();
      res.json({ success: true });
    } catch (error) {
      console.error('[Hook] Error handling permission-request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Pre-compact command handler
  router.post('/commands/pre-compact', (req, res) => {
    try {
      const { command, data } = req.body;
      console.log('[Commands] Processing pre-compact command:', command);
      
      // Handle different types of pre-compact commands
      switch (command) {
        case 'setup':
          console.log('[Commands] Setup command received');
          statusManager.markWorking();
          res.json({ 
            success: true, 
            message: 'Setup command processed',
            timestamp: Date.now()
          });
          break;
          
        case 'start':
          console.log('[Commands] Start command received');
          statusManager.markWorking();
          res.json({ 
            success: true, 
            message: 'Start command processed',
            timestamp: Date.now()
          });
          break;
          
        case 'validate':
          console.log('[Commands] Validation command received');
          res.json({ 
            success: true, 
            message: 'Command validation successful',
            valid: true,
            timestamp: Date.now()
          });
          break;
          
        default:
          console.log('[Commands] Unknown pre-compact command:', command);
          res.json({ 
            success: true, 
            message: 'Unknown command processed',
            command: command,
            timestamp: Date.now()
          });
      }
    } catch (error) {
      console.error('[Commands] Error handling pre-compact command:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get available commands
  router.get('/commands', (req, res) => {
    try {
      res.json({
        availableCommands: [
          'setup',
          'start', 
          'validate'
        ],
        endpoint: '/commands/pre-compact',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[Commands] Error getting commands:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = createStatusRoutes;