import { FloorPlanTemplate } from '../types/interior';

export async function convertImageUrlToBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 로드 실패 (${res.status})`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const mimeType = result.split(';')[0].split(':')[1] || 'image/jpeg';
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function vectorizeFloorPlanWithGemini(params: {
  imageUrl: string;
  complexId: string;
  complexName: string;
  district: string;
  typeName: string;
  areaSqm: number;
  pyeong: number;
  isExtended: boolean;
}): Promise<FloorPlanTemplate> {
  const cacheKey = `yulha_v1_plan_${params.complexId}_${params.typeName}_${params.isExtended}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as FloorPlanTemplate;
    }
  } catch {
    // ignore cache read error
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key가 설정되지 않았습니다.');
  }

  const { base64, mimeType } = await convertImageUrlToBase64(params.imageUrl);

  const bodyJson = JSON.stringify({
    generationConfig: {
      responseMimeType: 'application/json',
    },
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
          {
            text: `이 한국 아파트 공식 평면도 이미지를 정확히 분석해 2D/3D 인테리어 스튜디오용 JSON으로 변환하세요.
단지명: ${params.complexName} ${params.typeName} (${params.isExtended ? '확장형 기준' : '비확장형 기준'})
전체 좌표계는 미터(m) 단위이며 좌측 상단이 (0,0), 가로 width(10~15m), 세로 depth(8~12m)입니다.
반드시 순수 JSON만 출력하세요 (마크다운 백틱 없이):
{
  "width": 12.4,
  "depth": 9.8,
  "rooms": [
    {
      "id": "r-1",
      "name": "거실",
      "type": "living",
      "polygon": [{"x":0,"y":0},{"x":4.5,"y":0},{"x":4.5,"y":4.8},{"x":0,"y":4.8}]
    }
  ],
  "walls": [
    {
      "id": "w-1",
      "x1": 0, "y1": 0, "x2": 4.5, "y2": 0,
      "thickness": 0.2,
      "isLoadBearing": true,
      "isExterior": true,
      "openings": [{"id":"op-1","type":"window","offset":0.5,"width":2.6,"height":1.8,"sillHeight":0.3}]
    }
  ]
}
규칙:
1. 도면에 보이는 실제 방 배치(안방, 거실, 주방/식당, 침실2, 침실3, 공용욕실, 부부욕실, 드레스룸, 다용도실, 발코니, 현관, 복도)의 상대 위치와 비율을 실제 평면도와 똑같이 맞추세요.
2. room.type은 living, kitchen, master, bedroom, alpha, bath, entrance, dress, balcony, utility 중 하나를 사용하세요.
3. 외벽은 isExterior: true, isLoadBearing: true로 설정하고, 비내력 가변벽은 isLoadBearing: false로 설정하세요.
4. 문(door), 중문/슬라이딩(sliding_door), 창문(window), 현관문(entrance)을 실제 위치에 포함하세요.`,
          },
        ],
      },
    ],
  });

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyJson,
      }
    );
    if (res.ok || (res.status !== 503 && res.status !== 429)) break;
    await new Promise((r) => setTimeout(r, 1400 * (attempt + 1)));
  }

  if (!res || !res.ok) {
    const errText = res ? await res.text() : 'Network error';
    throw new Error(`Gemini API 오류 (${res?.status}): ${errText.slice(0, 140)}`);
  }

  const data = await res.json();
  let rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  rawText = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(rawText);

  const resultPlan: FloorPlanTemplate = {
    id: `official-${params.complexId}-${Date.now()}`,
    complexId: params.complexId,
    complexName: params.complexName,
    district: params.district,
    region: 'seoul',
    typeName: params.typeName,
    areaSqm: params.areaSqm,
    pyeong: params.pyeong,
    bayInfo: '공식 평면도 기반 AI 2D/3D 변환',
    isExtended: params.isExtended,
    description: `${params.complexName} ${params.typeName} 공식 평면도 기반 모델`,
    width: Number(parsed.width) || 12.4,
    depth: Number(parsed.depth) || 9.8,
    rooms: (parsed.rooms || []).map((r: any, idx: number) => ({
      id: r.id || `r-${idx}`,
      name: r.name || '공간',
      type: r.type || 'bedroom',
      polygon: r.polygon || [],
      floorMaterialId:
        r.type === 'bath' ||
        r.type === 'entrance' ||
        r.type === 'balcony' ||
        r.type === 'utility'
          ? 'fl-porcelain-concrete'
          : 'fl-dongwha-sahara-wide',
      floorDirection: 'horizontal',
      ceilingType: r.type === 'living' ? 'well_rect' : 'flat',
      ceilingMaterialId: 'cl-white-silk',
      indirectLightColor: '4000K',
      indirectLightOn: r.type === 'living',
    })),
    walls: (parsed.walls || []).map((w: any, idx: number) => ({
      id: w.id || `w-${idx}`,
      x1: Number(w.x1) || 0,
      y1: Number(w.y1) || 0,
      x2: Number(w.x2) || 0,
      y2: Number(w.y2) || 0,
      thickness: Number(w.thickness) || 0.16,
      height: 2.4,
      isLoadBearing: Boolean(w.isLoadBearing),
      demolished: false,
      isExterior: Boolean(w.isExterior),
      frontMaterialId: 'wp-lx-diamang-white',
      backMaterialId: 'wp-lx-diamang-white',
      openings: (w.openings || []).map((op: any, oIdx: number) => ({
        id: op.id || `op-${idx}-${oIdx}`,
        type: op.type || 'door',
        offset: Number(op.offset) || 0.5,
        width: Number(op.width) || 0.9,
        height: Number(op.height) || 2.1,
        sillHeight: Number(op.sillHeight) || 0,
        frameMaterialId: 'fm-hyundai-milkwhite',
      })),
    })),
    lights: [],
    furniture: [],
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(resultPlan));
  } catch {
    // ignore storage quota errors
  }
  return resultPlan;
}
