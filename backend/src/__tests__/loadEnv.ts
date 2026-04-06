import { config } from 'dotenv';
import path from 'path';

// Load .env.test BEFORE any source module is imported.
// dotenv won't override vars already in process.env, so running this
// first ensures test values win over any .env that config/index.ts loads.
config({ path: path.resolve(__dirname, '../../.env.test') });
