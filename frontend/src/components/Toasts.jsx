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

export default Toasts;
