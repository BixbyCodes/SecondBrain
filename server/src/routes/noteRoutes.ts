import express from "express";
import Note from "../models/Note.js";
const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const newNote = await Note.create(req.body);
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: "Failed to create note", error });
  }
});


router.get("/",async(req,res)=>{
    try{
    const allNotes = await Note.find();
    res.json(allNotes);
    }catch(error){
         res.status(500).json({ message: "Something went wrong", error });
    }
})
router.get("/:id",async (req,res)=>{
    try{
    const notesId = await Note.findById(req.params.id);
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
  const notesId = await Note.findByIdAndUpdate(
  req.params.id,                          // 1: which note
  req.body,                               // 2: the fields to change
  { new: true, runValidators: true }      // 3: the options
);

    if (!notesId) {
      return res.status(404).json({ message: "Note not found" });  // ← the real 404
    }
    res.json(notesId);
    }catch(error){
  res.status(500).json({ message: "Something went wrong", error });
    }
})
router.delete("/:id", async (req, res) => {
  try {
    const notesId = await Note.findByIdAndDelete(req.params.id);   // ① pass the id!

    if (!notesId) {                                                 // ② null → 404
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted" });             // ③ success reply
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

















export default router;