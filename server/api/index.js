import express from "express";
import cors from "cors";
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import aiRouter from "../routes/aiRoutes.js";
import connectCloudinary from "../configs/cloudinary.js";
import userRouter from "../routes/userRoutes.js";

const app = express()

// Initialize Cloudinary
await connectCloudinary()

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}))
app.use(clerkMiddleware())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Add timeout middleware
app.use((req, res, next) => {
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

app.get('/', (req, res) => {
  res.send("Server is Live!")
})

app.use(requireAuth())

app.use('/api/ai', aiRouter)
app.use('/api/user', userRouter)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
