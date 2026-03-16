import { useState } from 'react';
import { Server, ChevronDown, ChevronUp, Calendar, Wrench, Package, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function EquipmentOverview() {
  const { equipment: equipmentList, history, loadingEquipment, loadingHistory } = useData();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loadingEquipment || loadingHistory) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  return (
    <div className="p-4 space-y-4 pb-8">
      <h2 className="text-xl font-bold text-zinc-100 mb-4 flex items-center gap-2">
        <Server className="text-amber-500" />
        設備總覽
      </h2>
      {equipmentList.map(eq => {
        const eqRecords = history.filter(r => r.equipmentId === eq.id);
        const routineRecords = eqRecords.filter(r => r.category === '定期維護');
        const repairRecords = eqRecords.filter(r => r.category === '設備維修');
        const updateRecords = eqRecords.filter(r => r.category === '更新配件');

        return (
          <div key={eq.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === eq.id ? null : eq.id)}
              className="w-full min-h-[80px] p-4 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="text-lg font-bold text-zinc-100">{eq.name}</span>
              <div className="w-[40px] h-[40px] flex items-center justify-center bg-zinc-950 rounded-full text-zinc-400">
                {expandedId === eq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {expandedId === eq.id && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 space-y-4">
                {/* 分類一：定期維護 */}
                <div className="pl-3 border-l-2 border-emerald-500">
                  <div className="flex items-center gap-2 text-emerald-500 mb-1">
                    <Calendar size={16} />
                    <h4 className="text-sm font-bold tracking-wider uppercase">定期維護</h4>
                  </div>
                  {routineRecords.length > 0 ? (
                    <ul className="space-y-1 mt-2">
                      {routineRecords.map(r => (
                        <li key={r.id} className="text-zinc-300 text-sm flex gap-2">
                          <span className="text-zinc-500">{r.date.split(' ')[0]}</span>
                          <span>{r.itemName}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500 text-sm">尚無紀錄</p>
                  )}
                </div>

                {/* 分類二：設備維修 */}
                <div className="pl-3 border-l-2 border-amber-500">
                  <div className="flex items-center gap-2 text-amber-500 mb-1">
                    <Wrench size={16} />
                    <h4 className="text-sm font-bold tracking-wider uppercase">設備維修</h4>
                  </div>
                  {repairRecords.length > 0 ? (
                    <ul className="space-y-1 mt-2">
                      {repairRecords.map(r => (
                        <li key={r.id} className="text-zinc-300 text-sm flex gap-2">
                          <span className="text-zinc-500">{r.date.split(' ')[0]}</span>
                          <span>{r.itemName}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500 text-sm">尚無紀錄</p>
                  )}
                </div>

                {/* 分類三：更新配件 */}
                <div className="pl-3 border-l-2 border-blue-500">
                  <div className="flex items-center gap-2 text-blue-500 mb-1">
                    <Package size={16} />
                    <h4 className="text-sm font-bold tracking-wider uppercase">更新配件</h4>
                  </div>
                  {updateRecords.length > 0 ? (
                    <ul className="space-y-1 mt-2">
                      {updateRecords.map(r => (
                        <li key={r.id} className="text-zinc-300 text-sm flex gap-2">
                          <span className="text-zinc-500">{r.date.split(' ')[0]}</span>
                          <span>{r.itemName}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500 text-sm">尚無紀錄</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
