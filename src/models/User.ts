import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    roll_no?: string;
    className?: string; // "class" is a reserved keyword in JS/TS
    role: "student" | "admin" | "teacher";
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        roll_no: { type: String },
        className: { type: String },
        role: {
            type: String,
            enum: ["student", "admin", "teacher"],
            default: "student",
        },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
