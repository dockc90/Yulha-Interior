import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse
) {
  try {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    const urlParam = req.query?.url;
    const target =
      (Array.isArray(urlParam) ? urlParam[0] : urlParam) ||
      urlObj.searchParams.get('url') ||
      '';

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      res.statusCode = 400;
      res.end('Invalid image URL');
      return;
    }

    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Referer: 'https://search.naver.com/',
      },
    });

    res.statusCode = upstream.status;
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'image/jpeg'
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.statusCode = 500;
    res.end(String(err));
  }
}
