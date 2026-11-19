import fs from 'node:fs';
import path from 'node:path';

const COMPLEXES = [
  // 1. 둔촌동
  { id: 'olympic-foreon', name: '올림픽파크 포레온', search: '올림픽파크포레온', dong: '둔촌동' },
  { id: 'the-sharp-dunchon', name: '더샵 둔촌포레', search: '더샵둔촌포레', dong: '둔촌동' },
  { id: 'dunchon-prugio', name: '둔촌 푸르지오', search: '둔촌푸르지오', dong: '둔촌동' },
  { id: 'dunchon-hyundai', name: '둔촌 현대 1·2·3차', search: '둔촌현대1차', dong: '둔촌동' },

  // 2. 고덕동
  { id: 'godeok-gracium', name: '고덕 그라시움', search: '고덕그라시움', dong: '고덕동' },
  { id: 'raemian-hillstate-godeok', name: '고덕 래미안 힐스테이트', search: '고덕래미안힐스테이트', dong: '고덕동' },
  { id: 'godeok-ipark', name: '고덕 아이파크', search: '고덕아이파크', dong: '고덕동' },

  // 3. 상일동
  { id: 'godeok-arteon', name: '고덕 아르테온', search: '고덕아르테온', dong: '상일동' },
  { id: 'godeok-xi', name: '고덕 자이', search: '고덕자이', dong: '상일동' },
  { id: 'godeok-central-ipark', name: '고덕 센트럴 아이파크', search: '고덕센트럴아이파크', dong: '상일동' },
  { id: 'godeok-lottecastle-bene', 'name': '고덕 롯데캐슬 베네루체', search: '고덕롯데캐슬베네루체', dong: '상일동' },
  { id: 'godeok-lienpark-3', name: '고덕 리엔파크 3단지', search: '고덕리엔파크3단지', dong: '상일동' },
  { id: 'epyeonhan-urbanbridge', name: 'e편한세상 고덕 어반브릿지', search: 'e편한세상고덕어반브릿지', dong: '상일동' },
  { id: 'godeok-punggyeongchae', name: '고덕 풍경채 어바니티', search: '고덕풍경채어바니티', dong: '상일동' },

  // 4. 명일동
  { id: 'raemian-solvenue', name: '래미안 솔베뉴', search: '래미안솔베뉴', dong: '명일동' },
  { id: 'samik-green-2', name: '삼익그린맨션 2차', search: '삼익그린맨션2차', dong: '명일동' },
  { id: 'samik-green-1', name: '삼익그린맨션 1차', search: '삼익그린맨션1차', dong: '명일동' },
  { id: 'myeongil-lg', name: '명일 LG아파트', search: '명일LG', dong: '명일동' },
  { id: 'myeongil-woosung', name: '명일 우성 · 신동아', search: '명일우성', dong: '명일동' },

  // 5. 암사동
  { id: 'gangdong-lotte-first', name: '강동 롯데캐슬 퍼스트', search: '강동롯데캐슬퍼스트', dong: '암사동' },
  { id: 'seonsa-hyundai', name: '선사현대 아파트', search: '선사현대', dong: '암사동' },
  { id: 'hillstate-gangdong-riverview', name: '힐스테이트 강동 리버뷰', search: '힐스테이트강동리버뷰', dong: '암사동' },

  // 6. 천호동
  { id: 'raemian-gangdong-palace', name: '래미안 강동팰리스', search: '래미안강동팰리스', dong: '천호동' },
  { id: 'the-sharp-central-city', name: '더샵 강동센트럴시티', search: '더샵강동센트럴시티', dong: '천호동' },
  { id: 'gangdong-jungheung', name: '강동 밀레니얼 중흥S-클래스', search: '강동밀레니얼중흥S-클래스', dong: '천호동' },
  { id: 'epyeonhan-prestigeone', name: 'e편한세상 강동 프레스티지원', search: 'e편한세상강동프레스티지원', dong: '천호동' },

  // 7. 성내동
  { id: 'seongnae-samsung-raemian', name: '성내 삼성래미안', search: '성내삼성래미안', dong: '성내동' },
  { id: 'olympic-hanyang-sujain', name: '올림픽파크 한양수자인', search: '올림픽파크한양수자인', dong: '성내동' },

  // 8. 길동
  { id: 'gangdong-heritage-xi', name: '강동 헤리티지 자이', search: '강동헤리티지자이', dong: '길동' },
  { id: 'gildong-woosung', name: '길동 우성아파트', search: '길동우성', dong: '길동' },
  { id: 'epyeonhan-ecofore', name: 'e편한세상 강동 에코포레', search: 'e편한세상강동에코포레', dong: '길동' },

  // 9. 강일동
  { id: 'hillstate-richvill-gangil', name: '힐스테이트 리슈빌 강일', search: '힐스테이트리슈빌강일', dong: '강일동' },
  { id: 'gangdong-riverst-468', name: '강동 리버스트 4단지', search: '강동리버스트4단지', dong: '강일동' },
  { id: 'gangil-riverpark-3', name: '강일 리버파크 3단지', search: '강일리버파크3단지', dong: '강일동' },
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
  const baseDir = path.resolve('public/floorplans');
  fs.mkdirSync(baseDir, { recursive: true });
  const catalog = {};
  let totalImages = 0;

  for (const c of COMPLEXES) {
    try {
      const apt = await findDanji(c.search);
      if (!apt) {
        console.log('NOT FOUND:', c.name);
        continue;
      }
      const rts = await getRoomTypes(apt.id);
      const cDir = path.join(baseDir, c.id);
      fs.mkdirSync(cDir, { recursive: true });

      const typesList = [];
      for (const rt of rts) {
        if (!rt.floor_plan) continue;
        const safeCode = String(rt.room_type_title?.p || rt.id).replace(/[^a-zA-Z0-9가-힣_-]/g, '');
        const fileName = `${rt.id}_${safeCode}.jpg`;
        const outPath = path.join(cDir, fileName);

        if (!fs.existsSync(outPath)) {
          const imgUrl = rt.floor_plan.includes('?') ? rt.floor_plan : `${rt.floor_plan}?w=1200`;
          const imgRes = await fetch(imgUrl, { headers: { Referer: 'https://www.zigbang.com/' } });
          if (imgRes.ok) {
            fs.writeFileSync(outPath, Buffer.from(await imgRes.arrayBuffer()));
            totalImages++;
          } else {
            continue;
          }
        } else {
          totalImages++;
        }

        typesList.push({
          roomTypeId: rt.id,
          m2: rt.room_type_title?.m2 || String(Math.round(rt.공급면적?.m2 || 84)),
          p: rt.room_type_title?.p || String(Math.round(rt.공급면적?.p || 25)),
          supplySqm: rt.공급면적?.m2 || 0,
          exclusiveSqm: rt.전용면적?.m2 || 0,
          pyeong: Math.round(rt.공급면적?.p || 25),
          roomsCount: rt.방 || 3,
          bathsCount: rt.욕실 || 2,
          entranceType: rt.현관구조 || '계단식',
          households: rt.총세대수 || 0,
          localUrl: `/floorplans/${c.id}/${fileName}`,
        });
      }

      catalog[c.id] = {
        danjiId: apt.id,
        officialName: apt.name,
        dong: apt.description || `서울특별시 강동구 ${c.dong}`,
        types: typesList,
      };
      console.log(`OK: ${c.name} (${apt.name}) -> ${typesList.length} types saved`);
    } catch (err) {
      console.log(`ERR: ${c.name} ->`, err.message);
    }
  }

  fs.writeFileSync(path.resolve('src/data/officialCatalog.json'), JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`\nCOMPLETE! Complexes: ${Object.keys(catalog).length}, Total official floor plan images: ${totalImages}`);
}

main();
