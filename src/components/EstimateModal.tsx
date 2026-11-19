import React from 'react';
import { X, Calculator } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { getMaterial } from '../data/catalog';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const EstimateModal: React.FC<Props> = ({ open, onClose }) => {
  const { project } = useProjectStore();
  if (!open) return null;

  const lines: { category: string; name: string; qty: string; subtotal: number }[] = [];

  // Rooms flooring
  project.rooms.forEach((rm) => {
    const mat = getMaterial(rm.floorMaterialId);
    const areaSqm = 12; // approx or polygon area
    const py = Math.max(1, Math.round(areaSqm / 3.3));
    lines.push({
      category: '바닥재',
      name: `${rm.name} — ${mat.brand} ${mat.name}`,
      qty: `${py} 평`,
      subtotal: mat.pricePerUnit * py,
    });
  });

  // Walls
  const wallMats = new Set(project.walls.map((w) => w.frontMaterialId));
  wallMats.forEach((id) => {
    const mat = getMaterial(id);
    lines.push({
      category: '벽체',
      name: `${mat.brand} ${mat.name}`,
      qty: `${Math.round(project.areaSqm * 0.6)} 평`,
      subtotal: mat.pricePerUnit * Math.round(project.areaSqm * 0.6),
    });
  });

  // Objects (appliances, lighting, electrical)
  project.objects.forEach((obj) => {
    const mat = getMaterial(obj.materialId);
    if (mat.category === 'appliance' || mat.category === 'electrical' || mat.category === 'lighting') {
      lines.push({
        category: mat.category === 'appliance' ? '가전/빌트인' : mat.category === 'electrical' ? '전기/설비' : '조명/실링팬',
        name: `${obj.name} (${mat.name})`,
        qty: `1 ${mat.unit}`,
        subtotal: mat.pricePerUnit,
      });
    }
  });

  const total = lines.reduce((acc, l) => acc + l.subtotal, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#0F7B6C]" />
            <h2 className="text-sm font-bold text-[#37352F]">실시간 인테리어 예상 견적서</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#787774]">{project.title}</div>
              <div className="text-xl font-bold text-[#0F7B6C] mt-0.5">
                총 {total.toLocaleString()} 원
              </div>
            </div>
            <div className="text-[11px] text-[#787774] text-right">
              자재 · 가전 · 조명 · 전기설비 포함
              <br />
              (인건비/철거비 별도 산정 기준)
            </div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E9E9E7] text-[#787774] text-left">
                <th className="py-2 font-semibold">구분</th>
                <th className="py-2 font-semibold">품목 및 자재</th>
                <th className="py-2 font-semibold text-right">수량</th>
                <th className="py-2 font-semibold text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={idx} className="border-b border-[#F1F1EF]">
                  <td className="py-2 text-[#787774]">{l.category}</td>
                  <td className="py-2 font-medium text-[#37352F]">{l.name}</td>
                  <td className="py-2 text-right text-[#787774]">{l.qty}</td>
                  <td className="py-2 text-right font-semibold text-[#37352F]">
                    {l.subtotal.toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
