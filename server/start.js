import { config } from 'dotenv';

// Load .env from root directory
config({ path: '../.env' });

// Import and start the server
import('../dist/index.js');
