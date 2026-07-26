import { formatGnf } from '../../../utils/money';

const TONE_CLASSES = {
  success: 'bg-success-bg',
  warning: 'bg-warning-bg',
};

export function KPIGrid({ items, amountsVisible }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => {
        const formatter = item.formatter || formatGnf;
        const display = item.hideable && !amountsVisible ? '•••••• GNF' : formatter(item.value);
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onPress}
            className={`text-left rounded-2xl border border-border p-4 ${
              item.tone ? TONE_CLASSES[item.tone] : 'bg-white'
            } ${item.onPress ? 'cursor-pointer hover:shadow-md transition' : ''}`}
          >
            <p className="text-xs text-muted">{item.label}</p>
            <p className="text-lg font-semibold text-navy mt-1">{display}</p>
          </button>
        );
      })}
    </div>
  );
}
