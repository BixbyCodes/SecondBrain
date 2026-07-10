import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    
    const { email, password, name } = req.body;

if (!email || !password) {
  return res.status(400).json({ message: "Email and password are required" });
}

    const existing = await User.findOne({ email });
  if (existing) {
  return res.status(409).json({ message: "Email already in use" });
}
      const user = await User.create({ email, password, name });
       res.status(201).json({ _id: user._id, email: user.email, name: user.name });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});
router.post("/login",async(req,res)=>{
    try{
      
      const { email, password } = req.body;
if (!email || !password) {
  return res.status(400).json({ message: "Email and password are required" });
}

      const user = await User.findOne({email});
      if(!user){
        return res.status(401).json({message:"Invalid credenmtials"});
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }  
       
    );
    res.json({ token, user: { _id: user._id, email: user.email, name: user.name } });
    }catch(error){
res.status(500).json({ message: "Something went wrong", error });
    }

})
export default router;
