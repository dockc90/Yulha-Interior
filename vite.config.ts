import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function zigbangProxyPlugin(): Plugin {
  return {
    name: 'zigbang-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/zigbang/')) return next();

        try {
          const urlObj = new URL(req.url, 'http://localhost');

          if (urlObj.pathname === '/api/zigbang/search') {
            const q = urlObj.searchParams.get('q') || '';
            const upstream = await fetch(
              `https://apis.zigbang.com/v2/search?q=${encodeURIComponent(q)}`,
              { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            const data = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data);
            return;
          }

          if (urlObj.pathname === '/api/zigbang/room-types') {
            const danjiId = urlObj.searchParams.get('danjiId') || '';
            const upstream = await fetch(
              `https://apis.zigbang.com/apt/danjis/${encodeURIComponent(danjiId)}/room_types`,
              { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            const data = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data);
            return;
          }

          if (urlObj.pathname === '/api/zigbang/image') {
            const target = urlObj.searchParams.get('url') || '';
            if (!target.startsWith('https://ic.zigbang.com/')) {
              res.statusCode = 400;
              res.end('Invalid image URL');
              return;
            }
            const imgUrl = target.includes('?') ? target : `${target}?w=1200`;
            const upstream = await fetch(imgUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0',
                Referer: 'https://www.zigbang.com/',
              },
            });
            res.statusCode = upstream.status;
            res.setHeader(
              'Content-Type',
              upstream.headers.get('content-type') || 'image/jpeg'
            );
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const buf = Buffer.from(await upstream.arrayBuffer());
            res.end(buf);
            return;
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
          return;
        }
        next();
      });
    },
  };
}

function naverImageProxyPlugin(): Plugin {
  return {
    name: 'naver-image-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/naver/')) return next();

        try {
          const urlObj = new URL(req.url, 'http://localhost');

          if (urlObj.pathname === '/api/naver/image-search') {
            const q = urlObj.searchParams.get('q') || '';
            if (!q.trim()) {
              res.statusCode = 400;
              res.end(JSON.stringify({ items: [] }));
              return;
            }
            const upstream = await fetch(
              `https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${encodeURIComponent(q)}`,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
            res.end(JSON.stringify({ items }));
            return;
          }

          if (urlObj.pathname === '/api/naver/image') {
            const target = urlObj.searchParams.get('url') || '';
            if (!target.startsWith('http://') && !target.startsWith('https://')) {
              res.statusCode = 400;
              res.end('Invalid image URL');
              return;
            }
            const upstream = await fetch(target, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Referer: 'https://search.naver.com/',
              },
            });
            res.statusCode = upstream.status;
            res.setHeader(
              'Content-Type',
              upstream.headers.get('content-type') || 'image/jpeg'
            );
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const buf = Buffer.from(await upstream.arrayBuffer());
            res.end(buf);
            return;
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), zigbangProxyPlugin(), naverImageProxyPlugin()],
});
