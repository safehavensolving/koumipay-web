export function QuickActions({ items }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onPress}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-3 hover:shadow-md transition cursor-pointer"
        >
          <span
            className={`size-10 rounded-xl flex items-center justify-center text-lg ${
              item.highlight ? 'bg-navy text-white' : 'bg-emerald/10 text-emerald'
            }`}
          >
            {item.icon}
          </span>
          <span className="text-xs text-navy text-center leading-tight">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
