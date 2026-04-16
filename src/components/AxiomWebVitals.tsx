'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { logToAxiom } from '../utils/logger'

export function AxiomWebVitals() {
  useReportWebVitals((metric) => {
    logToAxiom({
      level: 'info',
      source: 'web-vitals',
      pathname: window.location.pathname,
      ...metric
    });
  })

  return null
}
