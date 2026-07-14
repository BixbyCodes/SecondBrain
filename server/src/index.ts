import "dotenv/config"; 
import express from "express";

import mongoose from "mongoose";
import Note from "./models/Note.js";
import noteRoutes from "./routes/noteRoutes.js"; 

 import authRoutes from "./routes/authRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import cors from "cors";
import aiRoutes from "./routes/aiRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";



const app = express();

app.use(express.json()); 


app.use(cors());          // allow requests from your frontend (dev: allow all)

app.use("/auth", authRoutes);
app.use("/notes", protect, noteRoutes);
app.use("/ai", aiRoutes);
const PORT = process.env.PORT || 3000; 

app.get("/",(req,res) =>{
    res.send("Hello from Second Brain Server")
});
app.get("/health",(req,res)=>{
   
    res.json({status:"ok"});
})

const httpServer = createServer(app);         
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },   
});
app.set("io", io);                           


io.on("connection", (socket) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    socket.join(`user:${decoded.userId}`);     
    console.log("🔌 socket connected:", decoded.userId);
  } catch {
    socket.disconnect();                         
  }
});


async function startServer(){
    try{
        await mongoose.connect(process.env.MONGODB_URI as string)
         console.log("MongoDB connected");
         httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

    
    }catch (error){
        console.error("❌ Failed to connect to MongoDB", error);
         process.exit(1);  
    }
}startServer();


