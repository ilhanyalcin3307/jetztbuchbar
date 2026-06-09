/**
 * /api/views.js — Hotel View Counter (Supabase RPC proxy)
 * POST /api/views?id=<giataId>  →  { count: number }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string' || id.length > 40) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'not configured' });
  }

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_view`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_hotel_id: id })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: 'supabase error', detail: text.slice(0, 200) });
    }

    const count = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ count: Number(count) || 0 });
  } catch (e) {
    return res.status(500).json({ error: 'internal error' });
  }
}
