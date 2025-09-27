import { useState, useEffect } from "react";

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

export default DatePicker;
