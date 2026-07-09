import mongoose from "mongoose";
interface INote{
    title:string,
    content:string,
      tags:string[],
      imageUrls:string[],
}
const noteSchema = new mongoose.Schema<INote>(
    {
        title:{
            type:String,
            required:true,
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