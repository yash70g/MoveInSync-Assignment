import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import deviceRoutes from './routes/deviceRoutes.js';
import versionRoutes from './routes/versionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/devices', deviceRoutes);
app.use('/api/versions', versionRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MDM Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

