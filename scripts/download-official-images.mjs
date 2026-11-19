import fs from 'node:fs';
import path from 'node:path';

const TARGETS = [
  { key: 'olympic-foreon-84a', query: '올림픽파크포레온', areaTarget: 84, letter: 'A' },
  { key: 'olympic-foreon-59a', query: '올림픽파크포레온', areaTarget: 59, letter: 'A' },
  { key: 'olympic-foreon-84c', query: '올림픽파크포레온', areaTarget: 84, letter: 'C' },
  { key: 'godeok-gracium-84a', query: '고덕그라시움', areaTarget: 84, letter: 'A' },
  { key: 'godeok-gracium-59a', query: '고덕그라시움', areaTarget: 59, letter: 'A' },
  { key: 'godeok-arteon-84a', query: '고덕아르테온', areaTarget: 84, letter: 'A' },
  { key: 'raemian-hillstate-godeok-84b', query: '고덕래미안힐스테이트', areaTarget: 84, letter: 'B' },
  { key: 'godeok-xi-84a', query: '고덕자이', areaTarget: 84, letter: 'A' },
  { key: 'godeok-xi-84b', query: '고덕자이', areaTarget: 84, letter: 'B' },
  { key: 'godeok-xi-59a', query: '고덕자이', areaTarget: 59, letter: 'A' },
  { key: 'raemian-solvenue-84a', query: '래미안솔베뉴', areaTarget: 84, letter: 'A' },
  { key: 'gangdong-heritage-xi-59a', query: '강동헤리티지자이', areaTarget: 59, letter: 'A' },
  { key: 'gangdong-heritage-xi-84a', query: '강동헤리티지자이', areaTarget: 84, letter: 'A' },
];

async function findDanji(q) {
  const res = await fetch(`https://apis.zigbang.com/v2/search?q=${encodeURIComponent(q)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const data = await res.json();
  return (data.items || []).find((it) => it.type === 'apartment');
}

async function getRoomTypes(danjiId) {
  const res = await fetch(`https://apis.zigbang.com/apt/danjis/${danjiId}/room_types`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const data = await res.json();
  return data.room_types || [];
}

async function main() {
  const imgDir = path.resolve('public/floorplans');
  fs.mkdirSync(imgDir, { recursive: true });
  const cacheDanji = new Map();
  const manifest = {};

  for (const t of TARGETS) {
    try {
      let info = cacheDanji.get(t.query);
      if (!info) {
        const apt = await findDanji(t.query);
        if (!apt) continue;
        const rts = await getRoomTypes(apt.id);
        info = { apt, rts };
        cacheDanji.set(t.query, info);
      }
      const best = info.rts
        .filter((r) => r.floor_plan)
        .sort((a, b) => {
          const aDiff = Math.abs((a.전용면적?.m2 || 0) - t.areaTarget);
          const bDiff = Math.abs((b.전용면적?.m2 || 0) - t.areaTarget);
          const aBonus = a.room_type_title?.p?.includes(t.letter) ? -15 : 0;
          const bBonus = b.room_type_title?.p?.includes(t.letter) ? -15 : 0;
          return aDiff + aBonus - (bDiff + bBonus);
        })[0];

      if (!best) continue;
      const fullUrl = best.floor_plan.includes('?') ? best.floor_plan : `${best.floor_plan}?w=1200`;
      const imgRes = await fetch(fullUrl, { headers: { Referer: 'https://www.zigbang.com/' } });
      if (!imgRes.ok) {
        console.log('IMG ERR', t.key, imgRes.status);
        continue;
      }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const outFile = path.join(imgDir, `${t.key}.jpg`);
      fs.writeFileSync(outFile, buf);
      manifest[t.key] = {
        localUrl: `/floorplans/${t.key}.jpg`,
        officialName: info.apt.name,
        p: best.room_type_title.p,
        m2: best.room_type_title.m2,
        areaSqm: best.전용면적.m2,
        roomsCount: best.방,
        bathsCount: best.욕실,
      };
      console.log('SAVED:', t.key, '->', `${best.room_type_title.p}평 (${buf.length} bytes)`);
    } catch (e) {
      console.log('ERR', t.key, e.message);
    }
  }

  fs.writeFileSync(path.resolve('src/data/officialManifest.json'), JSON.stringify(manifest, null, 2));
  console.log('DONE. Saved', Object.keys(manifest).length, 'official floor plan images.');
}

main();
