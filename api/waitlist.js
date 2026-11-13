// Vercel Serverless Function · POST /api/waitlist
// Reenvía cada registro de la lista de pre-venta a un webhook (Google Apps Script,
// Make, Zapier, Formspree, etc.) definido en la variable de entorno WAITLIST_WEBHOOK_URL.
// Sin esa variable responde 503, y el formulario muestra el error en lugar de fingir éxito.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  if (!EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
  if (body.consent !== true) return res.status(400).json({ ok: false, error: 'consent_required' });

  const record = {
    email,
    name: String(body.name || '').trim().slice(0, 120),
    habitat: pick(body.habitat, ['carbon', 'marfil', 'ambos'], 'ambos'),
    size: pick(body.size, ['130', '180', 'indeciso'], 'indeciso'),
    consent: true,
    source: 'habitat-landing',
    ts: new Date().toISOString(),
  };

  const hook = process.env.WAITLIST_WEBHOOK_URL;
  if (!hook) return res.status(503).json({ ok: false, error: 'waitlist_not_configured' });

  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!r.ok) throw new Error(`webhook ${r.status}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('waitlist webhook failed', err);
    return res.status(502).json({ ok: false, error: 'upstream_failed' });
  }
};
