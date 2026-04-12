'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginCard from './LoginCard'
import type { Lang } from '@/i18n/translations'

interface Props {
  children: React.ReactNode
  lang: Lang
  dict: Record<string, string>
}

export default function AuthWall({ children, lang, dict }: Props) {
  const { isAuthorized, loading } = useAuth()

  // During initial load, we don't know the state yet.
  // We show the content but mark it as loading to prevent layout shifts.
  const isLocked = !loading && !isAuthorized

  return (
    <div className="auth-wall-container" style={{ position: 'relative', width: '100%', minHeight: '400px' }}>
      <div className={`auth-wall-content ${isLocked ? 'locked' : ''}`}>
        {children}
      </div>

      {isLocked && (
        <div className="auth-wall-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000, // Higher z-index for fixed overlay
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '20px 8vw',
          background: 'rgba(255, 255, 255, 0.02)',
          animation: 'fadeIn 0.5s ease forwards'
        }}>
          <LoginCard lang={lang} dict={dict} />
        </div>
      )}

      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101
        }}>
          {/* Subtle loader could go here */}
        </div>
      )}

      <style jsx global>{`
        .auth-wall-content.locked {
          filter: blur(1.5px) grayscale(10%);
          pointer-events: none;
          user-select: none;
          opacity: 0.95;
          transition: filter 0.8s ease, opacity 0.8s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(1px); }
        }
      `}</style>
    </div>
  )
}
