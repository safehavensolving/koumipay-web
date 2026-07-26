import { useCallback, useState } from 'react';

const TYPE_CLASSES = {
  success: 'bg-success-text',
  error: 'bg-danger-text',
  warning: 'bg-warning-text',
  info: 'bg-info-text',
};

export function AppToast({ message, type = 'info', visible }) {
  if (!visible) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${TYPE_CLASSES[type]}`}
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  const showToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    setToast({ message, type, visible: true });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  return { toast, showToast };
}
