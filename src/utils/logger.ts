export async function logToAxiom(data: any) {
  const dataset = process.env.NEXT_PUBLIC_AXIOM_DATASET || process.env.AXIOM_DATASET;
  const token = process.env.NEXT_PUBLIC_AXIOM_TOKEN || process.env.AXIOM_TOKEN;

  if (!dataset || !token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Axiom] Missing dataset or token, skipping log.');
    }
    return;
  }

  const url = `https://api.axiom.co/v1/datasets/${dataset}/ingest`;
  
  // Ensure we have a level, default to info
  const payload = Array.isArray(data) 
    ? data.map(event => ({ level: 'info', ...event }))
    : [{ level: 'info', ...data }];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok && process.env.NODE_ENV === 'development') {
      console.error('[Axiom] Ingest failed:', res.status, await res.text());
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Axiom] Error sending logs:', err);
    }
  }
}
