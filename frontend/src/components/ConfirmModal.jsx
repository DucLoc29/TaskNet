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

export default ConfirmModal;
