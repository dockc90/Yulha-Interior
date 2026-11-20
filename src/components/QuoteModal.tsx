import React from 'react';
import { Calculator, X } from 'lucide-react';
import { useDesignStore } from '../store/useDesignStore';
import { getCatalogItem } from '../data/brandCatalog';

export const QuoteModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { published3DPlan } = useDesignStore();
  if (!open) return null;

  const rows: { group: string; item: string; qty: string; amount: number }[] = [];

  published3DPlan.spaces.forEach((sp) => {
    const m = getCatalogItem(sp.floorMaterialId);
    const py = Math.max(1, Math.round((sp.width * sp.depth) / 3.3058));
    rows.push({ group: '바닥(마루/타일)', item: `${sp.name} · ${m.brand} ${m.name}`, qty: `${py}평`, amount: m.price * py });
  });

  const wallMats = new Set(published3DPlan.walls.map((w) => w.materialId));
  wallMats.forEach((id) => {
    const m = getCatalogItem(id);
    const py = Math.max(5, Math.round(published3DPlan.areaSqm * 0.6));
    rows.push({ group: '벽면(벽지/월판넬)', item: `${m.brand} ${m.name}`, qty: `${py}평`, amount: m.price * py });
  });

  published3DPlan.props.forEach((pr) => {
    const m = getCatalogItem(pr.materialId);
    if (m.group === 'appliance' || m.group === 'electrical' || m.group === 'lighting') {
      rows.push({
        group: m.group === 'appliance' ? '가전/빌트인' : m.group === 'electrical' ? '전기/설비' : '조명/실링팬',
        item: `${pr.label} (${m.brand})`,
        qty: `1${m.unit}`,
        amount: m.price,
      });
    }
  });

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden flex flex-col max-h-[84vh]">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#0F7B6C]" />
            <h2 className="text-sm font-bold">실시간 인테리어 예상 견적서 (3D 기준)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#787774]">{published3DPlan.name}</div>
              <div className="text-xl font-bold text-[#0F7B6C]">총 {total.toLocaleString()} 원</div>
            </div>
            <div className="text-[11px] text-[#787774] text-right">
              자재 · 가전 · 조명 · 콘센트/스위치 포함
              <br />
              (철거·목공·설비 인건비 별도)
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E9E9E7] text-left text-[#787774]">
                <th className="py-2">구분</th>
                <th className="py-2">품목 및 브랜드</th>
                <th className="py-2 text-right">수량</th>
                <th className="py-2 text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-[#F1F1EF]">
                  <td className="py-2 text-[#787774]">{r.group}</td>
                  <td className="py-2 font-medium">{r.item}</td>
                  <td className="py-2 text-right text-[#787774]">{r.qty}</td>
                  <td className="py-2 text-right font-semibold">{r.amount.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
