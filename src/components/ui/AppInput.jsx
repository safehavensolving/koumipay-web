export function AppInput({
  label,
  error,
  leftIcon,
  rightIcon,
  hint,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-navy mb-1.5">{label}</label>}
      <div
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-3 bg-white ${
          error ? 'border-danger' : 'border-border focus-within:border-emerald'
        }`}
      >
        {leftIcon}
        <input
          {...props}
          className={`flex-1 outline-none bg-transparent text-navy placeholder:text-muted text-[15px] ${inputClassName}`}
        />
        {rightIcon}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
