import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import studentRoutes from './routes/student.routes';
import transactionRoutes from './routes/transaction.routes';
import authRoutes from './routes/auth.routes';
import exportRoutes from './routes/export.routes';
import auditRoutes from './routes/audit.routes';
import sessionRoutes from './routes/session.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
export const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Allow all origins for LAN access
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/session/import', express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('TANGLAW POS API is running');
});

// Database Connection Check
prisma.$connect()
  .then(() => console.log('Connected to Database'))
  .catch((err) => console.error('Database Connection Failed:', err));

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Keep process alive hack
setInterval(() => { }, 10000);
