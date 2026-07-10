import mongoose from "mongoose";
import bcrypt from "bcrypt";

interface IUser{
    email:string;
    password:string,
    name?:string,
}

const userSchema = new mongoose.Schema<IUser>(
    {
       email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        unique: true,
    },
    password:{
        type:String,
        required:true,


    },
    name:{
          type:String,
    }
    },{
       timestamps: true 
    }
)
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

const User= mongoose.model<IUser>("User",userSchema);

export default User;