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

  return router;
}

module.exports = createStatusRoutes;