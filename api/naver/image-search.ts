import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse
) {
  try {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    const qParam = req.query?.q;
    const q = (Array.isArray(qParam) ? qParam[0] : qParam) || urlObj.searchParams.get('q') || '';

    if (!q.trim()) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ items: [] }));
      return;
    }

    const upstream = await fetch(
      `https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
      }
    );

    const html = await upstream.text();
    const seen = new Set<string>();
    const items: Array<{ url: string; thumbUrl: string; title: string }> = [];

    const regex = /"originalUrl":"([^"]+)"[^}]*?"title":"([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null && items.length < 24) {
      const rawUrl = m[1].replace(/\\u002F/g, '/');
      if (!rawUrl.startsWith('http') || seen.has(rawUrl)) continue;
      seen.add(rawUrl);
      const title = m[2]
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16))
        )
        .replace(/\\"/g, '"');
      items.push({
        url: rawUrl,
        thumbUrl: `/api/naver/image?url=${encodeURIComponent(rawUrl)}`,
        title,
      });
    }

    if (items.length === 0) {
      const fallbackRegex = /"originalUrl":"([^"]+)"/g;
      while ((m = fallbackRegex.exec(html)) !== null && items.length < 24) {
        const rawUrl = m[1].replace(/\\u002F/g, '/');
        if (!rawUrl.startsWith('http') || seen.has(rawUrl)) continue;
        seen.add(rawUrl);
        items.push({
          url: rawUrl,
          thumbUrl: `/api/naver/image?url=${encodeURIComponent(rawUrl)}`,
          title: q,
        });
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.end(JSON.stringify({ items }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: String(err), items: [] }));
  }
}
