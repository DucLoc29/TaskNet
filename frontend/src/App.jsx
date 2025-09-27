import { useEffect, useState } from "react";
import axios from "axios";
import Dropdown from "./components/Dropdown";
import Toasts from "./components/Toasts";
import EditModal from "./components/EditModal";
import ConfirmModal from "./components/ConfirmModal";
import DatePicker from "./components/DatePicker";
import Calendar from "./components/Calendar";

const API = import.meta.env.VITE_API || "http://localhost:4000/api";

// Tạo axios instance với cấu hình mặc định
const api = axios.create({
  baseURL: API,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});
const STATUS = ["todo", "doing", "done"];

function buildQuery(params) {
  const q = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `?${q}` : "";
}





// Utils for date formatting
function toISODateString(date) {
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const addToast = (type, title, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, type, title, message }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3500);
  };
  const removeToast = id => setToasts(ts => ts.filter(t => t.id !== id));

  // Load calendar tasks for current month only
  const loadCalendarTasks = async (date) => {
    try {
      setCalendarLoading(true);
      
      // Get first and last day of current month
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Format dates for API (avoid timezone issues)
      const fromDate = `${firstDayOfMonth.getFullYear()}-${String(firstDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfMonth.getDate()).padStart(2, '0')}`;
      const toDate = `${lastDayOfMonth.getFullYear()}-${String(lastDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;
      
      console.log(`Loading calendar tasks for ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')} from ${fromDate} to ${toDate}`);
      
      // Fetch tasks for the current month only
      const response = await api.get(`/tasks?from=${fromDate}&to=${toDate}&limit=1000`);
      setCalendarTasks(response.data.items || []);
      
    } catch (err) {
      console.error('Failed to load calendar tasks:', err);
      setCalendarTasks([]);
    } finally {
      setCalendarLoading(false);
    }
  };

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
        api.get(`/tasks/stats?from=${toISODateString(todayStart)}&to=${toISODateString(todayEnd)}`),
        api.get(`/tasks/stats?from=${toISODateString(startOfWeek)}&to=${toISODateString(endOfWeek)}`),
        api.get(`/tasks/stats?from=${toISODateString(startOfMonth)}&to=${toISODateString(endOfMonth)}`)
      ]);

      setDetailedStats({
        today: todayRes.data,
        week: weekRes.data,
        month: monthRes.data
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
          api.get(`/tasks${buildQuery(query)}`),
          api.get('/tasks/stats'),
        ]);
        if (!ignore) {
          setData(listRes.data);
          setStats(statsRes.data);
          // Load detailed stats
          await loadDetailedStats();
        }
      } catch (e) {
        if (!ignore) setError(e.response?.data?.message || e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchAll();
    return () => { ignore = true; };
  }, [query]);

  // Load calendar tasks when calendar date changes
  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendarTasks(calendarDate);
    }
  }, [calendarDate, viewMode]);

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
      await api.post('/tasks', {
        title: form.title,
        status: form.status,
        dueDate: form.dueDate || null,
      });
      setForm({ title: "", status: "todo", dueDate: "" });
      // Don't reset page to 1 after adding task - keep current page
      // setQuery(q => ({ ...q, page: 1 }));
      
      // Reload data to show new task immediately
      const [listRes, statsRes] = await Promise.all([
        api.get(`/tasks${buildQuery(query)}`),
        api.get('/tasks/stats'),
      ]);
      setData(listRes.data);
      setStats(statsRes.data);
      await loadDetailedStats();
      
      // Reload calendar tasks if in calendar view
      if (viewMode === 'calendar') {
        loadCalendarTasks(calendarDate);
      }
      addToast("success", "Task created");
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      addToast("error", "Create failed", e.response?.data?.message || e.message);
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
    setSelectedRange(""); // Clear quick date filter buttons
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
      await api.patch(`/tasks/${id}`, updatedData);
      setData(d => ({ ...d, items: d.items.map(t => t._id === id ? { ...t, ...updatedData } : t) }));
      
      // Reload detailed statistics
      await loadDetailedStats();
      
      // Reload calendar tasks if in calendar view
      if (viewMode === 'calendar') {
        loadCalendarTasks(calendarDate);
      }
      
      addToast("success", "Task updated");
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      addToast("error", "Update failed", e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  const onStatusChange = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/tasks/${id}`, { status });
      
      // Reload data from server to get updated list with proper sorting
      const [listRes, statsRes] = await Promise.all([
        api.get(`/tasks${buildQuery(query)}`),
        api.get('/tasks/stats'),
      ]);
      setData(listRes.data);
      setStats(statsRes.data);
      
      // Reload detailed statistics
      await loadDetailedStats();
      
      // Reload calendar tasks if in calendar view
      if (viewMode === 'calendar') {
        loadCalendarTasks(calendarDate);
      }
      
      addToast("success", "Status updated");
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      addToast("error", "Update failed", e.response?.data?.message || e.message);
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
          await api.delete(`/tasks/${id}`);
          setQuery(q => ({ ...q }));
          // Reload calendar tasks if in calendar view
          if (viewMode === 'calendar') {
            loadCalendarTasks(calendarDate);
          }
          addToast("success", "Task deleted");
        } catch (e) {
          setError(e.response?.data?.message || e.message);
          addToast("error", "Delete failed", e.response?.data?.message || e.message);
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
          
          {/* View Toggle Button */}
          <div className="mt-4 flex justify-center">
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-white shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
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
          
          {/* Right Side - Dynamic Content */}
          <div className="lg:col-span-8">
            {viewMode === 'table' ? (
              <>
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
              </>
            ) : (
              /* Calendar View */
              <Calendar 
                tasks={calendarTasks} 
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
                onTaskClick={(task) => {
                  setEditModal({ open: true, task });
                }}
                loading={calendarLoading}
              />
            )}
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
  );
}
