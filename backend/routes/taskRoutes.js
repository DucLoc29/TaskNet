// routes/taskRoutes.js
import express from "express";
import mongoose from "mongoose";
import Task from "../models/task.js";

const router = express.Router();
const STATUS = ["todo", "doing", "done"];

// Helper
const isValidDate = (d) => d instanceof Date && !isNaN(d);
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

// ================= GET /api/tasks =================
router.get("/tasks", async (req, res) => {
  try {
    let { page = 1, limit = 5, status, from, to, search, sort } = req.query;
    page = clamp(parseInt(page) || 1, 1, 1e9);
    limit = clamp(parseInt(limit) || 5, 1, 100);

    // Build filter
    const filter = {};
    if (status && STATUS.includes(status)) filter.status = status;

    if (from || to) {
      const range = {};
      if (from) {
        const f = new Date(from);
        if (isValidDate(f)) {
          f.setHours(0, 0, 0, 0);
          range.$gte = f;
        }
      }
      if (to) {
        const t = new Date(to);
        if (isValidDate(t)) {
          t.setHours(23, 59, 59, 999);
          range.$lte = t;
        }
      }
      if (Object.keys(range).length) {
        // Handle both Date objects and string dates
        filter.$or = [
          { dueDate: range },
          { 
            dueDate: {
              $gte: from,
              $lte: to
            }
          }
        ];
      }
    }

    if (search) filter.title = { $regex: search, $options: "i" };

    const total = await Task.countDocuments(filter);

    if (sort === "status") {
      // doing -> todo -> done, then by dueDate (ascending), then by title (A-Z)
      const items = await Task.aggregate([
        { $match: filter },
        {
          $addFields: {
            statusOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", "doing"] }, then: 0 },
                  { case: { $eq: ["$status", "todo"] }, then: 1 },
                  { case: { $eq: ["$status", "done"] }, then: 2 },
                ],
                default: 3,
              },
            },
            // Convert dueDate to Date for proper sorting
            dueDateSort: {
              $cond: {
                if: { $eq: [{ $type: "$dueDate" }, "string"] },
                then: { $dateFromString: { dateString: "$dueDate" } },
                else: "$dueDate"
              }
            }
          },
        },
        { 
          $sort: { 
            statusOrder: 1,           // doing -> todo -> done
            dueDateSort: 1,           // ngày từ bé đến lớn
            title: 1                  // tên A-Z
          } 
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { statusOrder: 0, dueDateSort: 0 } },
      ]);
      return res.json({ items, total, page, limit });
    }

    // Mặc định: newest first
    const items = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ items, total, page, limit });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ================= POST /api/tasks =================
router.post("/tasks", async (req, res) => {
  try {
    let { title, status, dueDate } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title required" });
    }

    status = STATUS.includes(status) ? status : "todo";
    const parsedDue = dueDate ? new Date(dueDate) : null;
    if (dueDate && !isValidDate(parsedDue)) {
      return res.status(400).json({ error: "invalid dueDate" });
    }

    const task = new Task({
      title: title.trim(),
      status,
      dueDate: parsedDue,
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ================= PATCH /api/tasks/:id =================
router.patch("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "invalid id" });

    const { title, status, dueDate } = req.body;
    const updateData = {};

    if (title !== undefined) {
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title required" });
      }
      updateData.title = title.trim();
    }

    if (status !== undefined) {
      if (!STATUS.includes(status)) {
        return res.status(400).json({ error: "invalid status" });
      }
      updateData.status = status;
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        updateData.dueDate = null;
      } else {
        const parsed = new Date(dueDate);
        if (!isValidDate(parsed)) {
          return res.status(400).json({ error: "invalid dueDate" });
        }
        updateData.dueDate = parsed;
      }
    }

    const task = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ================= DELETE /api/tasks/:id =================
router.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "invalid id" });

    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ================= GET /api/tasks/stats =================
router.get("/tasks/stats", async (req, res) => {
  try {
    const { from, to } = req.query;

    const match = {};
    const range = {};
    if (from) {
      const f = new Date(from);
      if (isValidDate(f)) {
        f.setHours(0, 0, 0, 0);
        range.$gte = f;
      }
    }
    if (to) {
      const t = new Date(to);
      if (isValidDate(t)) {
        t.setHours(23, 59, 59, 999);
        range.$lte = t;
      }
    }
    if (Object.keys(range).length) {
      // Handle both Date objects and string dates
      match.$or = [
        { dueDate: range },
        { 
          dueDate: {
            $gte: from,
            $lte: to
          }
        }
      ];
    }

    const stats = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
          doing: { $sum: { $cond: [{ $eq: ["$status", "doing"] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
        },
      },
      { $project: { _id: 0 } },
    ]);

    res.json(stats[0] || { total: 0, todo: 0, doing: 0, done: 0 });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;

