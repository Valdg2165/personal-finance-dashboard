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
import recurringTransactionRoutes from './routes/recurringTransactionRoutes.js';
import { startRecurringScheduler } from './utils/recurringScheduler.js';

// import { initTrueLayer } from './services/truelayerService.js';

const app = express();

const allowedOrigins = [
    'http://localhost:5173', 
    'https://finance-software-dev-fontend.onrender.com' // L'URL de votre frontend Render
    // Ajoutez d'autres domaines si nécessaire
];

const corsOptions = {
    // Si l'environnement n'est pas "production" ou "staging", nous pouvons être plus flexibles.
    origin: (origin, callback) => {
        // Permettre les requêtes sans 'origin' (par exemple, Postman ou requêtes serveur à serveur)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Vous pouvez commenter cette ligne pour le débogage initial si vous êtes sûr de l'URL du frontend
            callback(new Error('Not allowed by CORS')); 
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
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
app.use('/api/recurring-transactions', recurringTransactionRoutes);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and TrueLayer, then start server
connectDB().then(async () => {
  try {
    // await initTrueLayer();
  } catch (error) {
    console.log('TrueLayer not configured');
  }
  
  // Start recurring transaction scheduler
  startRecurringScheduler();
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
