'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function AxiomWebVitals() {
  useReportWebVitals((metric) => {
    fetch('/api/axiom', {
      method: 'POST',
      body: JSON.stringify({
        level: 'info', // Explicitly set level
        source: 'web-vitals',
        pathname: window.location.pathname,
        ...metric
      }),
      keepalive: true,
    }).catch(() => {});
  })

  return null
}
