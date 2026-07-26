const VARIANT_CLASSES = {
  primary: 'bg-emerald text-white hover:bg-emerald/90',
  secondary: 'bg-white text-emerald border border-emerald hover:bg-emerald/5',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'bg-transparent text-muted border border-border hover:bg-light-gray',
};

const SIZE_CLASSES = {
  sm: 'py-2 px-3.5 text-[13px] rounded-[10px]',
  md: 'py-3 px-5 text-sm rounded-xl',
  lg: 'py-4 px-6 text-base rounded-2xl',
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {loading ? (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}
