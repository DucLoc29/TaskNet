import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 4000;
const STATUS = ["todo", "doing", "done"];

function genId() {
  return "t" + Math.random().toString(36).slice(2, 10);
}

// Seed data
let now = Date.now();
let todos = [
  { _id: genId(), title: "Buy groceries", status: "todo", dueDate: new Date(now + 86400000).toISOString().slice(0,10), createdAt: now - 100000 },
  { _id: genId(), title: "Read a book", status: "doing", dueDate: new Date(now + 2*86400000).toISOString().slice(0,10), createdAt: now - 90000 },
  { _id: genId(), title: "Finish project", status: "done", dueDate: null, createdAt: now - 80000 },
  { _id: genId(), title: "Call Alice", status: "todo", dueDate: null, createdAt: now - 70000 },
  { _id: genId(), title: "Workout", status: "doing", dueDate: new Date(now + 3*86400000).toISOString().slice(0,10), createdAt: now - 60000 },
  { _id: genId(), title: "Plan trip", status: "done", dueDate: new Date(now + 4*86400000).toISOString().slice(0,10), createdAt: now - 50000 },
];

todos.sort((a, b) => b.createdAt - a.createdAt);

app.get("/", (req, res) => {
  res.send("TaskNest API is running");
});

app.get("/api/todos", (req, res) => {
  let { page = 1, limit = 5, status, from, to, search, sort } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 5;
  let filtered = todos;
  if (status && STATUS.includes(status)) filtered = filtered.filter(t => t.status === status);
  if (from) filtered = filtered.filter(t => t.dueDate && t.dueDate >= from);
  if (to) filtered = filtered.filter(t => t.dueDate && t.dueDate <= to);
  if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  
  // Apply sorting
  if (sort === "status") {
    // Sort by status: doing -> todo -> done
    const statusOrder = { doing: 0, todo: 1, done: 2 };
    filtered = filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  } else {
    // Default sort by creation date (newest first)
    filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
  }
  
  const total = filtered.length;
  const items = filtered.slice((page-1)*limit, page*limit);
  res.json({ items, total });
});

app.post("/api/todos", (req, res) => {
  let { title, status, dueDate } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title required" });
  }
  status = STATUS.includes(status) ? status : "todo";
  dueDate = dueDate ? dueDate : null;
  const todo = { _id: genId(), title: title.trim(), status, dueDate, createdAt: Date.now() };
  todos.unshift(todo);
  res.status(201).json(todo);
});

app.patch("/api/todos/:id", (req, res) => {
  const idx = todos.findIndex(t => t._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const todo = todos[idx];
  const { title, status, dueDate } = req.body;
  if (title !== undefined) {
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title required" });
    }
    todo.title = title.trim();
  }
  if (status !== undefined) {
    if (!STATUS.includes(status)) return res.status(400).json({ error: "invalid status" });
    todo.status = status;
  }
  if (dueDate !== undefined) {
    todo.dueDate = dueDate;
  }
  res.json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const idx = todos.findIndex(t => t._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  todos.splice(idx, 1);
  res.status(204).end();
});

app.get("/api/todos/stats", (req, res) => {
  const stats = { total: todos.length, todo: 0, doing: 0, done: 0 };
  for (const t of todos) {
    if (STATUS.includes(t.status)) stats[t.status]++;
  }
  res.json(stats);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
