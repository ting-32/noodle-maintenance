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
        const eqRecords = history.filter(r => r.equipmentId === eq.id || r.equipmentName === eq.name);
        const routineRecords = eqRecords.filter(r => r.category === '定期維護');
        const repairRecords = eqRecords.filter(r => r.category === '設備維修');
        const updateRecords = eqRecords.filter(r => r.category === '更新配件');
        const lastUpdated = eqRecords.length > 0 ? eqRecords[0]?.date.split(' ')[0] : null;

        return (
          <div key={eq.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === eq.id ? null : eq.id)}
              className="w-full min-h-[80px] p-4 flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex-1 flex flex-col gap-2 pr-4">
                <span className="text-lg font-bold text-zinc-100">{eq.name}</span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {routineRecords.length > 0 && (
                    <span className="bg-emerald-500/10 text-emerald-500 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                      <Calendar size={12} />
                      {routineRecords.length} 筆維護
                    </span>
                  )}
                  {repairRecords.length > 0 && (
                    <span className="bg-amber-500/10 text-amber-500 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                      <Wrench size={12} />
                      {repairRecords.length} 筆維修
                    </span>
                  )}
                  {updateRecords.length > 0 && (
                    <span className="bg-blue-500/10 text-blue-500 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                      <Package size={12} />
                      {updateRecords.length} 筆配件
                    </span>
                  )}
                  {eqRecords.length > 0 ? (
                    <span className="text-xs text-zinc-500 ml-auto">最後更新: {lastUpdated}</span>
                  ) : (
                    <span className="text-xs text-zinc-600 italic">尚無任何紀錄</span>
                  )}
                </div>
              </div>
              <div className="w-[40px] h-[40px] flex-none flex items-center justify-center bg-zinc-950 rounded-full text-zinc-400">
                {expandedId === eq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {expandedId === eq.id && (
              <>
                <div className="text-xs text-zinc-500 text-center py-2 bg-zinc-950/50 border-t border-zinc-800">👉 左右滑動查看不同分類</div>
                <div className="py-4 bg-zinc-950/50 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                  {/* 分類一：定期維護 */}
                  <div className="w-[85%] flex-none snap-center bg-zinc-900/50 rounded-lg p-4 mx-2 max-h-[250px] overflow-y-auto">
                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                      <Calendar size={16} />
                      <h4 className="text-sm font-bold tracking-wider uppercase">定期維護</h4>
                    </div>
                    {routineRecords.length > 0 ? (
                      <ul className="relative border-l border-zinc-700 ml-2 mt-4 space-y-4">
                        {routineRecords.map(r => (
                          <li key={r.id} className="relative pl-4">
                            <div className="absolute w-2 h-2 rounded-full bg-emerald-500 -left-[4.5px] top-1.5"></div>
                            <div className="bg-zinc-950/50 rounded-md p-2.5 border border-zinc-800/50">
                              <span className="block text-xs text-zinc-500 mb-1">{r.date.split(' ')[0]}</span>
                              <span className="block text-sm text-zinc-200 font-medium">{r.itemName}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-zinc-500 text-sm">尚無紀錄</p>
                    )}
                  </div>

                  {/* 分類二：設備維修 */}
                  <div className="w-[85%] flex-none snap-center bg-zinc-900/50 rounded-lg p-4 mx-2 max-h-[250px] overflow-y-auto">
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                      <Wrench size={16} />
                      <h4 className="text-sm font-bold tracking-wider uppercase">設備維修</h4>
                    </div>
                    {repairRecords.length > 0 ? (
                      <ul className="relative border-l border-zinc-700 ml-2 mt-4 space-y-4">
                        {repairRecords.map(r => (
                          <li key={r.id} className="relative pl-4">
                            <div className="absolute w-2 h-2 rounded-full bg-amber-500 -left-[4.5px] top-1.5"></div>
                            <div className="bg-zinc-950/50 rounded-md p-2.5 border border-zinc-800/50">
                              <span className="block text-xs text-zinc-500 mb-1">{r.date.split(' ')[0]}</span>
                              <span className="block text-sm text-zinc-200 font-medium">{r.itemName}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-zinc-500 text-sm">尚無紀錄</p>
                    )}
                  </div>

                  {/* 分類三：更新配件 */}
                  <div className="w-[85%] flex-none snap-center bg-zinc-900/50 rounded-lg p-4 mx-2 max-h-[250px] overflow-y-auto">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                      <Package size={16} />
                      <h4 className="text-sm font-bold tracking-wider uppercase">更新配件</h4>
                    </div>
                    {updateRecords.length > 0 ? (
                      <ul className="relative border-l border-zinc-700 ml-2 mt-4 space-y-4">
                        {updateRecords.map(r => (
                          <li key={r.id} className="relative pl-4">
                            <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[4.5px] top-1.5"></div>
                            <div className="bg-zinc-950/50 rounded-md p-2.5 border border-zinc-800/50">
                              <span className="block text-xs text-zinc-500 mb-1">{r.date.split(' ')[0]}</span>
                              <span className="block text-sm text-zinc-200 font-medium">{r.itemName}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-zinc-500 text-sm">尚無紀錄</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
