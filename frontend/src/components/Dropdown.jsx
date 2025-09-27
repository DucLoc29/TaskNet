import { useState } from "react";

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

export default Dropdown;
