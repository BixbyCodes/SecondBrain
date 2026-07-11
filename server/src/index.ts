import express from "express";

import mongoose from "mongoose";
import Note from "./models/Note.js";
import noteRoutes from "./routes/noteRoutes.js"; 
import "dotenv/config"; 
 import authRoutes from "./routes/authRoutes.js";
import { protect } from "./middleware/authMiddleware.js";

const app = express();
app.use(express.json()); 
import cors from "cors";

app.use(cors());          // allow requests from your frontend (dev: allow all)

app.use("/auth", authRoutes);
app.use("/notes", protect, noteRoutes);
const PORT = process.env.PORT || 3000; 

app.get("/",(req,res) =>{
    res.send("Hello from Second Brain Server")
});
app.get("/health",(req,res)=>{
   
    res.json({status:"ok"});
})



async function startServer(){
    try{
        await mongoose.connect(process.env.MONGODB_URI as string)
         console.log("MongoDB connected");
         app.listen(PORT,()=>{
            console.log(`Server running at http://localhost:${PORT}`);
         });
    
    }catch (error){
        console.error("❌ Failed to connect to MongoDB", error);
         process.exit(1);  
    }
}startServer();


