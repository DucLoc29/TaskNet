import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true, index: true },
  email: { type: String, lowercase: true, trim: true, index: true },
  name: String,
  avatar: String,
}, { timestamps: true });

export default mongoose.model("User", userSchema);
