import express from "express";

import mongoose from "mongoose";
import Note from "./models/Note.js";
import noteRoutes from "./routes/noteRoutes.js"; 
import "dotenv/config";  
const app = express();
app.use(express.json()); 

app.use("/notes", noteRoutes); 
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


