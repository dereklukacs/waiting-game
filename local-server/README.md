# Waiting Game - Local Server

A local server that hooks into Claude Code lifecycle events to create an interactive gaming experience.

## Quick Start

1. **Setup (one time):**
   ```bash
   npx waiting-game setup
   ```

2. **Start playing:**
   ```bash
   npx waiting-game start
   ```

## Commands

- `npx waiting-game setup` - Install Claude Code hooks (doesn't start anything)
- `npx waiting-game start` - Start server and launch game
- `npx waiting-game status` - Check if hooks are installed
- `npx waiting-game uninstall` - Remove hooks

## How it Works

1. **Setup** installs hooks into your Claude Code configuration (`~/.claude/settings.json`)
2. **Start** launches a local server on port 3001 and opens the game
3. Claude Code hooks automatically notify the server when tools run
4. The game polls the server to know Claude's status and pauses/resumes accordingly

## API Endpoints

- `GET /status` - Get current Claude status
- `GET /health` - Health check
- `POST /hooks/tool-start` - Called by Claude hooks when tool starts
- `POST /hooks/tool-complete` - Called by Claude hooks when tool completes
- `POST /hooks/session-end` - Called by Claude hooks when session ends

## States

- `idle` - Claude is not working
- `working` - Claude is actively working
- `tool-executing` - Claude is running a specific tool

## Troubleshooting

- Make sure you have Node.js 16+ installed
- Check that Claude Code is properly configured
- The game expects to run on localhost:5173 (default Vite port)
- Hooks require curl to be available in your PATH