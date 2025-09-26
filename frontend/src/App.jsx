import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API || "http://localhost:4000/api";
const STATUS = ["todo", "doing", "done"];

function buildQuery(params) {
  const q = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `?${q}` : "";
}

// UI: Dropdown (custom, prettier than native select)
function Dropdown({ value, onChange, options, className = "", containerClass = "", placeholder = "Select" }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <div className={"relative " + containerClass}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={
          "flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-sm " +
          "border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 " +
          className
        }
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-500">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg" style={{ animation: "fadeScaleIn 120ms ease-out" }}>
          <ul className="max-h-60 overflow-auto py-1 text-sm">
            {options.map(opt => (
              <li key={String(opt.value)}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ target: { name: opt.name, value: opt.value } });
                    setOpen(false);
                  }}
                  className={
                    "flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50 " +
                    (String(opt.value) === String(value) ? "bg-teal-50 text-teal-700" : "text-slate-700")
                  }
                >
                  <span>{opt.label}</span>
                  {String(opt.value) === String(value) && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-teal-600">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0L3.296 9.47a1 1 0 011.416-1.412l3.02 3.02 6.54-6.54a1 1 0 011.432 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && (
        <button aria-label="close" className="fixed inset-0 z-10 block h-full w-full cursor-default" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

// UI: Toasts
function Toasts({ toasts, remove }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={
          "pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-sm transition " +
          (t.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")
        }>
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              {t.type === "error" ? (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              ) : (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{t.title}</div>
              {t.message && <div className="text-slate-700">{t.message}</div>}
            </div>
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-700">×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

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

// UI: Confirm Modal
function ConfirmModal({ open, title = "Confirm", message, onCancel, onConfirm, confirmText = "Confirm", cancelText = "Cancel" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-3 text-lg font-semibold text-slate-800">{title}</div>
        <div className="mb-5 text-slate-700">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50">{cancelText}</button>
          <button onClick={onConfirm} className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// Utils for date formatting
function toISODateString(date) {
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatDisplayDate(value) {
  if (!value) return "dd/mm/yyyy";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "dd/mm/yyyy";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function daysInMonth(year, monthIdx) { // monthIdx 0-11
  return new Date(year, monthIdx + 1, 0).getDate();
}

// UI: DatePicker (custom popover calendar with manual input)
function DatePicker({ value, onChange, className = "", containerClass = "", placeholder = "Due date" }) {
  const [open, setOpen] = useState(false);
  const [manualInput, setManualInput] = useState(value ? formatDisplayDate(value) : "");
  const [inputError, setInputError] = useState(false);
  const base = value ? new Date(value) : new Date();
  const [y, setY] = useState(base.getFullYear());
  const [m, setM] = useState(base.getMonth());

  useEffect(() => {
    setManualInput(value ? formatDisplayDate(value) : "");
    setInputError(false);
  }, [value]);

  const handleManualInput = (inputValue) => {
    setManualInput(inputValue);
    setInputError(false);
    
    // Clear the field if empty
    if (!inputValue.trim()) {
      onChange("");
      return;
    }
    
    // Try to parse the input as dd/mm/yyyy
    const parts = inputValue.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
      const year = parseInt(parts[2], 10);
      
      // Validate input
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        setInputError(true);
        return;
      }
      
      if (day < 1 || day > 31 || month < 0 || month > 11) {
        setInputError(true);
        return;
      }
      
      // Check if year is reasonable (1900-2100)
      if (year < 1900 || year > 2100) {
        setInputError(true);
        return;
      }
      
      const date = new Date(year, month, day);
      
      // Check if the date is valid (handles cases like 31/02/2025)
      if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        setInputError(true);
        return;
      }
      
      // Valid date - update
      onChange(toISODateString(date));
      setY(year);
      setM(month);
    } else if (inputValue.length > 0) {
      // Invalid format
      setInputError(true);
    }
  };

  const firstDay = new Date(y, m, 1).getDay(); // 0=Sun, 1=Mon, etc.
  const total = daysInMonth(y, m);
  const weeks = [];
  // Adjust for Monday-first week: if Sunday (0), make it 6; otherwise subtract 1
  const mondayFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  let day = 1 - mondayFirstDay;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      row.push(new Date(y, m, day));
      day++;
    }
    weeks.push(row);
  }
  const isSameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const today = new Date();

  return (
    <div className={"relative " + containerClass}>
      <input
        type="text"
        value={manualInput}
        onChange={(e) => handleManualInput(e.target.value)}
        placeholder={placeholder}
        className={
          "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm " +
          (inputError 
            ? "border-red-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200" 
            : "border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200") +
          " " + className
        }
        required
      />
      {inputError && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-2 py-1 text-xs text-white bg-red-600 rounded shadow-lg whitespace-nowrap">
          Invalid date format (dd/mm/yyyy)
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-red-600"></div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-slate-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-6H3v6a2 2 0 002 2z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-72 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl" style={{ animation: "fadeScaleIn 120ms ease-out" }}>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <div className="font-medium">{new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
            <div className="flex gap-1">
              <button className="rounded p-1 hover:bg-slate-100" onClick={() => { const nm = new Date(y, m - 1, 1); setY(nm.getFullYear()); setM(nm.getMonth()); }}>↑</button>
              <button className="rounded p-1 hover:bg-slate-100" onClick={() => { const nm = new Date(y, m + 1, 1); setY(nm.getFullYear()); setM(nm.getMonth()); }}>↓</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0 px-2 pb-2 text-center text-xs text-slate-500">
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (<div key={d} className="py-1">{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-0 px-2 pb-2 text-center text-sm">
            {weeks.map((row, i) => row.map((d, j) => {
              const inMonth = d.getMonth() === m;
              const selected = value && isSameDate(d, new Date(value));
              const isToday = isSameDate(d, today);
              return (
                <button
                  key={`${i}-${j}`}
                  type="button"
                  onClick={() => { onChange(toISODateString(d)); setOpen(false); }}
                  className={
                    "m-0.5 rounded-md px-0.5 py-1 " +
                    (selected ? "bg-teal-600 text-white" : inMonth ? "text-slate-800 hover:bg-slate-100" : "text-slate-400") +
                    (isToday && !selected ? " ring-1 ring-inset ring-slate-300" : "")
                  }
                >
                  {d.getDate()}
                </button>
              );
            }))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-sm">
          </div>
        </div>
      )}
      {open && (
        <button aria-label="close" className="fixed inset-0 z-20 block h-full w-full cursor-default" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({ title: "", status: "todo", dueDate: "" });
  const [query, setQuery] = useState({ search: "", status: "", from: "", to: "", page: 1, limit: 7, sort: "status" });
  // Local filters to avoid locking inputs while loading
  const [filters, setFilters] = useState({ search: "", status: "", from: "", to: "", limit: 7 });
  const [selectedRange, setSelectedRange] = useState("");
  const [data, setData] = useState({ items: [], total: 0 });
  const [stats, setStats] = useState({ total: 0, todo: 0, doing: 0, done: 0 });
  const [detailedStats, setDetailedStats] = useState({
    today: { total: 0, todo: 0, doing: 0, done: 0 },
    week: { total: 0, todo: 0, doing: 0, done: 0 },
    month: { total: 0, todo: 0, doing: 0, done: 0 }
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, message: "", onConfirm: null });
  const [editModal, setEditModal] = useState({ open: false, task: null });

  const addToast = (type, title, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, type, title, message }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3500);
  };
  const removeToast = id => setToasts(ts => ts.filter(t => t.id !== id));

  // Load detailed statistics
  const loadDetailedStats = async () => {
    try {
      const today = new Date();
      
      // Today: same day
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // Week: current week (Monday to Sunday)
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
      startOfWeek.setDate(today.getDate() + daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Month: current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const [todayRes, weekRes, monthRes] = await Promise.all([
        fetch(`${API}/tasks/stats?from=${toISODateString(todayStart)}&to=${toISODateString(todayEnd)}`),
        fetch(`${API}/tasks/stats?from=${toISODateString(startOfWeek)}&to=${toISODateString(endOfWeek)}`),
        fetch(`${API}/tasks/stats?from=${toISODateString(startOfMonth)}&to=${toISODateString(endOfMonth)}`)
      ]);

      const todayStats = todayRes.ok ? await todayRes.json() : { total: 0, todo: 0, doing: 0, done: 0 };
      const weekStats = weekRes.ok ? await weekRes.json() : { total: 0, todo: 0, doing: 0, done: 0 };
      const monthStats = monthRes.ok ? await monthRes.json() : { total: 0, todo: 0, doing: 0, done: 0 };

      setDetailedStats({
        today: todayStats,
        week: weekStats,
        month: monthStats
      });
    } catch (err) {
      console.error('Failed to load detailed stats:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [listRes, statsRes] = await Promise.all([
          fetch(`${API}/tasks${buildQuery(query)}`),
          fetch(`${API}/tasks/stats`),
        ]);
        if (!listRes.ok) throw new Error("Failed to load tasks");
        if (!statsRes.ok) throw new Error("Failed to load stats");
        const list = await listRes.json();
        const statsData = await statsRes.json();
        if (!ignore) {
          setData(list);
          setStats(statsData);
          // Load detailed stats
          await loadDetailedStats();
        }
      } catch (e) {
        if (!ignore) setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchAll();
    return () => { ignore = true; };
  }, [query]);

  const onFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const onFormSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.dueDate.trim()) {
      addToast("error", "Due date required", "Please select a due date for the task");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          status: form.status,
          dueDate: form.dueDate || null,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      setForm({ title: "", status: "todo", dueDate: "" });
      setQuery(q => ({ ...q, page: 1 }));
      addToast("success", "Task created");
    } catch (e) {
      setError(e.message);
      addToast("error", "Create failed", e.message);
    } finally {
      setLoading(false);
    }
  };
  const onQueryChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };
  const applyFilters = () => {
    setQuery(q => ({ ...q, ...filters, page: 1 }));
  };
  const clearFilters = () => {
    setFilters({ search: "", status: "", from: "", to: "", limit: filters.limit || 7 });
    setQuery(q => ({ ...q, search: "", status: "", from: "", to: "", page: 1 }));
    setSelectedRange("");
  };
  const onPage = dir => {
    setQuery(q => {
      const max = Math.ceil((data.total || 0) / (q.limit || 7));
      let page = q.page + dir;
      if (page < 1) page = 1;
      if (page > max) page = max;
      return { ...q, page };
    });
  };
  const onLimit = e => {
    const val = typeof e.target?.value !== 'undefined' ? +e.target.value : +e;
    setFilters(f => ({ ...f, limit: val }));
    setQuery(q => ({ ...q, limit: val, page: 1 }));
  };
  const onEdit = async (id, updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Update failed");
      setData(d => ({ ...d, items: d.items.map(t => t._id === id ? { ...t, ...updatedData } : t) }));
      
      // Reload detailed statistics
      await loadDetailedStats();
      
      addToast("success", "Task updated");
    } catch (e) {
      setError(e.message);
      addToast("error", "Update failed", e.message);
    } finally {
      setLoading(false);
    }
  };
  const onStatusChange = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      
      // Reload data from server to get updated list with proper sorting
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API}/tasks${buildQuery(query)}`),
        fetch(`${API}/tasks/stats`),
      ]);
      if (!listRes.ok) throw new Error("Failed to reload tasks");
      if (!statsRes.ok) throw new Error("Failed to reload stats");
      const list = await listRes.json();
      const statsData = await statsRes.json();
      setData(list);
      setStats(statsData);
      
      // Reload detailed statistics
      await loadDetailedStats();
      
      addToast("success", "Status updated");
    } catch (e) {
      setError(e.message);
      addToast("error", "Update failed", e.message);
    } finally {
      setLoading(false);
    }
  };
  const onDelete = async id => {
    setConfirm({
      open: true,
      message: "Delete this task? This action cannot be undone.",
      onConfirm: async () => {
        setConfirm({ open: false, message: "", onConfirm: null });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setQuery(q => ({ ...q }));
          addToast("success", "Task deleted");
    } catch (e) {
      setError(e.message);
          addToast("error", "Delete failed", e.message);
    } finally {
      setLoading(false);
    }
      }
    });
  };

  const maxPage = Math.max(1, Math.ceil((data.total || 0) / (query.limit || 7)));
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">TaskNet</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">Manage your tasks efficiently</p>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Side - Statistics Chart */}
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">Task Statistics</h2>
                <div className="text-base sm:text-lg font-semibold text-slate-800">
                  {selectedTimeRange === 'today' && (
                    <span>{new Date().toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  )}
                  {selectedTimeRange === 'week' && (() => {
                    const today = new Date();
                    const monday = new Date(today);
                    const daysToMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
                    monday.setDate(today.getDate() - daysToMonday);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    return (
                      <span>
                        {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    );
                  })()}
                  {selectedTimeRange === 'month' && (
                    <span>{new Date().toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}</span>
                  )}
                </div>
              </div>
              
              {/* Time Range Selector */}
              <div className="mb-3 sm:mb-4">
                <div className="flex rounded-lg border border-slate-200 p-1">
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'Week' },
                    { key: 'month', label: 'Month' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTimeRange(key)}
                      className={`flex-1 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                        selectedTimeRange === key
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                {/* Total Card - Full Width */}
                <div className={`rounded-lg p-2 sm:p-3 text-center ${
                  detailedStats[selectedTimeRange].total === 0 
                    ? 'bg-slate-50 border-2 border-dashed border-slate-200' 
                    : detailedStats[selectedTimeRange].done === detailedStats[selectedTimeRange].total && detailedStats[selectedTimeRange].total > 0
                    ? 'bg-yellow-50 border-2 border-yellow-200'
                    : 'bg-slate-100'
                }`}>
                  {detailedStats[selectedTimeRange].total === 0 ? (
                    <>
                      <div className="text-lg sm:text-2xl font-bold text-slate-400">Clean</div>
                      <div className="text-xs sm:text-sm text-slate-500">No tasks</div>
                    </>
                  ) : detailedStats[selectedTimeRange].done === detailedStats[selectedTimeRange].total ? (
                    <>
                      <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                        {detailedStats[selectedTimeRange].done}/{detailedStats[selectedTimeRange].total}
                      </div>
                      <div className="text-xs sm:text-sm text-yellow-600">All completed!</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg sm:text-2xl font-bold text-slate-800">
                        {detailedStats[selectedTimeRange].done}/{detailedStats[selectedTimeRange].total}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600">Completed tasks</div>
                    </>
                  )}
                </div>
                
                {/* Status Cards - 3 columns */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-lg bg-slate-100 p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-slate-800">{detailedStats[selectedTimeRange].todo}</div>
                    <div className="text-xs sm:text-sm text-slate-600">Todo</div>
                  </div>
                  <div className="rounded-lg bg-blue-100 p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-700">{detailedStats[selectedTimeRange].doing}</div>
                    <div className="text-xs sm:text-sm text-blue-600">Doing</div>
                  </div>
                  <div className="rounded-lg bg-emerald-100 p-2 sm:p-3 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-emerald-700">{detailedStats[selectedTimeRange].done}</div>
                    <div className="text-xs sm:text-sm text-emerald-600">Done</div>
                  </div>
                </div>
              </div>
              
              {/* Progress Chart */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xs sm:text-sm font-medium text-slate-700">Progress Overview</h3>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-600">Doing</span>
                    <span className="font-medium text-blue-700">{detailedStats[selectedTimeRange].doing}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div 
                      className="h-2 rounded-full bg-blue-500" 
                      style={{ width: `${detailedStats[selectedTimeRange].total > 0 ? (detailedStats[selectedTimeRange].doing / detailedStats[selectedTimeRange].total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-600">Todo</span>
                    <span className="font-medium text-slate-700">{detailedStats[selectedTimeRange].todo}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div 
                      className="h-2 rounded-full bg-slate-500" 
                      style={{ width: `${detailedStats[selectedTimeRange].total > 0 ? (detailedStats[selectedTimeRange].todo / detailedStats[selectedTimeRange].total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-600">Done</span>
                    <span className="font-medium text-emerald-700">{detailedStats[selectedTimeRange].done}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div 
                      className="h-2 rounded-full bg-emerald-500" 
                      style={{ width: `${detailedStats[selectedTimeRange].total > 0 ? (detailedStats[selectedTimeRange].done / detailedStats[selectedTimeRange].total) * 100 : 0}%` }}
                    ></div>
                  </div>

                  {/* Completion Rate */}
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-slate-600">Completion Rate</span>
                      <span className="font-medium text-yellow-700">
                        {detailedStats[selectedTimeRange].total > 0 ? Math.round((detailedStats[selectedTimeRange].done / detailedStats[selectedTimeRange].total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
                      <div 
                        className="h-2 rounded-full bg-yellow-500" 
                        style={{ 
                          width: `${detailedStats[selectedTimeRange].total > 0 ? (detailedStats[selectedTimeRange].done / detailedStats[selectedTimeRange].total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Current Interface */}
          <div className="lg:col-span-8">

      {error && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
          {error}
        </div>
      )}

      {/* Create form */}
      <form onSubmit={onFormSubmit} className="mb-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <input
          name="title"
          value={form.title}
          onChange={onFormChange}
          placeholder="Task title"
          required
          disabled={loading}
          className="sm:col-span-6 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
        <Dropdown
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          options={STATUS.map(s => ({ label: s, value: s }))}
          containerClass="sm:col-span-2"
        />
        <DatePicker
          value={form.dueDate}
          onChange={(val) => setForm(f => ({ ...f, dueDate: val }))}
          containerClass="sm:col-span-3"
        />
        <button
          type="submit"
          disabled={loading || !form.title.trim() || !form.dueDate.trim()}
          className="sm:col-span-1 inline-flex items-center justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-12 items-center gap-3">
        <input
          name="search"
          value={filters.search}
          onChange={onQueryChange}
          placeholder="Search"
          disabled={false}
          className="sm:col-span-6 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
        <Dropdown
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          options={[{ label: "All", value: "" }, ...STATUS.map(s => ({ label: s, value: s }))]}
          containerClass="sm:col-span-2"
        />
        <DatePicker
          value={filters.from}
          onChange={(val) => setFilters(f => ({ ...f, from: val }))}
          containerClass="sm:col-span-2"
          placeholder="Start date"
        />
        <DatePicker
          value={filters.to}
          onChange={(val) => setFilters(f => ({ ...f, to: val }))}
          containerClass="sm:col-span-2"
          placeholder="Due date"
        />
        <div className="sm:col-span-12 flex flex-col sm:flex-row items-center justify-between text-sm gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedRange === "today") {
                  // Toggle off - clear filter
                  const newFilters = { ...filters, from: "", to: "" };
                  setFilters(newFilters);
                  setQuery(q => ({ ...q, ...newFilters, page: 1 }));
                  setSelectedRange("");
                } else {
                  // Apply today filter
                  const today = new Date();
                  const newFilters = { ...filters, from: toISODateString(today), to: toISODateString(today) };
                  setFilters(newFilters);
                  setQuery(q => ({ ...q, ...newFilters, page: 1 }));
                  setSelectedRange("today");
                }
              }}
              className={`rounded-md border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm shadow-sm transition-colors ${
                selectedRange === "today" 
                  ? "border-teal-500 bg-white text-teal-600" 
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedRange === "week") {
                  // Toggle off - clear filter
                  const newFilters = { ...filters, from: "", to: "" };
                  setFilters(newFilters);
                  setQuery(q => ({ ...q, ...newFilters, page: 1 }));
                  setSelectedRange("");
                } else {
                  // Apply week filter
                  const now = new Date();
                  const dayOfWeek = now.getDay();
                  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
                  const start = new Date(now);
                  start.setDate(now.getDate() + daysToMonday);
                  const end = new Date(start);
                  end.setDate(start.getDate() + 6);
                  const newFilters = { ...filters, from: toISODateString(start), to: toISODateString(end) };
                  setFilters(newFilters);
                  setQuery(q => ({ ...q, ...newFilters, page: 1 }));
                  setSelectedRange("week");
                }
              }}
              className={`rounded-md border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm shadow-sm transition-colors ${
                selectedRange === "week" 
                  ? "border-teal-500 bg-white text-teal-600" 
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              This week
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedRange === "month") {
                  // Toggle off - clear filter
                  const newFilters = { ...filters, from: "", to: "" };
                  setFilters(newFilters);
                  setQuery(q => ({ ...q, ...newFilters, page: 1 }));
                  setSelectedRange("");
                } else {
                  // Apply month filter
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  const newFilters = { ...filters, from: toISODateString(start), to: toISODateString(end) };
                  setFilters(newFilters);
                  setQuery(q => ({ ...q, ...newFilters, page: 1 }));
                  setSelectedRange("month");
                }
              }}
              className={`rounded-md border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm shadow-sm transition-colors ${
                selectedRange === "month" 
                  ? "border-teal-500 bg-white text-teal-600" 
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              This month
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearFilters} className="rounded-md border border-slate-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-slate-700 shadow-sm hover:bg-slate-50">Clear</button>
            <button onClick={applyFilters} className="rounded-md bg-teal-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-teal-700">Apply</button>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-x-auto overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse table-fixed min-w-[600px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-slate-700" style={{ width: '200px' }}>Title</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-slate-700" style={{ width: '120px' }}>Status</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-slate-700" style={{ width: '120px' }}>Due date</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-slate-700" style={{ width: 'auto', minWidth: 'fit-content' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-slate-500">No data</td>
              </tr>
            ) : (
              data.items.map(t => (
                <tr key={t._id} className="border-t border-slate-200">
                  <td className="px-2 sm:px-4 py-2 align-top text-xs sm:text-sm text-slate-800" style={{ width: '200px' }}>{t.title}</td>
                  <td className="px-2 sm:px-4 py-2 align-top" style={{ width: '120px' }}>
                    <span className={
                      "inline-flex items-center rounded-full px-1.5 sm:px-2.5 py-0.5 text-xs font-medium " +
                      (t.status === "todo" ? "bg-slate-200 text-slate-700" : t.status === "doing" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")
                    }>
                      {t.status}
                    </span>
              </td>
          <td className="px-2 sm:px-4 py-2 align-top text-xs sm:text-sm text-slate-700" style={{ width: '120px' }}>{t.dueDate ? (() => { const d = new Date(t.dueDate); const dd = String(d.getDate()).padStart(2, "0"); const mm = String(d.getMonth() + 1).padStart(2, "0"); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })() : "-"}</td>
                  <td className="px-2 sm:px-4 py-2 align-top" style={{ width: 'auto', minWidth: 'fit-content' }}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => onStatusChange(t._id, 'todo')}
                        disabled={loading || t.status === 'todo'}
                        className={"rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 " +
                          "bg-slate-200 text-slate-800 hover:bg-slate-300"}
                      >
                        todo
                      </button>
                      <button
                        onClick={() => onStatusChange(t._id, 'doing')}
                        disabled={loading || t.status === 'doing'}
                        className={"rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 " +
                          "bg-blue-100 text-blue-700 hover:bg-blue-200"}
                      >
                        doing
                      </button>
                      <button
                        onClick={() => onStatusChange(t._id, 'done')}
                        disabled={loading || t.status === 'done'}
                        className={"rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 " +
                          "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}
                      >
                        done
                      </button>
                      <button
                        onClick={() => setEditModal({ open: true, task: t })}
                        disabled={loading}
                        className="rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 bg-teal-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(t._id)}
                        disabled={loading}
                        className="rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 bg-rose-600"
                      >
                        Delete
                      </button>
                    </div>
              </td>
            </tr>
              ))
            )}
        </tbody>
      </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPage(-1)}
            disabled={loading || query.page <= 1}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            « Prev
          </button>
          <span className="text-xs sm:text-sm text-slate-600">Page {query.page} / {maxPage}</span>
          <button
            onClick={() => onPage(1)}
            disabled={loading || query.page >= maxPage}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next »
          </button>
        </div>
        <div>
          <Dropdown
            value={query.limit}
            onChange={onLimit}
            options={[7,8,9].map(n => ({ label: `${n} / page`, value: n }))}
            className="px-1 sm:px-2 py-1 sm:py-1.5"
          />
        </div>
      </div>

      <Toasts toasts={toasts} remove={removeToast} />
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onCancel={() => setConfirm({ open: false, message: "", onConfirm: null })}
        onConfirm={confirm.onConfirm || (() => {})}
        title="Delete task"
        confirmText="Delete"
      />
      <EditModal
        open={editModal.open}
        task={editModal.task}
        onCancel={() => setEditModal({ open: false, task: null })}
        onSave={(updatedData) => {
          onEdit(editModal.task._id, updatedData);
          setEditModal({ open: false, task: null });
        }}
      />
          </div>
        </div>
      </div>
    </div>
  );
}
