import mongoose from "mongoose";

// schema  Task
const taskSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    status: { 
      type: String, 
      enum: ["todo", "doing", "done"], 
      default: "todo" 
    },
    dueDate: { 
      type: Date, 
      default: null 
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { 
    timestamps: true 
  }
);

//  model Task fr schema
const Task = mongoose.model("tasks", taskSchema);

export default Task;
