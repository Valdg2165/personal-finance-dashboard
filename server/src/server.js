import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import gocardlessRoutes from './routes/gocardlessRoutes.js'; // ADD THIS
import { initGoCardless } from './services/gocardlessService.js'; // ADD THIS

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
app.use('/api/gocardless', gocardlessRoutes); // ADD THIS

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and GoCardless, then start server
connectDB().then(async () => {
  try {
    await initGoCardless(); // ADD THIS
  } catch (error) {
    console.log('GoCardless not configured');
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
