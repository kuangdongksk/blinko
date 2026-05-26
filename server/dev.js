import { config } from 'dotenv';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
const envPath = resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

// Log critical environment variables (for debugging)
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Start tsx watch with inherited environment
const tsxProcess = spawn('tsx', ['watch', 'index.ts'], {
  stdio: 'inherit',
  env: process.env, // Directly inherit all environment variables
  cwd: __dirname
});

tsxProcess.on('exit', (code) => {
  process.exit(code || 0);
});

tsxProcess.on('error', (err) => {
  console.error('Failed to start tsx:', err);
  process.exit(1);
});
