export async function logToAxiom(data: any) {
  const isBrowser = typeof window !== 'undefined';
  
  // Disable logging in E2E tests/webdrivers or when explicitly disabled
  // BYPASS: If capture-logs is set, we allow the fetch so Playwright can intercept it.
  const isCaptureMode = isBrowser && localStorage.getItem('capture-logs') === 'true';

  if (!isCaptureMode) {
    if (isBrowser && (window.navigator.webdriver || localStorage.getItem('test-mode') === 'true')) {
      return;
    }

    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') {
      return;
    }
  }

  // Always log to console locally for debugging
  const now = new Date().toISOString();
  
  if (isBrowser) {
    // Client-side: Proxy through our own API route
    try {
      const countryStr = document.cookie.split('; ').find(row => row.startsWith('userCountry='))?.split('=')[1] || 'unknown';
      
      const payload = {
        ...data,
        country: data.country || countryStr
      };

      await fetch('/api/axiom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (err) {
      console.error('[Axiom/Client] Proxy failed:', err);
    }
    return;
  }

  // Server-side: Send directly to Axiom
  const dataset = process.env.NEXT_PUBLIC_AXIOM_DATASET || process.env.AXIOM_DATASET;
  const token = process.env.NEXT_PUBLIC_AXIOM_TOKEN || process.env.AXIOM_TOKEN;

  if (!dataset || !token) {
    console.warn(`[Axiom/Server] Missing configuration. Payload:`, JSON.stringify(data));
    return;
  }

  const url = `https://api.axiom.co/v1/datasets/${dataset}/ingest`;
  const payload = (Array.isArray(data) ? data : [data]).map(event => ({
    _time: now,
    level: 'info',
    ...event
  }));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Axiom/Server] Ingest failed (${res.status}):`, errorText);
    }
  } catch (err) {
    console.error('[Axiom/Server] Network error:', err);
  }
}
