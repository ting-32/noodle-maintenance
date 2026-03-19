import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock, X, Camera, Loader2, DollarSign, Building2, FileText, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { api } from '../services/api';

const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function History() {
  const { history: records, loadingHistory: loading, refreshData, categories } = useData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // 1. 新增搜尋關鍵字的狀態
  const [searchTerm, setSearchTerm] = useState('');

  // 2. 根據關鍵字過濾紀錄 (即時比對四個欄位)
  const filteredRecords = records.filter(record => {
    if (!searchTerm.trim()) return true; // 如果沒輸入，顯示全部
    
    const term = searchTerm.toLowerCase();
    
    // 確保欄位有值才進行 toLowerCase 比對，避免 null 報錯
    const matchCategory = record.category?.toLowerCase().includes(term);
    const matchItemName = record.itemName?.toLowerCase().includes(term);
    const matchVendor = record.vendorName?.toLowerCase().includes(term);
    const matchEquipment = record.equipmentName?.toLowerCase().includes(term);

    // 只要其中一個欄位符合，就保留這筆資料
    return matchCategory || matchItemName || matchVendor || matchEquipment;
  });

  const handlePhotoUpload = async (recordId: string, photoType: 'before' | 'after', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingId(recordId);
      const base64String = await compressImageToBase64(file);
      await api.updateLogPhoto({ id: recordId, photoType, base64String });
      await refreshData('history');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上傳失敗，請稍後再試');
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return <div className="text-center py-8 text-zinc-500">載入中...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* 搜尋列 UI (吸頂設計) */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="搜尋設備、項目、分類或廠商..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-lg"
          />
          {/* 當有輸入文字時，顯示一鍵清除按鈕 */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 如果搜尋不到結果，顯示友善提示 */}
      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p>找不到符合「{searchTerm}」的紀錄</p>
        </div>
      )}

      {/* 將 records 改為 filteredRecords */}
      {filteredRecords.map(record => (
        <div key={record.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          {/* Card Header (Always visible) */}
          <button
            onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            className="w-full p-4 flex items-center gap-3 text-left focus:outline-none"
          >
            {/* 左側 80%：純文字資訊區 */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* 第一行：設備名稱 (移除原本在這裡的狀態 Icon) */}
              <div className="flex items-center">
                <span className="text-amber-500 font-bold text-lg truncate">
                  {record.equipmentName}
                </span>
              </div>

              {/* 第二行：日期、類別與項目 (保持不變) */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500 flex-shrink-0">{record.date}</span>
                <span className="w-px h-3 bg-zinc-700 flex-shrink-0"></span>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {record.category && (() => {
                    const cat = categories.find(c => c.name === record.category);
                    const colorClass = cat?.color ? cat.color.replace('bg-', 'text-') : 'text-zinc-400';
                    const bgClass = cat?.color ? cat.color.replace('bg-', 'bg-').concat('/20') : 'bg-zinc-800';
                    
                    return (
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${bgClass} ${colorClass}`}>
                        {record.category}
                      </span>
                    );
                  })()}
                  <span className="text-zinc-400 truncate">
                    {record.itemName}
                  </span>
                </div>
              </div>

              {/* 第三行：微型標籤列 (Micro-Metadata Row) */}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <DollarSign size={12} /> NT$ {(record.cost || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={12} /> {record.vendorName || '無廠商'}
                </span>
                {record.notes && (
                  <span className="flex items-center gap-1">
                    <FileText size={12} /> {record.notes.length > 10 ? record.notes.substring(0, 10) + '...' : record.notes}
                  </span>
                )}
              </div>
            </div>

            {/* 右側 20%：狀態與操作熱區 (Unified Status & Action Zone) */}
            <div className="flex-shrink-0 flex items-center gap-3 pl-3 border-l border-zinc-800/50">
              {/* 狀態指示 Icon (稍微放大到 size={20} 以增加辨識度) */}
              <div className="flex items-center justify-center">
                {record.status === 'completed' && <CheckCircle2 size={20} className="text-emerald-500" />}
                {record.status === 'issue' && <AlertTriangle size={20} className="text-red-500" />}
                {record.status === 'pending' && <Clock size={20} className="text-amber-500" />}
              </div>
              
              {/* 展開箭頭 */}
              <div className="w-8 h-8 flex items-center justify-center bg-zinc-950 rounded-full text-zinc-400">
                {expandedId === record.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
          </button>

          {/* Expanded Content */}
          {expandedId === record.id && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
              
              {/* ▼ 新增：完整維護項目 (解決手機版截斷問題) ▼ */}
              <div className="mb-4">
                <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2">維護項目</h4>
                <p className="text-zinc-300 leading-relaxed break-words">
                  {record.itemName}
                </p>
              </div>
              {/* ▲ 新增結束 ▲ */}

              {/* 原本的備註說明 */}
              <div className="mb-4">
                <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2">備註說明</h4>
                <p className="text-zinc-300 leading-relaxed break-words">{record.notes || '無備註'}</p>
              </div>

              {(record.beforePhotoUrl || record.afterPhotoUrl || record.status !== 'completed') && (
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2">照片紀錄</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Before Photo */}
                    <div className="space-y-1">
                      {record.beforePhotoUrl ? (
                        <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden relative">
                          <img 
                            src={record.beforePhotoUrl} 
                            alt="維修前" 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                            referrerPolicy="no-referrer"
                            onClick={() => setLightboxImage(record.beforePhotoUrl!)} 
                          />
                          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">維修前</div>
                        </div>
                      ) : record.status !== 'completed' ? (
                        <label className="aspect-video bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-zinc-800/50 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(record.id, 'before', e)}
                            disabled={uploadingId === record.id}
                          />
                          {uploadingId === record.id ? (
                            <div className="flex flex-col items-center text-amber-500">
                              <Loader2 className="animate-spin mb-2" size={24} />
                              <span className="text-xs font-bold">上傳中...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-zinc-500">
                              <Camera size={24} className="mb-2" />
                              <span className="text-xs font-bold">補傳維修前</span>
                            </div>
                          )}
                        </label>
                      ) : null}
                    </div>

                    {/* After Photo */}
                    <div className="space-y-1">
                      {record.afterPhotoUrl ? (
                        <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden relative">
                          <img 
                            src={record.afterPhotoUrl} 
                            alt="維修後" 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                            referrerPolicy="no-referrer"
                            onClick={() => setLightboxImage(record.afterPhotoUrl!)} 
                          />
                          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">維修後</div>
                        </div>
                      ) : record.status !== 'completed' ? (
                        <label className="aspect-video bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-zinc-800/50 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(record.id, 'after', e)}
                            disabled={uploadingId === record.id}
                          />
                          {uploadingId === record.id ? (
                            <div className="flex flex-col items-center text-amber-500">
                              <Loader2 className="animate-spin mb-2" size={24} />
                              <span className="text-xs font-bold">上傳中...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-zinc-500">
                              <Camera size={24} className="mb-2" />
                              <span className="text-xs font-bold">補傳維修後</span>
                            </div>
                          )}
                        </label>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Lightbox (全螢幕燈箱) */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)} // 點擊黑色背景即可關閉
        >
          <div className="relative max-w-full max-h-full flex flex-col items-center">
            {/* 關閉按鈕 */}
            <button 
              className="absolute -top-12 right-0 text-zinc-400 hover:text-white transition-colors p-2"
              onClick={() => setLightboxImage(null)}
            >
              <X size={32} />
            </button>
            
            {/* 完整大圖 */}
            <img 
              src={lightboxImage} 
              alt="放大檢視" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()} // 避免點擊圖片本身時觸發背景的關閉事件
            />
          </div>
        </div>
      )}
    </div>
  );
}
