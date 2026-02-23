import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import versionRoutes from './routes/versionRoutes.js';
import liveUpdateRoutes from './routes/liveUpdateRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/live-updates', liveUpdateRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MDM Server is running' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('start-update', async ({ imei, updateId }) => {
    console.log(`Starting update for device ${imei}, update ${updateId}`);
    const { handleUpdateProcess } = await import('./controllers/updateController.js');
    handleUpdateProcess(socket, imei, updateId);
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

