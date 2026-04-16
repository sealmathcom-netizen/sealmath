'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function AxiomWebVitals() {
  useReportWebVitals((metric) => {
    fetch('/api/axiom', {
      method: 'POST',
      body: JSON.stringify({
        source: 'web-vitals',
        pathname: window.location.pathname,
        ...metric
      }),
      // Use keepalive to ensure the request is sent even if the page is closed
      keepalive: true,
    }).catch(() => {}); // Sink errors
  })

  return null
}
