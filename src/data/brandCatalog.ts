import { MaterialCatalogItem } from '../types/design';

export const BRAND_CATALOG: MaterialCatalogItem[] = [
  // ========================
  // 1. 마루 (FLOOR)
  // ========================
  // 구정마루
  { id: 'fl-kujung-zen-fantasy', group: 'floor', brand: '구정마루', series: '마뷸러스 젠', name: '젠틀 판타지', spec: '390×790mm 광폭 스톤', price: 175000, unit: '평', color: '#EDE9E0', subColor: '#DCD6C8', pattern: 'porcelain_600', roughness: 0.4, metalness: 0.03, isTrend2026: true },
  { id: 'fl-kujung-zen-moroccan', group: 'floor', brand: '구정마루', series: '마뷸러스 젠', name: '모로칸 화이트', spec: '390×790mm 사각', price: 175000, unit: '평', color: '#F3F0EA', subColor: '#E2DDD2', pattern: 'porcelain_600', roughness: 0.38, metalness: 0.03, isTrend2026: true },
  { id: 'fl-kujung-zen-ash', group: 'floor', brand: '구정마루', series: '마뷸러스 젠', name: '솔티 애쉬', spec: '390×790mm 사각', price: 175000, unit: '평', color: '#CFCBC3', subColor: '#B8B3A9', pattern: 'porcelain_600', roughness: 0.42, metalness: 0.04 },
  { id: 'fl-kujung-grand-swedish', group: 'floor', brand: '구정마루', series: '그랜드 텍스처', name: '스웨디쉬 화이트 오크', spec: '165×1200mm 동조엠보', price: 155000, unit: '평', color: '#E2D8C8', subColor: '#CEC0AA', pattern: 'wide_oak', roughness: 0.52, metalness: 0.02, isTrend2026: true },
  { id: 'fl-kujung-grand-oatmeal', group: 'floor', brand: '구정마루', series: '그랜드 텍스처', name: '오트밀 오크', spec: '165×1200mm 브러쉬', price: 155000, unit: '평', color: '#D6C2A8', subColor: '#BCA385', pattern: 'wide_oak', roughness: 0.54, metalness: 0.02 },
  { id: 'fl-kujung-brush-teak', group: 'floor', brand: '구정마루', series: '브러쉬 골드', name: '허니 티크', spec: '142×1200mm 원목감', price: 168000, unit: '평', color: '#B58456', subColor: '#94663B', pattern: 'wide_oak', roughness: 0.56, metalness: 0.02 },
  { id: 'fl-kujung-herringbone', group: 'floor', brand: '구정마루', series: '프레스티지', name: '오크 헤링본', spec: '95×475mm 패턴', price: 185000, unit: '평', color: '#C59A6D', subColor: '#A1774C', pattern: 'wide_oak', roughness: 0.54, metalness: 0.02 },

  // 동화자연마루
  { id: 'fl-dongwha-max-essence', group: 'floor', brand: '동화자연마루', series: '듀오 텍스쳐 맥스', name: '에센스 오크', spec: '190×2400mm 초장척', price: 168000, unit: '평', color: '#C8A074', subColor: '#A97F52', pattern: 'wide_oak', roughness: 0.54, metalness: 0.02, isTrend2026: true },
  { id: 'fl-dongwha-max-gardenia', group: 'floor', brand: '동화자연마루', series: '듀오 텍스쳐 맥스', name: '화이트 가드니아', spec: '190×2400mm 초장척', price: 168000, unit: '평', color: '#E8E1D5', subColor: '#D4CAB9', pattern: 'wide_oak', roughness: 0.5, metalness: 0.02, isTrend2026: true },
  { id: 'fl-dongwha-max-savia', group: 'floor', brand: '동화자연마루', series: '듀오 텍스쳐 맥스', name: '사비아 라이트', spec: '190×2400mm 초장척', price: 168000, unit: '평', color: '#D8C7B2', subColor: '#BFA98E', pattern: 'wide_oak', roughness: 0.52, metalness: 0.02 },
  { id: 'fl-dongwha-grande-blanc', group: 'floor', brand: '동화자연마루', series: '나투스 진 그란데', name: '이모션 블랑', spec: '325×650mm 스퀘어', price: 158000, unit: '평', color: '#EAE4DA', subColor: '#D6CEC0', pattern: 'porcelain_600', roughness: 0.44, metalness: 0.02, isTrend2026: true },
  { id: 'fl-dongwha-grande-sahara', group: 'floor', brand: '동화자연마루', series: '나투스 진 그란데', name: '사하라 라이트', spec: '325×650mm 스퀘어', price: 158000, unit: '평', color: '#E3D9CB', subColor: '#CCC0AE', pattern: 'porcelain_600', roughness: 0.44, metalness: 0.02 },

  // LX하우시스
  { id: 'fl-lx-editon-beige', group: 'floor', brand: 'LX하우시스', series: '에디톤 (EDITON)', name: '스톤 베이지 마블', spec: '고강도 복합 광폭', price: 185000, unit: '평', color: '#E5DDD0', subColor: '#D0C5B4', pattern: 'porcelain_600', roughness: 0.38, metalness: 0.04, isTrend2026: true },
  { id: 'fl-lx-editon-gray', group: 'floor', brand: 'LX하우시스', series: '에디톤 (EDITON)', name: '어반 스톤 그레이', spec: '고강도 복합 광폭', price: 185000, unit: '평', color: '#C6C4BE', subColor: '#AEAFA8', pattern: 'porcelain_600', roughness: 0.42, metalness: 0.04 },
  { id: 'fl-lx-ganggreen-oak', group: 'floor', brand: 'LX하우시스', series: '강그린 프로 맥스', name: '내추럴 웜 오크', spec: '165×1200mm 강마루', price: 148000, unit: '평', color: '#CCA67D', subColor: '#AD855B', pattern: 'wide_oak', roughness: 0.54, metalness: 0.02 },

  // 한솔홈데코
  { id: 'fl-hansol-sb-oak', group: 'floor', brand: '한솔홈데코', series: 'SB마루', name: '리얼 내추럴 오크', spec: '내수강화 140×1200mm', price: 142000, unit: '평', color: '#CEAC86', subColor: '#B18E67', pattern: 'wide_oak', roughness: 0.55, metalness: 0.02 },

  // ========================
  // 2. 타일 (TILE)
  // ========================
  { id: 'tl-yun-cream600', group: 'tile', brand: '윤현상재', series: '이태리 포세린', name: '크림 샌드 포세린 600각', spec: '600×600mm 무광', price: 190000, unit: '평', color: '#EFEBE2', subColor: '#DDD6C9', pattern: 'porcelain_600', roughness: 0.38, metalness: 0.04, isTrend2026: true },
  { id: 'tl-yun-travertine', group: 'tile', brand: '윤현상재', series: '이태리 포세린', name: '로마 트래버틴 아이보리 600각', spec: '600×600mm 스톤결', price: 205000, unit: '평', color: '#EAE2D4', subColor: '#D6CBB8', pattern: 'porcelain_600', roughness: 0.4, metalness: 0.04, isTrend2026: true },
  { id: 'tl-yun-gray800', group: 'tile', brand: '윤현상재', series: '빅슬랩 포세린', name: '웜 그레이 콘크리트 800각', spec: '800×800mm 호텔식', price: 215000, unit: '평', color: '#C7C3BB', subColor: '#AFA99F', pattern: 'porcelain_600', roughness: 0.45, metalness: 0.05, isTrend2026: true },
  { id: 'tl-yun-calacatta', group: 'tile', brand: '윤현상재', series: '빅슬랩 포세린', name: '칼라카타 골드 비앙코 1200각', spec: '1200×1200mm 매트', price: 250000, unit: '평', color: '#F4F2EE', subColor: '#DFD9CE', pattern: 'porcelain_600', roughness: 0.32, metalness: 0.05 },
  { id: 'tl-yun-charcoal', group: 'tile', brand: '윤현상재', series: '이태리 포세린', name: '다크 슬레이트 차콜 600각', spec: '600×600mm 논슬립', price: 195000, unit: '평', color: '#4B4E53', subColor: '#36393D', pattern: 'porcelain_600', roughness: 0.55, metalness: 0.06 },
  { id: 'tl-hyundai-terrazzo', group: 'tile', brand: '대림바스 · 아덱스', series: '바스/현관 타일', name: '라이트 스톤 600각 논슬립', spec: '600×600mm R10', price: 165000, unit: '평', color: '#D5D2CA', subColor: '#BFBBB1', pattern: 'porcelain_600', roughness: 0.58, metalness: 0.03 },

  // ========================
  // 3. 벽지 · 월판넬 (WALL)
  // ========================
  // LX하우시스 디아망
  { id: 'wl-lx-diamang-cream', group: 'wall', brand: 'LX하우시스', series: '디아망 (DIAMANT)', name: '회벽 크림 화이트 (PR002-12)', spec: '106cm×15.6m 무몰딩', price: 68000, unit: '평', color: '#F5F2EC', subColor: '#EAE4D9', pattern: 'stucco', roughness: 0.85, metalness: 0, isTrend2026: true },
  { id: 'wl-lx-diamang-white', group: 'wall', brand: 'LX하우시스', series: '디아망 (DIAMANT)', name: '회벽 퓨어 화이트 (PR002-01)', spec: '106cm×15.6m 입체감', price: 68000, unit: '평', color: '#F8F7F4', subColor: '#ECEAE4', pattern: 'stucco', roughness: 0.84, metalness: 0, isTrend2026: true },
  { id: 'wl-lx-diamang-gray', group: 'wall', brand: 'LX하우시스', series: '디아망 (DIAMANT)', name: '회벽 내추럴 그레이 (PR002-04)', spec: '106cm×15.6m', price: 68000, unit: '평', color: '#E2E0DB', subColor: '#D1CEC7', pattern: 'stucco', roughness: 0.85, metalness: 0 },
  { id: 'wl-lx-diamang-linen', group: 'wall', brand: 'LX하우시스', series: '디아망 (DIAMANT)', name: '리넨 웜 베이지', spec: '106cm×15.6m 직조감', price: 68000, unit: '평', color: '#EDE6DA', subColor: '#DFD5C5', pattern: 'fabric', roughness: 0.88, metalness: 0 },

  // 신한벽지 파사드 / 스케치
  { id: 'wl-shinhan-facade', group: 'wall', brand: '신한벽지', series: '파사드 (FACADE)', name: '소프트 샌드 베이지 미장', spec: '고내구성 무광 실크', price: 58000, unit: '평', color: '#ECE5D9', subColor: '#DDD3C2', pattern: 'stucco', roughness: 0.86, metalness: 0, isTrend2026: true },
  { id: 'wl-shinhan-cotton', group: 'wall', brand: '신한벽지', series: '파사드 (FACADE)', name: '퓨어 코튼 화이트', spec: '무광 페인트 질감', price: 58000, unit: '평', color: '#F6F5F1', subColor: '#EAE8E1', pattern: 'stucco', roughness: 0.85, metalness: 0 },
  { id: 'wl-shinhan-sage', group: 'wall', brand: '신한벽지', series: '스케치 (SKETCH)', name: '포그 세이지 그린', spec: '침실·서재 포인트', price: 56000, unit: '평', color: '#CDD5CE', subColor: '#B8C2B9', pattern: 'fabric', roughness: 0.86, metalness: 0 },

  // 개나리벽지 프리모 / 로하스
  { id: 'wl-gaenari-primo', group: 'wall', brand: '개나리벽지', series: '프리모 (PRIMO)', name: '포그 그레이 무광 페인트', spec: '친환경 와이드 실크', price: 55000, unit: '평', color: '#D8D9D6', subColor: '#C4C6C2', pattern: 'fabric', roughness: 0.88, metalness: 0 },
  { id: 'wl-gaenari-butter', group: 'wall', brand: '개나리벽지', series: '로하스 (LOHAS)', name: '크림 버터 아이보리', spec: '친환경 실크', price: 54000, unit: '평', color: '#F3EDE0', subColor: '#E5DCCB', pattern: 'stucco', roughness: 0.86, metalness: 0 },

  // 한솔홈데코 스토리월 (월판넬)
  { id: 'wl-hansol-louver', group: 'wall', brand: '한솔홈데코', series: '스토리월', name: '내추럴 티크 우드 월판넬', spec: '주방·거실 포인트 패널', price: 175000, unit: '평', color: '#BC8C5E', subColor: '#9C6D41', pattern: 'louver_wood', roughness: 0.54, metalness: 0.02, isTrend2026: true },
  { id: 'wl-hansol-walnut', group: 'wall', brand: '한솔홈데코', series: '스토리월', name: '딥 월넛 템바보드 루버', spec: '아트월 목질 패널', price: 185000, unit: '평', color: '#7E5637', subColor: '#5B3C24', pattern: 'louver_wood', roughness: 0.52, metalness: 0.02 },
  { id: 'wl-hansol-limestone', group: 'wall', brand: '한솔홈데코', series: '스토리월', name: '라임스톤 크림 스톤월', spec: '대형 스톤 월판넬', price: 180000, unit: '평', color: '#EAE4DA', subColor: '#D6CEC0', pattern: 'porcelain_600', roughness: 0.65, metalness: 0.02, isTrend2026: true },

  // ========================
  // 4. 인테리어 필름 (FILM)
  // ========================
  { id: 'fm-bodac-walnut', group: 'film', brand: '현대L&C', series: '보닥 (BODAC)', name: '리얼 내추럴 월넛 우드', spec: '1260mm · 창틀/중문/가구', price: 46000, unit: 'm', color: '#9A6B43', subColor: '#774F2D', pattern: 'wide_oak', roughness: 0.48, metalness: 0.03, isTrend2026: true },
  { id: 'fm-bodac-smokeoak', group: 'film', brand: '현대L&C', series: '보닥 (BODAC)', name: '스모크 애쉬 오크', spec: '1260mm · 모던 우드', price: 46000, unit: 'm', color: '#8A7968', subColor: '#6D5E4F', pattern: 'wide_oak', roughness: 0.5, metalness: 0.03 },
  { id: 'fm-bodac-white', group: 'film', brand: '현대L&C', series: '보닥 (BODAC)', name: '슈퍼매트 퓨어 화이트', spec: '1260mm · 무광 단색', price: 42000, unit: 'm', color: '#F7F6F2', subColor: '#E5E3DC', pattern: 'matte_pet', roughness: 0.36, metalness: 0.02 },
  { id: 'fm-bodac-charcoal', group: 'film', brand: '현대L&C', series: '보닥 메탈릭', name: '딥 차콜 스틸 필름', spec: '중문 프레임·포인트', price: 49000, unit: 'm', color: '#2B2E33', subColor: '#191B1E', pattern: 'matte_pet', roughness: 0.32, metalness: 0.38 },
  { id: 'fm-lx-benif-cream', group: 'film', brand: 'LX하우시스', series: '베니프 (BENIF)', name: '슈퍼매트 크림 화이트 PET', spec: '지문방지 · 싱크대/문틀', price: 43000, unit: 'm', color: '#F3EFE7', subColor: '#E5DFD2', pattern: 'matte_pet', roughness: 0.36, metalness: 0.02, isTrend2026: true },
  { id: 'fm-lx-benif-cashmere', group: 'film', brand: 'LX하우시스', series: '베니프 (BENIF)', name: '웜 캐시미어 베이지 PET', spec: '지문방지 · 주방/붙박이장', price: 44000, unit: 'm', color: '#DFD5C8', subColor: '#C9BEB0', pattern: 'matte_pet', roughness: 0.36, metalness: 0.02, isTrend2026: true },
  { id: 'fm-lx-benif-fog', group: 'film', brand: 'LX하우시스', series: '베니프 (BENIF)', name: '포그 그레이 PET', spec: '주방 가구·중문', price: 44000, unit: 'm', color: '#C5C6C3', subColor: '#AEB0AC', pattern: 'matte_pet', roughness: 0.38, metalness: 0.02 },

  // ========================
  // 5. 천장 (CEILING)
  // ========================
  { id: 'cl-lx-matte', group: 'ceiling', brand: 'LX하우시스', series: '무몰딩 천장지', name: '매트 퓨어 화이트', spec: '우물천장 코브 일체형', price: 48000, unit: '평', color: '#F9F7F3', pattern: 'stucco', roughness: 0.85, metalness: 0 },
  { id: 'cl-warm-ivory', group: 'ceiling', brand: '신한벽지', series: '코쿠닝 실크', name: '웜 아이보리 천장지', spec: '3000K 간접등 최적화', price: 48000, unit: '평', color: '#F3EDE1', pattern: 'stucco', roughness: 0.85, metalness: 0 },
  { id: 'cl-wood-coffer', group: 'ceiling', brand: '한솔홈데코', series: '우드 천장재', name: '오크 우물천장 포인트', spec: '고급 우드 마감', price: 115000, unit: '평', color: '#C99E72', pattern: 'wide_oak', roughness: 0.55, metalness: 0.02 },

  // ========================
  // 6. 조명 · 실링팬 (LIGHTING)
  // ========================
  { id: 'lt-lucci-wood', group: 'lighting', brand: '루씨에어 (Lucci Air)', series: '레이더 (Radar)', name: '티크 우드 3엽 초슬림 실링팬', spec: '52인치 저소음 DC모터', price: 490000, unit: '대', color: '#9C6B43', subColor: '#1D1E22', pattern: 'wide_oak', roughness: 0.44, metalness: 0.14, isTrend2026: true },
  { id: 'lt-lucci-white', group: 'lighting', brand: '루씨에어 (Lucci Air)', series: '레이더 (Radar)', name: '매트 화이트 3엽 실링팬', spec: '52인치 저소음 DC모터', price: 470000, unit: '대', color: '#F4F3EF', subColor: '#D6D4CE', pattern: 'matte_pet', roughness: 0.35, metalness: 0.1 },
  { id: 'lt-lucci-black', group: 'lighting', brand: '루씨에어 (Lucci Air)', series: '레이더 (Radar)', name: '매트 블랙 3엽 실링팬', spec: '52인치 모던 포인트', price: 480000, unit: '대', color: '#232529', subColor: '#111214', pattern: 'matte_pet', roughness: 0.38, metalness: 0.2 },
  { id: 'lt-philips-2inch', group: 'lighting', brand: '필립스 LED', series: 'COB 매립등', name: '2인치 눈부심방지 다운라이트 (3000K)', spec: '7W · 전구색', price: 35000, unit: '개', color: '#FFD99E', pattern: 'solid', roughness: 0.2, metalness: 0.1, isTrend2026: true },
  { id: 'lt-philips-4000k', group: 'lighting', brand: '필립스 LED', series: 'COB 매립등', name: '3인치 주백색 다운라이트 (4000K)', spec: '10W · 주백색', price: 38000, unit: '개', color: '#FFF1D6', pattern: 'solid', roughness: 0.2, metalness: 0.1 },

  // ========================
  // 7. 콘센트 · 스위치 · 월패드 (ELECTRICAL)
  // ========================
  { id: 'el-legrand-white', group: 'electrical', brand: '르그랑 (Legrand)', series: '아테오 (Arteor)', name: '매트 화이트 2구 콘센트/스위치', spec: '국내형 슬림 플레이트 16A', price: 29000, unit: '개소', color: '#F8F8F6', subColor: '#D5D4CE', pattern: 'solid', roughness: 0.3, metalness: 0.05, isTrend2026: true },
  { id: 'el-legrand-champagne', group: 'electrical', brand: '르그랑 (Legrand)', series: '아테오 (Arteor)', name: '샴페인 골드 스위치/콘센트', spec: '웜골드 슬림 플레이트', price: 36000, unit: '개소', color: '#DDD1BD', subColor: '#B8A88E', pattern: 'solid', roughness: 0.26, metalness: 0.35 },
  { id: 'el-jung-white', group: 'electrical', brand: '융 (JUNG)', series: 'LS990', name: '알파인 스노우 화이트 스퀘어', spec: '독일 하이엔드 스퀘어', price: 58000, unit: '개소', color: '#FAFAFA', subColor: '#E2E2E2', pattern: 'solid', roughness: 0.25, metalness: 0.05, isTrend2026: true },
  { id: 'el-jung-silver', group: 'electrical', brand: '융 (JUNG)', series: 'LS990', name: '알루미늄 실버 스퀘어', spec: '리얼 아노다이징 알루미늄', price: 68000, unit: '개소', color: '#CFD3D8', subColor: '#8B919B', pattern: 'solid', roughness: 0.24, metalness: 0.55, isTrend2026: true },
  { id: 'el-jung-black', group: 'electrical', brand: '융 (JUNG)', series: 'LS990', name: '매트 그라파이트 블랙', spec: '다크 모던 스퀘어', price: 72000, unit: '개소', color: '#25272B', subColor: '#111214', pattern: 'solid', roughness: 0.36, metalness: 0.25 },
  { id: 'el-jung-sage', group: 'electrical', brand: '융 (JUNG)', series: '르코르뷔지에', name: '세이지 그레이 스페셜 에디션', spec: '하이엔드 포인트 스위치', price: 89000, unit: '개소', color: '#9EA89F', subColor: '#7A857B', pattern: 'solid', roughness: 0.32, metalness: 0.1 },

  // ========================
  // 8. 가전 · 냉장고 · 인덕션 (APPLIANCE)
  // ========================
  { id: 'ap-bespoke-white', group: 'appliance', brand: '삼성 비스포크', series: '키친핏 코타', name: '코타 화이트 4도어 + 김치냉장고', spec: '도어 일체형 빌트인', price: 3450000, unit: '세트', color: '#F5F2EB', subColor: '#1C1E22', pattern: 'matte_pet', roughness: 0.28, metalness: 0.05, isTrend2026: true },
  { id: 'ap-bespoke-beige', group: 'appliance', brand: '삼성 비스포크', series: '키친핏 코타', name: '코타 베이지 4도어 키친핏', spec: '무광 메탈 웜톤', price: 3450000, unit: '세트', color: '#E8DFD1', subColor: '#1C1E22', pattern: 'matte_pet', roughness: 0.28, metalness: 0.05, isTrend2026: true },
  { id: 'ap-bespoke-charcoal', group: 'appliance', brand: '삼성 비스포크', series: '새틴 차콜', name: '새틴 차콜 메탈 빌트인', spec: '호텔식 다크 키친', price: 3550000, unit: '세트', color: '#393C41', subColor: '#181A1D', pattern: 'matte_pet', roughness: 0.3, metalness: 0.45 },
  { id: 'ap-objet-beige', group: 'appliance', brand: 'LG 오브제컬렉션', series: '미스트 글래스', name: '네이처 베이지 키친핏 4도어', spec: '무광 글래스 도어', price: 3680000, unit: '세트', color: '#E7DDD0', subColor: '#252320', pattern: 'matte_pet', roughness: 0.2, metalness: 0.08, isTrend2026: true },
  { id: 'ap-objet-green', group: 'appliance', brand: 'LG 오브제컬렉션', series: '미스트 글래스', name: '카밍 세이지 그린 키친핏', spec: '자연주의 주방 포인트', price: 3680000, unit: '세트', color: '#B7C4B9', subColor: '#252320', pattern: 'matte_pet', roughness: 0.22, metalness: 0.08 },
  { id: 'ap-bespoke-induction', group: 'appliance', brand: '삼성 비스포크', series: '키친핏 인덕션', name: '인덴트 플랫 3구 블랙 글래스', spec: '쇼트세란 상판 · 600mm', price: 1220000, unit: '대', color: '#17191C', subColor: '#6B7280', pattern: 'solid', roughness: 0.08, metalness: 0.28, isTrend2026: true },
  { id: 'ap-bespoke-induction-white', group: 'appliance', brand: '삼성 비스포크', series: '키친핏 인덕션', name: '글램 화이트 3구 인덕션', spec: '화이트 세라믹 글래스', price: 1280000, unit: '대', color: '#F2EFE9', subColor: '#9CA3AF', pattern: 'solid', roughness: 0.1, metalness: 0.12, isTrend2026: true },
];

export const getCatalogItem = (id?: string): MaterialCatalogItem => {
  if (!id) return BRAND_CATALOG[0];
  return BRAND_CATALOG.find((m) => m.id === id) || BRAND_CATALOG[0];
};
