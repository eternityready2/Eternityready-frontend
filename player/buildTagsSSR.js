const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3456;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isFacebookBot(req) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  return ua.includes('facebookexternalhit') || ua.includes('facebot');
}

function buildShareHtml({ shareUrl, original, title, image, description }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(original)}" />
  <link rel="canonical" href="${escapeHtml(original)}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <a href="${escapeHtml(original)}">Continue</a>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);

    if (reqUrl.pathname !== '/ssr') {
      res.writeHead(404);
      return res.end('Not found');
    }

    const original = decodeURIComponent(reqUrl.searchParams.get('url') || '');
    const title = decodeURIComponent(reqUrl.searchParams.get('title') || '');
    const image = decodeURIComponent(reqUrl.searchParams.get('image') || '');
    const description = decodeURIComponent(reqUrl.searchParams.get('description') || '');

    const shareUrl = `https://${req.headers.host}${req.url}`;

    if (!isFacebookBot(req)) {
      res.writeHead(302, { Location: original });
      return res.end();
    }

    const html = buildShareHtml({ shareUrl, original, title, image, description });

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600'
    });

    res.end(html);

  } catch (err) {
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Share server running on port ${PORT}`);
});
