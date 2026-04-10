'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Authentication Error</h1>
      <p style={{ color: '#e74c3c', marginBottom: '10px' }}>
        There was a problem signing you in via Google.
      </p>
      {error && (
        <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '20px auto', maxWidth: '500px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          Error: {error}
        </div>
      )}
      <p style={{ marginBottom: '20px' }}>
        This usually happens due to a configuration mismatch in the Supabase Dashboard.
      </p>
      <Link href="/login" className="btn-solve shadow" style={{ textDecoration: 'none', display: 'inline-block' }}>
        Try Again
      </Link>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading error details...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
