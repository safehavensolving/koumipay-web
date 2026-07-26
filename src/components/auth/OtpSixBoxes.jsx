import { useRef } from 'react';

export function OtpSixBoxes({ value, onChange, length = 6, disabled = false }) {
  const inputsRef = useRef([]);
  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  function setDigit(index, char) {
    const next = value.split('');
    next[index] = char;
    onChange(next.join('').slice(0, length));
  }

  function handleChange(index, e) {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDigit(index, '');
      return;
    }
    const char = raw[raw.length - 1];
    setDigit(index, char);
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index].trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (text) {
      e.preventDefault();
      onChange(text.padEnd(length, '').trimEnd());
      inputsRef.current[Math.min(text.length, length - 1)]?.focus();
    }
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          className="size-12 text-center text-xl font-semibold rounded-xl border border-border focus:border-emerald outline-none disabled:bg-neutral-bg disabled:text-muted"
        />
      ))}
    </div>
  );
}
