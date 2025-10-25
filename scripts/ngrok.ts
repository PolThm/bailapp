import { spawn } from 'child_process';

// Bun automatically loads .env files, so process.env.NGROK_DOMAIN should be available

const domain = process.env.NGROK_DOMAIN;

if (!domain) {
  console.error('NGROK_DOMAIN is not set in .env file');
  process.exit(1);
}

console.log(`Starting ngrok with domain: ${domain}`);

const ngrok = spawn('ngrok', ['http', '5173', '--domain', domain], {
  stdio: 'inherit',
  shell: false,
});

ngrok.on('error', (error) => {
  console.error('Failed to start ngrok:', error);
  process.exit(1);
});

ngrok.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle process termination
process.on('SIGINT', () => {
  ngrok.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  ngrok.kill('SIGTERM');
  process.exit(0);
});
