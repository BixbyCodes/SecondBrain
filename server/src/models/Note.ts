import mongoose from "mongoose";
interface INote{
    title:string,
    content:string,
      tags:string[],
      imageUrls:string[],
      owner: mongoose.Types.ObjectId;

}
const noteSchema = new mongoose.Schema<INote>(
    {
        title:{
            type:String,
            required:true,
        },
        owner: {
  type: mongoose.Schema.Types.ObjectId,   // stores a reference to another document's _id
  ref: "User",                              // that document lives in the User collection
  required: true,
},

        content:{
            type:String,
            required:true,
        },
        tags:{
           type: [String], default: [] 
        },
        imageUrls:{
            type: [String], default: []
        }
    },
     { timestamps: true } 
    
);
const Note = mongoose.model<INote>("Note",noteSchema);


export default Note;