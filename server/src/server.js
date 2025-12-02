import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import truelayerRoutes from './routes/truelayerRoutes.js';
import { initTrueLayer } from './services/truelayerService.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/truelayer', truelayerRoutes);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and TrueLayer, then start server
connectDB().then(async () => {
  try {
    await initTrueLayer();
  } catch (error) {
    console.log('TrueLayer not configured');
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
