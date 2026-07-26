export function AppModal({ visible, onClose, title, children, scrollable = false, className = '' }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] ${
          scrollable ? 'overflow-y-auto' : ''
        } ${className}`}
      >
        <div className="sm:hidden flex justify-center pt-2">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-lg font-semibold text-navy">{title}</h2>
            <button type="button" onClick={onClose} className="text-muted hover:text-navy cursor-pointer">
              ✕
            </button>
          </div>
        )}
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
