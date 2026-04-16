export async function logToAxiom(events: any[] | any) {
  const dataset = process.env.NEXT_PUBLIC_AXIOM_DATASET || process.env.AXIOM_DATASET;
  const token = process.env.NEXT_PUBLIC_AXIOM_TOKEN || process.env.AXIOM_TOKEN;

  if (!dataset || !token) {
    console.warn('[Axiom] Missing dataset or token, skipping log.');
    return;
  }

  const url = `https://api.axiom.co/v1/datasets/${dataset}/ingest`;
  const payload = Array.isArray(events) ? events : [events];

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
      console.error('[Axiom] Ingest failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[Axiom] Error sending logs:', err);
  }
}
