import dotenv from 'dotenv';
dotenv.config();

// Import necessary modules
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Import M-Pesa API routes
import stkPushRouter from './api/mpesa/stk-push/routes.js';
import queryRouter from './api/mpesa/query/routes.js';
import callbackRouter from './api/mpesa/callback/routes.js';

// Mount M-Pesa routes
app.use('/api/mpesa/stk-push', stkPushRouter);
app.use('/api/mpesa/query', queryRouter);
app.use('/api/mpesa/callback', callbackRouter);

// Serve static files (optional, for production)
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch-all route for undefined endpoints
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});