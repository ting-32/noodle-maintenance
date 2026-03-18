import React, { useState, useEffect } from 'react';
import { Camera, X, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { AddLogPayload } from '../types';
import { compressImageToBase64 } from '../utils/image';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'maintenance_draft_state';

const defaultState = {
  equipmentId: '',
  category: '',
  selectedItemIds: [] as string[],
  cost: '',
  vendorName: '',
  vendorPhone: '',
  notes: '',
  beforePhotoBase64: null as string | null,
  afterPhotoBase64: null as string | null,
};

export default function ExecuteMaintenance() {
  const { equipment: equipmentList, items: itemList, history, loadingEquipment, loadingItems, refreshData, categories } = useData();
  const [state, setState] = useState(defaultState);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isVendorExpanded, setIsVendorExpanded] = useState(false);

  useEffect(() => {
    // Load draft
    const draft = localStorage.getItem(STORAGE_KEY);
    let loadedState = null;
    if (draft) {
      try {
        loadedState = JSON.parse(draft);
        setState(loadedState);
        if (loadedState.vendorName || loadedState.vendorPhone || loadedState.notes) {
          setIsVendorExpanded(true);
        }
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    
    if (categories.length > 0) {
      setState(prev => {
        if (!prev.category) {
          return { ...prev, category: categories[0].name };
        }
        return prev;
      });
    }
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageToBase64(file);
      if (type === 'before') updateState({ beforePhotoBase64: base64 });
      else updateState({ afterPhotoBase64: base64 });
    } catch (err) {
      alert('圖片處理失敗');
    }
  };

  const removePhoto = (type: 'before' | 'after') => {
    if (type === 'before') updateState({ beforePhotoBase64: null });
    else updateState({ afterPhotoBase64: null });
  };

  const toggleItem = (id: string) => {
    const newItems = state.selectedItemIds.includes(id)
      ? state.selectedItemIds.filter(i => i !== id)
      : [...state.selectedItemIds, id];
    updateState({ selectedItemIds: newItems });
  };

  const handleSave = () => {
    if (!state.equipmentId) {
      alert('請選擇設備');
      return;
    }
    if (!state.category) {
      alert('請選擇維修類別');
      return;
    }
    if (state.selectedItemIds.length === 0) {
      alert('請選擇至少一個維修項目');
      return;
    }

    const eqName = equipmentList.find(e => e.id === state.equipmentId)?.name || '';
    const itemNames = state.selectedItemIds
      .map(id => itemList.find(i => i.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const payload: AddLogPayload = {
      equipmentId: state.equipmentId,
      equipmentName: eqName,
      category: state.category,
      itemIds: state.selectedItemIds,
      itemName: itemNames,
      cost: parseInt(state.cost) || 0,
      vendorName: state.vendorName,
      vendorPhone: state.vendorPhone,
      timeSpent: 0,
      notes: state.notes,
      beforePhotoBase64: state.beforePhotoBase64 || undefined,
      afterPhotoBase64: state.afterPhotoBase64 || undefined,
    };

    // 1. 立即跳出提示
    toast.success('維修單已建立，照片背景上傳中...', { duration: 4000 });

    // 2. 立即清空表單，讓使用者可以填下一張
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);

    // 3. 在背景執行 API 請求 (不使用 await)
    api.addLog(payload)
      .then(() => {
        toast.success('背景上傳完成！');
        refreshData('history'); // 上傳成功後再更新歷史紀錄
      })
      .catch((err) => {
        toast.error('上傳失敗，請檢查網路連線');
        console.error(err);
      });
  };

  // 萃取不重複的廠商名稱
  const uniqueVendors = Array.from(
    new Set(history.map(r => r.vendorName).filter(Boolean))
  ) as string[];

  if (loadingEquipment || loadingItems) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  return (
    <div className="p-4 space-y-6 pb-32">
      {/* Form Section */}
      <div className="space-y-6">
        {/* Card 1: 基本資訊 */}
        <div className="bg-zinc-900/40 rounded-2xl p-5 space-y-5 border border-zinc-800/50">
          <h3 className="text-zinc-100 font-bold text-lg mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
            基本資訊
          </h3>
          {/* Equipment */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">設備名稱</label>
            <select
              value={state.equipmentId}
              onChange={e => updateState({ equipmentId: e.target.value })}
              className="w-full h-[60px] bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-lg text-zinc-100 focus:outline-none focus:border-amber-500 appearance-none"
            >
              <option value="" disabled>請選擇設備...</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">維修類別</label>
            <button
              onClick={() => setIsCategoryOpen(true)}
              className="w-full h-[60px] bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-lg text-left flex items-center justify-between focus:outline-none focus:border-amber-500"
            >
              <div className="flex items-center gap-3">
                {state.category && (
                  <div className={`w-3 h-3 rounded-full ${categories.find(c => c.name === state.category)?.color || 'bg-zinc-500'}`} />
                )}
                <span className={state.category ? 'text-zinc-100' : 'text-zinc-500'}>
                  {state.category ? state.category : '請選擇維修類別'}
                </span>
              </div>
              <ChevronDown className="text-zinc-500" size={20} />
            </button>
          </div>

          {/* Items (Pills) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">維修項目 (可多選)</label>
            <div className="flex flex-wrap gap-2">
              {itemList
                .filter(item => {
                  // 1. 根據選擇的設備過濾專屬項目
                  if (state.equipmentId) {
                    const selectedEquipment = equipmentList.find(eq => eq.id === state.equipmentId);
                    if (selectedEquipment && selectedEquipment.itemIds && selectedEquipment.itemIds.length > 0) {
                      if (!selectedEquipment.itemIds.includes(item.id)) {
                        return false;
                      }
                    }
                  }
                  // 2. 根據類別過濾
                  if (state.category) {
                    return item.category === state.category;
                  }
                  return true;
                })
                .map(item => {
                const isSelected = state.selectedItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`min-h-[48px] px-5 rounded-full text-sm font-bold transition-colors border ${
                      isSelected 
                        ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: 維修細節 */}
        <div className="bg-zinc-900/40 rounded-2xl p-5 space-y-5 border border-zinc-800/50">
          <h3 className="text-zinc-100 font-bold text-lg mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
            維修細節
          </h3>
          {/* Photos */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before Photo */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">維修前</label>
              {state.beforePhotoBase64 ? (
                <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800">
                  <img src={state.beforePhotoBase64} alt="Before" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto('before')} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors text-zinc-500 hover:text-amber-500">
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm font-bold">拍攝照片</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoUpload(e, 'before')} />
                </label>
              )}
            </div>

            {/* After Photo */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">維修後</label>
              {state.afterPhotoBase64 ? (
                <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800">
                  <img src={state.afterPhotoBase64} alt="After" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto('after')} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors text-zinc-500 hover:text-amber-500">
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm font-bold">拍攝照片</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoUpload(e, 'after')} />
                </label>
              )}
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">維修金額</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={state.cost}
                onChange={e => updateState({ cost: e.target.value })}
                placeholder="0"
                className="w-full h-[60px] bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 text-lg text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: 外部廠商與備註 */}
        <div className="bg-zinc-900/40 rounded-2xl p-5 border border-zinc-800/50">
          <button 
            onClick={() => setIsVendorExpanded(!isVendorExpanded)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              <h3 className="text-zinc-100 font-bold text-lg">外部廠商與備註</h3>
            </div>
            <div className={`text-zinc-500 transition-transform duration-300 ${isVendorExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} />
            </div>
          </button>

          {/* 展開後的內容 */}
          {isVendorExpanded && (
            <div className="mt-5 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">
              {/* Vendor Name (廠商名稱) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">廠商名稱</label>
                <input
                  type="text"
                  list="vendor-list"
                  value={state.vendorName}
                  onChange={e => updateState({ vendorName: e.target.value })}
                  placeholder="例如：王老闆水電行"
                  className="w-full h-[60px] bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                />
                {/* 建立 datalist */}
                <datalist id="vendor-list">
                  {uniqueVendors.map((vendor, index) => (
                    <option key={index} value={vendor} />
                  ))}
                </datalist>
              </div>

              {/* Vendor Phone (廠商電話) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">廠商電話</label>
                <input
                  type="tel"
                  value={state.vendorPhone}
                  onChange={e => updateState({ vendorPhone: e.target.value })}
                  placeholder="例如：0912-345-678"
                  className="w-full h-[60px] bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">備註說明</label>
                <textarea
                  value={state.notes}
                  onChange={e => updateState({ notes: e.target.value })}
                  placeholder="請輸入詳細維修狀況..."
                  className="w-full h-[120px] bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent z-40 pointer-events-none">
          <button
            onClick={handleSave}
            className="w-full h-[60px] bg-emerald-600 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 pointer-events-auto backdrop-blur-sm"
          >
            <CheckCircle2 size={24} />
            結束並記錄
          </button>
        </div>
      </div>

      {/* Category Bottom Sheet */}
      {isCategoryOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-50" 
            onClick={() => setIsCategoryOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 w-full bg-zinc-900 rounded-t-2xl p-6 z-50 animate-in slide-in-from-bottom-full duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-100">選擇維修類別</h3>
              <button onClick={() => setIsCategoryOpen(false)} className="text-zinc-400 hover:text-zinc-100">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    updateState({ category: cat.name });
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full h-[60px] rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3 ${
                    state.category === cat.name 
                      ? 'bg-amber-500 text-zinc-950' 
                      : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${cat.color || 'bg-zinc-500'}`} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

