import { useEffect, useState } from "react";
import Dropdown from "./Dropdown";
import DatePicker from "./DatePicker";

const STATUS = ["todo", "doing", "done"];

// UI: Edit Modal
function EditModal({ open, task, onCancel, onSave }) {
  const [form, setForm] = useState({ title: "", status: "todo", dueDate: "" });
  
  useEffect(() => {
    if (open && task) {
      setForm({
        title: task.title || "",
        status: task.status || "todo",
        dueDate: task.dueDate || ""
      });
    }
  }, [open, task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-lg font-semibold text-slate-800">Edit Task</div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Task title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <Dropdown
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
              options={STATUS.map(s => ({ label: s, value: s }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <DatePicker
              value={form.dueDate}
              onChange={(val) => setForm(f => ({ ...f, dueDate: val }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;
