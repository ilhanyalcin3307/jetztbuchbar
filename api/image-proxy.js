// Image proxy: GIATA CDN CORS fix
// Allows canvas to use hotel images without taint errors
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).end('Missing url');

  // Security: only allow GIATA CDN domains
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return res.status(400).end('Invalid URL');
  }

  const allowed = ['giatamedia.com', 'giata.com'];
  const isAllowed = allowed.some(
    d => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
  );
  if (!isAllowed) return res.status(403).end('Forbidden');
  if (parsed.protocol !== 'https:') return res.status(403).end('Forbidden');

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(502).end('Upstream error');

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return res.status(400).end('Not an image');

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(Buffer.from(buffer));
  } catch (e) {
    res.status(502).end('Upstream error');
  }
}
