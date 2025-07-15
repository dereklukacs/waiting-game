#!/usr/bin/env node

const { Command } = require('commander');
const { spawn } = require('child_process');
const path = require('path');
const { installHooks, removeHooks, checkHooksInstalled } = require('../src/claude-hooks');

const program = new Command();

program
  .name('waiting-game')
  .description('Local server for the waiting game that hooks into Claude Code')
  .version('1.0.0');

program
  .command('setup')
  .description('Install Claude Code hooks (does not start the server)')
  .action(async () => {
    try {
      const alreadyInstalled = await checkHooksInstalled();
      
      if (alreadyInstalled) {
        console.log('✅ Hooks are already installed!');
        console.log('💡 Use "npx waiting-game start" to begin playing');
        return;
      }
      
      await installHooks();
      console.log('✅ Setup complete!');
      console.log('💡 Use "npx waiting-game start" to begin playing');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('start')
  .description('Start the local server and launch the game')
  .option('-p, --port <port>', 'Server port', '3001')
  .action(async (options) => {
    try {
      const hooksInstalled = await checkHooksInstalled();
      
      if (!hooksInstalled) {
        console.log('⚠️  Hooks not installed. Installing them first...');
        await installHooks();
        console.log('✅ Hooks installed!');
      }
      
      console.log(`🚀 Starting server on port ${options.port}...`);
      
      const serverPath = path.join(__dirname, '..', 'src', 'server.js');
      const serverProcess = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: { ...process.env, PORT: options.port }
      });
      
      setTimeout(() => {
        const gameUrl = `https://waiting-game.vercel.app?serverPort=${options.port}`;
        console.log(`🎮 Opening game at: ${gameUrl}`);
        
        const openCommand = process.platform === 'darwin' ? 'open' : 
                           process.platform === 'win32' ? 'start' : 'xdg-open';
        
        spawn(openCommand, [gameUrl], { detached: true, stdio: 'ignore' });
      }, 2000);
      
      serverProcess.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
      });
      
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        serverProcess.kill('SIGINT');
      });
      
    } catch (error) {
      console.error('❌ Failed to start:', error.message);
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Remove Claude Code hooks')
  .action(async () => {
    try {
      await removeHooks();
      console.log('✅ Hooks removed successfully!');
    } catch (error) {
      console.error('❌ Failed to remove hooks:', error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check if hooks are installed')
  .action(async () => {
    try {
      const installed = await checkHooksInstalled();
      if (installed) {
        console.log('✅ Hooks are installed');
      } else {
        console.log('❌ Hooks are not installed');
        console.log('💡 Run "npx waiting-game setup" to install');
      }
    } catch (error) {
      console.error('❌ Error checking status:', error.message);
    }
  });

program.parse();