import React from 'react'

export default function SealIcon({ size = 32, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Background Circle */}
      <circle cx="16" cy="16" r="16" fill="#AEC6CF" />
      
      {/* Seal Body/Head */}
      <path 
        d="M16 6C11.5817 6 8 9.58172 8 14C8 17.5 10.5 21 16 26C21.5 21 24 17.5 24 14C24 9.58172 20.4183 6 16 6Z" 
        fill="white" 
      />
      
      {/* Eyes */}
      <circle cx="13" cy="13" r="1.5" fill="#2c3e50" />
      <circle cx="19" cy="13" r="1.5" fill="#2c3e50" />
      
      {/* Nose/Muzzle */}
      <path d="M16 16.5C17.1046 16.5 18 15.6046 18 14.5C18 13.3954 17.1046 12.5 16 12.5C14.8954 12.5 14 13.3954 14 14.5C14 15.6046 14.8954 16.5 16 16.5Z" fill="#2c3e50" opacity="0.1" />
      <circle cx="16" cy="15.5" r="1" fill="#2c3e50" />
      
      {/* Whiskers (Subtle) */}
      <path d="M11 16L9 16.5" stroke="#2c3e50" strokeWidth="0.5" strokeLinecap="round" opacity="0.3" />
      <path d="M11 15.5L8.5 15.5" stroke="#2c3e50" strokeWidth="0.5" strokeLinecap="round" opacity="0.3" />
      <path d="M21 16L23 16.5" stroke="#2c3e50" strokeWidth="0.5" strokeLinecap="round" opacity="0.3" />
      <path d="M21 15.5L23.5 15.5" stroke="#2c3e50" strokeWidth="0.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}
