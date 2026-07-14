import mongoose from "mongoose";
interface INote{
    title:string,
    content:string,
      tags:string[],
      imageUrls:string[],
      embedding? : number[];
      owner: mongoose.Types.ObjectId;

}
const noteSchema = new mongoose.Schema<INote>(
    {
        title:{
            type:String,
            required:true,
        },
        owner: {
  type: mongoose.Schema.Types.ObjectId,  
  ref: "User",                          
  required: true,
},

        content:{
            type:String,
            required:true,
        },
        embedding: { type: [Number], default: [] },

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