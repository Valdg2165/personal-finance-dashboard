import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import truelayerRoutes from './routes/truelayerRoutes.js';

// import { initTrueLayer } from './services/truelayerService.js';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/truelayer', truelayerRoutes);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and TrueLayer, then start server
connectDB().then(async () => {
  try {
    // await initTrueLayer();
  } catch (error) {
    console.log('TrueLayer not configured');
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
