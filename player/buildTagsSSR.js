const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3456;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildShareHtml({ original = '', title = '', image = '', description = '' }) {
  const safeOriginal = escapeHtml(original)
  const safeTitle = escapeHtml(title)
  const safeImage = escapeHtml(image)
  const safeDescription = escapeHtml(description)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle || 'Shared page'}</title>

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:url" content="${safeOriginal || BASE_URL}" />
  <link rel="canonical" href="${safeOriginal || BASE_URL}" />

  ${safeOriginal ? `<meta http-equiv="refresh" content="1;url=${safeOriginal}">` : ''}
</head>
<body>
  <p>Preparing shared page... <a href="${safeOriginal || '#'}">Continue</a></p>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    if (reqUrl.pathname !== '/share') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const q = reqUrl.searchParams;
    const original = q.get('url') ? decodeURIComponent(q.get('url')) : '';
    const title = q.get('title') ? decodeURIComponent(q.get('title')) : '';
    const image = q.get('image') ? decodeURIComponent(q.get('image')) : '';
    const description = q.get('description') ? decodeURIComponent(q.get('description')) : '';

    const html = buildShareHtml({ original, title, image, description });

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600'
    });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
    console.error(err);
  }
});

server.listen(PORT, () => {
  console.log(`OG share server listening on ${BASE_URL}`);
});
