import express from "express";
import Note from "../models/Note.js";
import { getEmbedding } from "../lib/embedding.js";

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const embedding = await getEmbedding(`${req.body.title}\n${req.body.content}`);
const newNote = await Note.create({ ...req.body, owner: req.userId, embedding });
console.log("Embedding length:", embedding.length);

    // push the new note live to all of this user's open tabs
    const io = req.app.get("io");
    io.to(`user:${req.userId}`).emit("noteCreated", newNote);

    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: "Failed to create note", error });
  }
});


router.get("/",async(req,res)=>{
    try{
     const allNotes = await Note.find({ owner: req.userId });
    res.json(allNotes);
    }catch(error){
         res.status(500).json({ message: "Something went wrong", error });
    }
})
router.get("/:id",async (req,res)=>{
    try{
    const notesId = await Note.findOne({ _id: req.params.id, owner: req.userId });
     if (!notesId) {
      return res.status(404).json({ message: "Note not found" });  // ← the real 404
    }
    res.json(notesId);
    }catch(error){
       res.status(500).json({ message: "Something went wrong", error });
    }
})

router.patch("/:id",async(req,res)=>{
    try{
  const notesId = await Note.findOneAndUpdate(
  { _id: req.params.id, owner: req.userId },  // only find it if it's THIS user's note
  req.body,                                   // the fields to change
  { new: true, runValidators: true }          // the options
);

    if (!notesId) {
      return res.status(404).json({ message: "Note not found" });  // ← the real 404
    }

    const io = req.app.get("io");
    io.to(`user:${req.userId}`).emit("noteUpdated", notesId);

    res.json(notesId);
    }catch(error){
  res.status(500).json({ message: "Something went wrong", error });
    }
})
router.delete("/:id", async (req, res) => {
  try {
    const notesId = await Note.findOneAndDelete({ _id: req.params.id, owner: req.userId });

    if (!notesId) {                                                 // ② null → 404
      return res.status(404).json({ message: "Note not found" });
    }

    const io = req.app.get("io");
    io.to(`user:${req.userId}`).emit("noteDeleted", req.params.id);

    res.status(200).json({ message: "Note deleted" });             // ③ success reply
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});




export default router;