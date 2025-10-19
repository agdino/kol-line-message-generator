import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  autoResize?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ autoResize = true, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);

  // Expose the internal ref to the parent component
  useImperativeHandle(ref, () => internalRef.current!, []);

  // Auto-resize logic
  useEffect(() => {
    if (!autoResize) return;

    const textarea = internalRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Temporarily shrink to re-calculate scrollHeight
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`; // Set the new height
    }
  }, [props.value, props.readOnly, autoResize]); // Re-run when the content or readOnly state changes

  return (
    <textarea
      {...props}
      ref={internalRef}
      className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-y overflow-y-auto min-h-[40px]"
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
