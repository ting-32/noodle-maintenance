import { useState, useEffect } from 'react';
import { Server, ChevronDown, ChevronUp, Calendar, Wrench, Package, Loader2, GripVertical } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { Equipment } from '../types';

export default function EquipmentOverview() {
  const { equipment: equipmentList, history, categories, items, loadingEquipment, loadingHistory, reorderEquipment } = useData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [localOrder, setLocalOrder] = useState<Equipment[]>([]);

  useEffect(() => {
    if (!isReordering) {
      setLocalOrder(equipmentList);
    }
  }, [equipmentList, isReordering]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newOrder = Array.from(localOrder);
    const [reorderedItem] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destinationIndex, 0, reorderedItem);

    setLocalOrder(newOrder);
  };

  const handleSaveOrder = async () => {
    try {
      const orderedIds = localOrder.map(eq => eq.id);
      await reorderEquipment(orderedIds);
      toast.success('排序已儲存');
      setIsReordering(false);
    } catch (error) {
      toast.error('儲存排序失敗');
    }
  };

  if (loadingEquipment || loadingHistory) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  const displayList = isReordering ? localOrder : equipmentList;

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Server className="text-amber-500" />
          設備總覽
        </h2>
        {!isReordering ? (
          <button
            onClick={() => {
              setLocalOrder(equipmentList);
              setIsReordering(true);
              setExpandedId(null);
            }}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            排序
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsReordering(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveOrder}
              className="px-4 py-2 bg-amber-500 text-zinc-950 rounded-lg text-sm font-bold hover:bg-amber-400 transition-colors"
            >
              儲存
            </button>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="equipment-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {displayList.map((eq, index) => {
                const eqRecords = history.filter(r => r.equipmentId === eq.id || r.equipmentName === eq.name);
                const lastUpdated = eqRecords.length > 0 ? eqRecords[0]?.date.split(' ')[0] : null;

                const boundItemCategories = (eq.itemIds || [])
                  .map(itemId => items.find(i => i.id === itemId)?.category)
                  .filter(Boolean) as string[];
                const historyCategories = eqRecords.map(r => r.category);
                const relevantCategoryNames = Array.from(new Set([...boundItemCategories, ...historyCategories]));
                const relevantCategories = categories.filter(cat => relevantCategoryNames.includes(cat.name));

                return (
                  <Draggable key={eq.id} draggableId={eq.id} index={index} isDragDisabled={!isReordering}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-zinc-900 rounded-xl border ${snapshot.isDragging ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-zinc-800'} overflow-hidden transition-colors`}
                        style={provided.draggableProps.style}
                      >
                        <div className="flex items-stretch">
                          {isReordering && (
                            <div
                              {...provided.dragHandleProps}
                              className="w-12 flex items-center justify-center bg-zinc-800/50 text-zinc-500 hover:text-amber-500 cursor-grab active:cursor-grabbing border-r border-zinc-800"
                            >
                              <GripVertical size={20} />
                            </div>
                          )}
                          <button
                            onClick={() => !isReordering && setExpandedId(expandedId === eq.id ? null : eq.id)}
                            className={`flex-1 min-h-[80px] p-4 flex items-center justify-between text-left focus:outline-none ${isReordering ? 'cursor-default' : 'cursor-pointer'}`}
                            disabled={isReordering}
                          >
                            <div className="flex-1 flex flex-col gap-2 pr-4">
                              <span className="text-lg font-bold text-zinc-100">{eq.name}</span>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {relevantCategories.map((cat, catIndex) => {
                                  const catRecords = eqRecords.filter(r => r.category === cat.name);
                                  if (catRecords.length === 0) return null;
                                  
                                  const catColorClass = cat.color ? cat.color.replace('bg-', 'text-') : 'text-zinc-400';
                                  const catBgClass = cat.color ? cat.color.replace('bg-', 'bg-').concat('/10') : 'bg-zinc-800/50';
                                  
                                  return (
                                    <span key={cat.id} className={`${catColorClass} ${catBgClass} text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1`}>
                                      <Package size={12} />
                                      {catRecords.length} 筆{cat.name}
                                    </span>
                                  );
                                })}
                                {eqRecords.length > 0 ? (
                                  <span className="text-xs text-zinc-500 ml-auto">最後更新: {lastUpdated}</span>
                                ) : (
                                  <span className="text-xs text-zinc-600 italic">尚無任何紀錄</span>
                                )}
                              </div>
                            </div>
                            {!isReordering && (
                              <div className="w-[40px] h-[40px] flex-none flex items-center justify-center bg-zinc-950 rounded-full text-zinc-400">
                                {expandedId === eq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </div>
                            )}
                          </button>
                        </div>

                        {expandedId === eq.id && !isReordering && (
                          <>
                            {relevantCategories.length === 0 ? (
                              <div className="text-sm text-zinc-500 text-center py-8 bg-zinc-950/50 border-t border-zinc-800">
                                💡 此設備尚未綁定任何維護項目且無歷史紀錄
                              </div>
                            ) : (
                              <>
                                <div className="text-xs text-zinc-500 text-center py-2 bg-zinc-950/50 border-t border-zinc-800">👉 左右滑動查看不同分類</div>
                                <div className="py-4 bg-zinc-950/50 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                                  {relevantCategories.map((cat, index) => {
                                    const catRecords = eqRecords.filter(r => r.category === cat.name);
                                
                                const colorClass = cat.color ? cat.color.replace('bg-', 'text-') : 'text-zinc-400';
                                const bgClass = cat.color || 'bg-zinc-500';

                                return (
                                  <div key={cat.id} className="w-[85%] flex-none snap-center bg-zinc-900/50 rounded-lg p-4 mx-2 max-h-[250px] overflow-y-auto">
                                    <div className={`flex items-center gap-2 ${colorClass} mb-1`}>
                                      <Package size={16} />
                                      <h4 className="text-sm font-bold tracking-wider uppercase">{cat.name}</h4>
                                    </div>
                                    {catRecords.length > 0 ? (
                                      <ul className="relative border-l border-zinc-700 ml-2 mt-4 space-y-4">
                                        {catRecords.map(r => (
                                          <li key={r.id} className="relative pl-4">
                                            <div className={`absolute w-2 h-2 rounded-full ${bgClass} -left-[4.5px] top-1.5`}></div>
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
                                );
                              })}
                            </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
