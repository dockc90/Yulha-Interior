import { MaterialItem } from '../types/planner';

export const MATERIALS_DB: MaterialItem[] = [
  // 마루
  { id: 'fl-kujung-zen-fantasy', kind: 'floor', brand: '구정마루', series: '마뷸러스 젠', name: '젠틀 판타지', spec: '390×790mm', price: 175000, unit: '평', color: '#EDE9E0', subColor: '#DCD6C8', texture: 'porcelain_600', roughness: 0.4, metalness: 0.03 },
  { id: 'fl-kujung-zen-moroccan', kind: 'floor', brand: '구정마루', series: '마뷸러스 젠', name: '모로칸 화이트', spec: '390×790mm', price: 175000, unit: '평', color: '#F3F0EA', subColor: '#E2DDD2', texture: 'porcelain_600', roughness: 0.38, metalness: 0.03 },
  { id: 'fl-kujung-grand-swedish', kind: 'floor', brand: '구정마루', series: '그랜드 텍스처', name: '스웨디쉬 화이트 오크', spec: '165×1200mm', price: 155000, unit: '평', color: '#E2D8C8', subColor: '#CEC0AA', texture: 'wide_oak', roughness: 0.52, metalness: 0.02 },
  { id: 'fl-kujung-brush-teak', kind: 'floor', brand: '구정마루', series: '브러쉬 골드', name: '허니 티크', spec: '142×1200mm', price: 168000, unit: '평', color: '#B58456', subColor: '#94663B', texture: 'wide_oak', roughness: 0.56, metalness: 0.02 },
  { id: 'fl-dongwha-max-essence', kind: 'floor', brand: '동화자연마루', series: '듀오 텍스쳐 맥스', name: '에센스 오크', spec: '190×2400mm', price: 168000, unit: '평', color: '#C8A074', subColor: '#A97F52', texture: 'wide_oak', roughness: 0.54, metalness: 0.02 },
  { id: 'fl-dongwha-max-gardenia', kind: 'floor', brand: '동화자연마루', series: '듀오 텍스쳐 맥스', name: '화이트 가드니아', spec: '190×2400mm', price: 168000, unit: '평', color: '#E8E1D5', subColor: '#D4CAB9', texture: 'wide_oak', roughness: 0.5, metalness: 0.02 },
  { id: 'fl-dongwha-grande-blanc', kind: 'floor', brand: '동화자연마루', series: '나투스 진 그란데', name: '이모션 블랑', spec: '325×650mm', price: 158000, unit: '평', color: '#EAE4DA', subColor: '#D6CEC0', texture: 'porcelain_600', roughness: 0.44, metalness: 0.02 },
  { id: 'fl-lx-editon-beige', kind: 'floor', brand: 'LX하우시스', series: '에디톤', name: '스톤 베이지 마블', spec: '고강도 복합 광폭', price: 185000, unit: '평', color: '#E5DDD0', subColor: '#D0C5B4', texture: 'porcelain_600', roughness: 0.38, metalness: 0.04 },
  { id: 'fl-lx-editon-gray', kind: 'floor', brand: 'LX하우시스', series: '에디톤', name: '어반 스톤 그레이', spec: '고강도 복합 광폭', price: 185000, unit: '평', color: '#C6C4BE', subColor: '#AEAFA8', texture: 'porcelain_600', roughness: 0.42, metalness: 0.04 },

  // 타일
  { id: 'tl-yun-cream600', kind: 'tile', brand: '윤현상재', series: '이태리 포세린', name: '크림 샌드 포세린 600각', spec: '600×600mm', price: 190000, unit: '평', color: '#EFEBE2', subColor: '#DDD6C9', texture: 'porcelain_600', roughness: 0.38, metalness: 0.04 },
  { id: 'tl-yun-travertine', kind: 'tile', brand: '윤현상재', series: '이태리 포세린', name: '로마 트래버틴 아이보리', spec: '600×600mm', price: 205000, unit: '평', color: '#EAE2D4', subColor: '#D6CBB8', texture: 'porcelain_600', roughness: 0.4, metalness: 0.04 },
  { id: 'tl-yun-gray800', kind: 'tile', brand: '윤현상재', series: '빅슬랩 포세린', name: '웜 그레이 콘크리트 800각', spec: '800×800mm', price: 215000, unit: '평', color: '#C7C3BB', subColor: '#AFA99F', texture: 'porcelain_600', roughness: 0.45, metalness: 0.05 },
  { id: 'tl-yun-charcoal', kind: 'tile', brand: '윤현상재', series: '이태리 포세린', name: '다크 슬레이트 차콜 600각', spec: '600×600mm', price: 195000, unit: '평', color: '#4B4E53', subColor: '#36393D', texture: 'porcelain_600', roughness: 0.55, metalness: 0.06 },
  { id: 'tl-hyundai-terrazzo', kind: 'tile', brand: '대림바스', series: '바스/현관', name: '라이트 스톤 논슬립', spec: '600×600mm', price: 165000, unit: '평', color: '#D5D2CA', subColor: '#BFBBB1', texture: 'porcelain_600', roughness: 0.58, metalness: 0.03 },

  // 벽지 / 월판넬
  { id: 'wl-lx-diamang-cream', kind: 'wall', brand: 'LX하우시스', series: '디아망', name: '회벽 크림 화이트 (PR002-12)', spec: '무몰딩 회벽', price: 68000, unit: '평', color: '#F5F2EC', subColor: '#EAE4D9', texture: 'stucco', roughness: 0.85, metalness: 0 },
  { id: 'wl-lx-diamang-white', kind: 'wall', brand: 'LX하우시스', series: '디아망', name: '회벽 퓨어 화이트 (PR002-01)', spec: '입체 질감', price: 68000, unit: '평', color: '#F8F7F4', subColor: '#ECEAE4', texture: 'stucco', roughness: 0.84, metalness: 0 },
  { id: 'wl-lx-diamang-gray', kind: 'wall', brand: 'LX하우시스', series: '디아망', name: '회벽 내추럴 그레이', spec: '모던 그레이', price: 68000, unit: '평', color: '#E2E0DB', subColor: '#D1CEC7', texture: 'stucco', roughness: 0.85, metalness: 0 },
  { id: 'wl-shinhan-facade', kind: 'wall', brand: '신한벽지', series: '파사드', name: '소프트 샌드 베이지 미장', spec: '무광 실크', price: 58000, unit: '평', color: '#ECE5D9', subColor: '#DDD3C2', texture: 'stucco', roughness: 0.86, metalness: 0 },
  { id: 'wl-shinhan-sage', kind: 'wall', brand: '신한벽지', series: '스케치', name: '포그 세이지 그린', spec: '포인트 벽지', price: 56000, unit: '평', color: '#CDD5CE', subColor: '#B8C2B9', texture: 'fabric', roughness: 0.86, metalness: 0 },
  { id: 'wl-gaenari-primo', kind: 'wall', brand: '개나리벽지', series: '프리모', name: '포그 그레이 페인트', spec: '친환경 실크', price: 55000, unit: '평', color: '#D8D9D6', subColor: '#C4C6C2', texture: 'fabric', roughness: 0.88, metalness: 0 },
  { id: 'wl-hansol-louver', kind: 'wall', brand: '한솔홈데코', series: '스토리월', name: '내추럴 티크 우드 월판넬', spec: '주방·아트월 패널', price: 175000, unit: '평', color: '#BC8C5E', subColor: '#9C6D41', texture: 'louver_wood', roughness: 0.54, metalness: 0.02 },
  { id: 'wl-hansol-walnut', kind: 'wall', brand: '한솔홈데코', series: '스토리월', name: '딥 월넛 템바보드', spec: '목질 루버', price: 185000, unit: '평', color: '#7E5637', subColor: '#5B3C24', texture: 'louver_wood', roughness: 0.52, metalness: 0.02 },

  // 인테리어 필름
  { id: 'fm-bodac-walnut', kind: 'film', brand: '현대L&C', series: '보닥', name: '리얼 내추럴 월넛 우드', spec: '1260mm · 창틀/중문', price: 46000, unit: 'm', color: '#9A6B43', subColor: '#774F2D', texture: 'wide_oak', roughness: 0.48, metalness: 0.03 },
  { id: 'fm-bodac-white', kind: 'film', brand: '현대L&C', series: '보닥', name: '슈퍼매트 퓨어 화이트', spec: '1260mm · 무광', price: 42000, unit: 'm', color: '#F7F6F2', subColor: '#E5E3DC', texture: 'matte_pet', roughness: 0.36, metalness: 0.02 },
  { id: 'fm-bodac-charcoal', kind: 'film', brand: '현대L&C', series: '보닥 메탈릭', name: '딥 차콜 스틸', spec: '중문 프레임', price: 49000, unit: 'm', color: '#2B2E33', subColor: '#191B1E', texture: 'matte_pet', roughness: 0.32, metalness: 0.38 },
  { id: 'fm-lx-benif-cream', kind: 'film', brand: 'LX하우시스', series: '베니프', name: '슈퍼매트 크림 화이트 PET', spec: '싱크대·문틀', price: 43000, unit: 'm', color: '#F3EFE7', subColor: '#E5DFD2', texture: 'matte_pet', roughness: 0.36, metalness: 0.02 },
  { id: 'fm-lx-benif-cashmere', kind: 'film', brand: 'LX하우시스', series: '베니프', name: '웜 캐시미어 베이지 PET', spec: '주방·붙박이장', price: 44000, unit: 'm', color: '#DFD5C8', subColor: '#C9BEB0', texture: 'matte_pet', roughness: 0.36, metalness: 0.02 },

  // 조명 / 실링팬
  { id: 'lt-lucci-wood', kind: 'lighting', brand: '루씨에어', series: '레이더', name: '티크 우드 3엽 실링팬', spec: '52인치 DC모터', price: 490000, unit: '대', color: '#9C6B43', subColor: '#1D1E22', texture: 'wide_oak', roughness: 0.44, metalness: 0.14 },
  { id: 'lt-lucci-white', kind: 'lighting', brand: '루씨에어', series: '레이더', name: '매트 화이트 실링팬', spec: '52인치 DC모터', price: 470000, unit: '대', color: '#F4F3EF', subColor: '#D6D4CE', texture: 'matte_pet', roughness: 0.35, metalness: 0.1 },
  { id: 'lt-philips-2inch', kind: 'lighting', brand: '필립스 LED', series: 'COB', name: '2인치 매립 다운라이트 (3000K)', spec: '7W 전구색', price: 35000, unit: '개', color: '#FFD99E', texture: 'solid', roughness: 0.2, metalness: 0.1 },

  // 콘센트 / 스위치
  { id: 'el-legrand-white', kind: 'electrical', brand: '르그랑', series: '아테오', name: '매트 화이트 2구 콘센트/스위치', spec: '슬림 매립형', price: 29000, unit: '개소', color: '#F8F8F6', subColor: '#D5D4CE', texture: 'solid', roughness: 0.3, metalness: 0.05 },
  { id: 'el-jung-silver', kind: 'electrical', brand: '융 (JUNG)', series: 'LS990', name: '알루미늄 실버 스퀘어', spec: '독일 하이엔드', price: 68000, unit: '개소', color: '#CFD3D8', subColor: '#8B919B', texture: 'solid', roughness: 0.24, metalness: 0.55 },
  { id: 'el-jung-black', kind: 'electrical', brand: '융 (JUNG)', series: 'LS990', name: '매트 그라파이트 블랙', spec: '다크 포인트', price: 72000, unit: '개소', color: '#25272B', subColor: '#111214', texture: 'solid', roughness: 0.36, metalness: 0.25 },

  // 가전 / 냉장고 / 인덕션
  { id: 'ap-bespoke-white', kind: 'appliance', brand: '삼성 비스포크', series: '키친핏', name: '코타 화이트 4도어', spec: '빌트인 냉장고장', price: 3450000, unit: '세트', color: '#F5F2EB', subColor: '#1C1E22', texture: 'matte_pet', roughness: 0.28, metalness: 0.05 },
  { id: 'ap-objet-beige', kind: 'appliance', brand: 'LG 오브제', series: '미스트 글래스', name: '네이처 베이지 4도어', spec: '무광 글래스', price: 3680000, unit: '세트', color: '#E7DDD0', subColor: '#252320', texture: 'matte_pet', roughness: 0.2, metalness: 0.08 },
  { id: 'ap-bespoke-charcoal', kind: 'appliance', brand: '삼성 비스포크', series: '새틴 차콜', name: '새틴 차콜 4도어', spec: '다크 메탈', price: 3550000, unit: '세트', color: '#393C41', subColor: '#181A1D', texture: 'matte_pet', roughness: 0.3, metalness: 0.45 },
  { id: 'ap-bespoke-induction', kind: 'appliance', brand: '삼성 비스포크', series: '인덕션', name: '플랫 3구 블랙 글래스', spec: '쇼트세란 600mm', price: 1220000, unit: '대', color: '#17191C', subColor: '#6B7280', texture: 'solid', roughness: 0.08, metalness: 0.28 },
];

export const getMat = (id?: string): MaterialItem => {
  if (!id) return MATERIALS_DB[0];
  return MATERIALS_DB.find((m) => m.id === id) || MATERIALS_DB[0];
};
