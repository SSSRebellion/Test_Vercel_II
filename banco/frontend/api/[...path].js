/**
 * Proxy de /api/* hacia el backend Django.
 * En Vercel, define la variable de entorno BACKEND_URL (ej. https://tu-api.onrender.com).
 */
export default async function handler(req, res) {
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return res.status(503).json({
      detail:
        'BACKEND_URL no está configurada. Añádela en Vercel → Settings → Environment Variables.',
    });
  }

  const segments = req.query.path;
  const subPath = Array.isArray(segments) ? segments.join('/') : segments || '';
  const queryIndex = req.url.indexOf('?');
  const query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
  const target = `${backend.replace(/\/$/, '')}/api/${subPath}${query}`;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body =
      typeof req.body === 'string'
        ? req.body
        : req.body !== undefined
          ? JSON.stringify(req.body)
          : undefined;
  }

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const text = await response.text();
    res.status(response.status);

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('content-type', contentType);
    }

    res.send(text);
  } catch (error) {
    res.status(502).json({
      detail: `No se pudo conectar con el backend: ${error.message}`,
    });
  }
}
