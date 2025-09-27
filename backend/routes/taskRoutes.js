// routes/taskRoutes.js
import express from "express";
import mongoose from "mongoose";
import Task from "../models/task.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();
const STATUS = ["todo", "doing", "done"];

// Helper
const isValidDate = (d) => d instanceof Date && !isNaN(d);
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

// ================= GET /api/tasks =================
router.get("/tasks", requireAuth, async (req, res) => {
  try {
    // Disable caching to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    let { page = 1, limit = 5, status, from, to, search, sort } = req.query;
    page = clamp(parseInt(page) || 1, 1, 1e9);
    limit = clamp(parseInt(limit) || 5, 1, 100);

    // Build filter - ALWAYS filter by userId for user isolation
    const filter = { userId: req.userId };
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
      // Use simple find instead of aggregate pipeline
      const items = await Task.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return res.json({ items, total, page, limit });
    }

    // Mặc định: newest first
    const items = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    console.log('📋 Items returned (find):', items.length);
    console.log('📋 Items:', items.map(item => ({ title: item.title, status: item.status, dueDate: item.dueDate })));

    res.json({ items, total, page, limit });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ================= POST /api/tasks =================
router.post("/tasks", requireAuth, async (req, res) => {
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
      userId: req.userId, // Always link task to current user
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ================= PATCH /api/tasks/:id =================
router.patch("/tasks/:id", requireAuth, async (req, res) => {
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

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.userId }, // Only update current user's tasks
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ================= DELETE /api/tasks/:id =================
router.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "invalid id" });

    const task = await Task.findOneAndDelete({ _id: id, userId: req.userId }); // Only delete current user's tasks
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ================= GET /api/tasks/stats =================
router.get("/tasks/stats", requireAuth, async (req, res) => {
  try {
    // Disable caching to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const { from, to } = req.query;
    console.log('📊 GET /tasks/stats - Query params:', { from, to });
    console.log('👤 User ID:', req.userId);

    const match = { userId: req.userId }; // Only show current user's tasks stats
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

    console.log('🔍 Final match filter:', JSON.stringify(match, null, 2));

    // Use simple find instead of aggregate pipeline (like we did for table)
    const tasks = await Task.find(match).lean();
    console.log('📊 Found tasks:', tasks.length);
    console.log('📊 Sample tasks:', tasks.slice(0, 3).map(t => ({ title: t.title, status: t.status, dueDate: t.dueDate })));

    // Calculate stats manually
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      doing: tasks.filter(t => t.status === 'doing').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    console.log('📊 Stats result:', stats);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;

