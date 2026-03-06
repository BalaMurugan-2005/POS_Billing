import { useEffect, useRef } from 'react';

export const useBarcodeScanner = (onScan, options = {}) => {
  const buffer = useRef('');
  const timeout = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Clear buffer on Enter key (barcode scanner sends Enter after scan)
      if (e.key === 'Enter') {
        if (buffer.current.length > 0) {
          onScan(buffer.current);
          buffer.current = '';
        }
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        return;
      }

      // Ignore if not a printable character or if modifier keys are pressed
      if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      // Add character to buffer
      buffer.current += e.key;

      // Reset timeout
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      // Set timeout to clear buffer (in case of manual typing)
      timeout.current = setTimeout(() => {
        if (buffer.current.length > 0) {
          // If it's a short string, treat as manual entry
          if (buffer.current.length < 8) {
            onScan(buffer.current, true);
          }
          buffer.current = '';
        }
      }, options.timeout || 100);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [onScan, options.timeout]);
};