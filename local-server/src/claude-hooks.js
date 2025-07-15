const path = require('path');
const os = require('os');
const fs = require('fs').promises;

const HOOK_CONFIG = {
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command", 
            "command": "curl -s -X POST http://localhost:3001/commands/pre-compact -H 'Content-Type: application/json' -d '{\"command\":\"validate\"}' || true"
          },
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:3001/hooks/tool-start || true"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:3001/hooks/tool-complete || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:3001/hooks/session-end || true"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:3001/hooks/permission-request || true"
          }
        ]
      }
    ]
  }
};

function getClaudeSettingsPath() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude', 'settings.json');
}

async function readClaudeSettings() {
  try {
    const settingsPath = getClaudeSettingsPath();
    const data = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeClaudeSettings(settings) {
  const settingsPath = getClaudeSettingsPath();
  const settingsDir = path.dirname(settingsPath);
  
  try {
    await fs.mkdir(settingsDir, { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    throw error;
  }
}

async function installHooks() {
  try {
    console.log('[Hooks] Installing Claude Code hooks...');
    
    const existingSettings = await readClaudeSettings();
    const mergedSettings = {
      ...existingSettings,
      hooks: {
        ...existingSettings.hooks,
        ...HOOK_CONFIG.hooks
      }
    };
    
    await writeClaudeSettings(mergedSettings);
    
    console.log('[Hooks] Hooks installed successfully!');
    console.log(`[Hooks] Settings file: ${getClaudeSettingsPath()}`);
    
    return true;
  } catch (error) {
    console.error('[Hooks] Error installing hooks:', error);
    throw error;
  }
}

async function removeHooks() {
  try {
    console.log('[Hooks] Removing Claude Code hooks...');
    
    const existingSettings = await readClaudeSettings();
    
    if (existingSettings.hooks) {
      delete existingSettings.hooks.PreToolUse;
      delete existingSettings.hooks.PostToolUse;
      delete existingSettings.hooks.Stop;
      delete existingSettings.hooks.Notification;
      
      if (Object.keys(existingSettings.hooks).length === 0) {
        delete existingSettings.hooks;
      }
    }
    
    await writeClaudeSettings(existingSettings);
    
    console.log('[Hooks] Hooks removed successfully!');
    return true;
  } catch (error) {
    console.error('[Hooks] Error removing hooks:', error);
    throw error;
  }
}

async function checkHooksInstalled() {
  try {
    const settings = await readClaudeSettings();
    return !!(settings.hooks && settings.hooks.PreToolUse);
  } catch (error) {
    return false;
  }
}

module.exports = {
  installHooks,
  removeHooks,
  checkHooksInstalled,
  getClaudeSettingsPath,
  HOOK_CONFIG
};