'use client';

import React, { useEffect, useRef } from 'react';

// Import mathlive globally (this only happens on the client)
if (typeof window !== 'undefined') {
  import('mathlive');
}

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
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



export default function MathInput({ value, onChange, style, className, placeholder, readonly }: MathInputProps) {
  const mfRef = useRef<any>(null);

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
      // Return LaTeX value
      onChange(e.target.value);
    };

    mf.addEventListener('input', handleInput);
    return () => {
      mf.removeEventListener('input', handleInput);
    };
  }, [placeholder, readonly, onChange]);

  // Update value when it changes externally
  useEffect(() => {
    if (mfRef.current && mfRef.current.value !== value) {
      mfRef.current.value = value;
    }
  }, [value]);

  return (
    <math-field
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
}
