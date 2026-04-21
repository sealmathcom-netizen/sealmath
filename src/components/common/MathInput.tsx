'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

// Import mathlive globally (this only happens on the client)
if (typeof window !== 'undefined') {
  import('mathlive');
}

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onClick?: () => void;
  onEnter?: () => void;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  readonly?: boolean;
}

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'math-field': any;
      }
    }
  }
}

const MathInput = forwardRef<any, MathInputProps>(({ value, onChange, onFocus, onClick, onEnter, style, className, placeholder, readonly }, ref) => {
  const mfRef = useRef<any>(null);

  // Expose the math-field focus method to the parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (mfRef.current) {
        setTimeout(() => {
          if (mfRef.current) mfRef.current.focus();
        }, 50);
      }
    },
    get value() {
      return mfRef.current ? mfRef.current.value : '';
    }
  }));

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    // Set configuration
    mf.smartMode = true;
    mf.smartFence = true;
    mf.placeholder = placeholder || '';
    mf.readOnly = readonly || false;
    
    // Set initial value if changed from outside
    if (mf.value !== value) {
      mf.value = value;
    }

    const handleInput = (e: any) => {
      onChange(e.target.value);
    };

    const handleInteraction = () => {
      // Use setTimeout to ensure this runs after MathLive's internal event handling
      setTimeout(() => {
        if (onFocus) onFocus();
        if (onClick) onClick();
      }, 10);
    };

    const handleKeyDown = (e: any) => {
      if (e.key === 'Enter') {
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
      }
    };

    mf.addEventListener('input', handleInput);
    mf.addEventListener('focusin', handleInteraction, { capture: true });
    mf.addEventListener('focus', handleInteraction, { capture: true });
    mf.addEventListener('mousedown', handleInteraction, { capture: true });
    mf.addEventListener('pointerdown', handleInteraction, { capture: true });
    mf.addEventListener('click', handleInteraction, { capture: true });
    mf.addEventListener('keydown', handleKeyDown);

    return () => {
      mf.removeEventListener('input', handleInput);
      mf.removeEventListener('focusin', handleInteraction, { capture: true });
      mf.removeEventListener('focus', handleInteraction, { capture: true });
      mf.removeEventListener('mousedown', handleInteraction, { capture: true });
      mf.removeEventListener('pointerdown', handleInteraction, { capture: true });
      mf.removeEventListener('click', handleInteraction, { capture: true });
      mf.removeEventListener('keydown', handleKeyDown);
    };
  }, [placeholder, readonly, onChange, onFocus, onClick, onEnter]);

  // Update value when it changes externally
  useEffect(() => {
    if (mfRef.current && mfRef.current.value !== value) {
      mfRef.current.value = value;
    }
  }, [value]);

  return (
    <math-field data-testid="algebra-input"
      ref={mfRef}
      className={className}
      style={{
        display: 'inline-block',
        width: '100%',
        padding: '2px 4px',
        fontSize: '1.2rem',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        ...style
      }}
    />
  );
});

MathInput.displayName = 'MathInput';

export default MathInput;
