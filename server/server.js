import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import deviceRoutes from './routes/deviceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/devices', deviceRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'MDM Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
