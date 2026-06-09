import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

import aiRouter from './routes/ai';
import matchRouter from './routes/match';
import webhooksRouter from './routes/webhooks';

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = process.env.VITE_FRONTEND_URL 
  ? process.env.VITE_FRONTEND_URL.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/ai', aiRouter);
app.use('/api/match', matchRouter);
app.use('/api/webhooks', webhooksRouter);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../dist')));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
