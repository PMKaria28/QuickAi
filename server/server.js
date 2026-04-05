// VERCEL DEPLOYMENT: Commenting out traditional server setup
// Use api/index.js for serverless deployment on Vercel

// import express from "express";
// import cors from "cors";
// import 'dotenv/config';
// import { clerkMiddleware, requireAuth } from '@clerk/express'
// import aiRouter from "./routes/aiRoutes.js";
// import connectCloudinary from "./configs/cloudinary.js";
// import userRouter from "./routes/userRoutes.js";
//
// const app = express()
//
// await connectCloudinary()
//
// app.use(cors())
// app.use(clerkMiddleware())
//
// app.use(express.json({ limit: '10mb' }))
// app.use(express.urlencoded({ extended: true, limit: '10mb' }))
//
// // Add timeout middleware
// app.use((req, res, next) => {
//   req.setTimeout(60000); // 60 seconds
//   res.setTimeout(60000);
//   next();
// });
//
// app.get('/',(req,res)=>{
//     res.send("Server is Live! ")
// })
//
// app.use(requireAuth())
//
// app.use('/api/ai',aiRouter)
// app.use('/api/user',userRouter)
// const PORT = process.env.PORT || 3000;
//
// app.listen(PORT,()=>{
//     console.log("Server is running on port ",PORT);
// })

// For local development, uncomment below:
import app from "./api/index.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});