import fs from 'node:fs';
import path from 'node:path';

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';

const TARGETS = [
  { key: 'olympic-foreon-84a', query: '올림픽파크포레온', areaTarget: 84, letter: 'A' },
  { key: 'olympic-foreon-59a', query: '올림픽파크포레온', areaTarget: 59, letter: 'A' },
  { key: 'olympic-foreon-84c', query: '올림픽파크포레온', areaTarget: 84, letter: 'C' },
  { key: 'godeok-gracium-84a', query: '고덕그라시움', areaTarget: 84, letter: 'A' },
  { key: 'godeok-gracium-59a', query: '고덕그라시움', areaTarget: 59, letter: 'A' },
  { key: 'godeok-arteon-84a', query: '고덕아르테온', areaTarget: 84, letter: 'A' },
  { key: 'raemian-hillstate-godeok-84b', query: '고덕래미안힐스테이트', areaTarget: 84, letter: 'B' },
  { key: 'godeok-xi-84a', query: '고덕자이', areaTarget: 84, letter: 'A' },
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

async function vectorize(imgUrl, label) {
  const fullUrl = imgUrl.includes('?') ? imgUrl : `${imgUrl}?w=1000`;
  const imgRes = await fetch(fullUrl, { headers: { Referer: 'https://www.zigbang.com/' } });
  if (!imgRes.ok) throw new Error(`Image HTTP ${imgRes.status}`);
  const b64 = Buffer.from(await imgRes.arrayBuffer()).toString('base64');

  const gRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: { responseMimeType: 'application/json' },
        contents: [
          {
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: b64 } },
              {
                text: `이 한국 아파트 공식 평면도(${label})를 정밀 분석하여 JSON으로 변환하세요.
좌표계: 미터(m) 단위, 좌측 상단 (0,0), width(10~15m), depth(8~12m).
필수 JSON 필드:
{
  "width": 12.5,
  "depth": 9.5,
  "rooms": [{"id":"r1","name":"거실","type":"living","polygon":[{"x":0,"y":0},{"x":4,"y":0},{"x":4,"y":4},{"x":0,"y":4}]}],
  "walls": [{"id":"w1","x1":0,"y1":0,"x2":4,"y2":0,"thickness":0.2,"isLoadBearing":true,"isExterior":true,"openings":[{"id":"op1","type":"window","offset":0.5,"width":2.4,"height":1.8,"sillHeight":0.3}]}]
}
room.type은 living,kitchen,master,bedroom,alpha,bath,entrance,dress,balcony,utility 중 하나.
도면에 보이는 실제 돌출부(L자형, ㄷ자형 등)와 방/거실/주방/욕실/드레스룸/다용도실/현관/발코니 위치를 실제 도면과 1:1로 맞추세요.`,
              },
            ],
          },
        ],
      }),
    }
  );
  if (!gRes.ok) throw new Error(`Gemini HTTP ${gRes.status}`);
  const d = await gRes.json();
  const txt = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(txt.replace(/```json|```/g, '').trim());
}

async function main() {
  const out = {};
  const cacheDanji = new Map();

  for (const t of TARGETS) {
    try {
      let info = cacheDanji.get(t.query);
      if (!info) {
        const apt = await findDanji(t.query);
        if (!apt) {
          console.log('NOT FOUND:', t.query);
          continue;
        }
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

      if (!best) {
        console.log('NO FLOOR PLAN:', t.key);
        continue;
      }

      console.log(`Fetching & vectorizing ${t.key} (${info.apt.name} ${best.room_type_title.p}평)...`);
      const vec = await vectorize(best.floor_plan, `${info.apt.name} ${best.room_type_title.p}평`);
      out[t.key] = {
        danjiId: info.apt.id,
        officialName: info.apt.name,
        p: best.room_type_title.p,
        m2: best.room_type_title.m2,
        areaSqm: best.전용면적.m2,
        floorPlanUrl: best.floor_plan,
        ...vec,
      };
      console.log(`  -> OK: ${vec.rooms?.length || 0} rooms, ${vec.walls?.length || 0} walls`);
    } catch (err) {
      console.error(`  -> ERR ${t.key}:`, err.message);
    }
  }

  const outPath = path.resolve('src/data/officialFloorPlans.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
  console.log('Saved to', outPath, 'Total plans:', Object.keys(out).length);
}

main();
