import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function History() {
  const { history: records, loadingHistory: loading } = useData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (loading) return <div className="text-center py-8 text-zinc-500">載入中...</div>;

  return (
    <div className="p-4 space-y-4">
      {records.map(record => (
        <div key={record.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          {/* Card Header (Always visible) */}
          <button
            onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            className="w-full min-h-[80px] p-4 flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-amber-500 font-bold text-lg">{record.equipmentName}</span>
                {record.category && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    record.category === '定期維護' ? 'bg-emerald-500/20 text-emerald-500' :
                    record.category === '設備維修' ? 'bg-amber-500/20 text-amber-500' :
                    record.category === '更新配件' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {record.category}
                  </span>
                )}
                <span className="text-zinc-500 text-sm">{record.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-300">{record.itemName}</span>
                {record.status === 'completed' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {record.status === 'issue' && <AlertTriangle size={16} className="text-red-500" />}
                {record.status === 'pending' && <Clock size={16} className="text-amber-500" />}
              </div>
            </div>
            <div className="w-[40px] h-[40px] flex items-center justify-center bg-zinc-950 rounded-full text-zinc-400">
              {expandedId === record.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {/* Expanded Content */}
          {expandedId === record.id && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
              <div className="mb-4">
                <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2">備註說明</h4>
                <p className="text-zinc-300 leading-relaxed">{record.notes || '無備註'}</p>
              </div>

              {(record.beforePhotoUrl || record.afterPhotoUrl) && (
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2">照片紀錄</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {record.beforePhotoUrl && (
                      <div className="space-y-1">
                        <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden relative">
                          <img 
                            src={record.beforePhotoUrl} 
                            alt="維修前" 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                            referrerPolicy="no-referrer"
                            onClick={() => setLightboxImage(record.beforePhotoUrl)} 
                          />
                          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">維修前</div>
                        </div>
                      </div>
                    )}
                    {record.afterPhotoUrl && (
                      <div className="space-y-1">
                        <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden relative">
                          <img 
                            src={record.afterPhotoUrl} 
                            alt="維修後" 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                            referrerPolicy="no-referrer"
                            onClick={() => setLightboxImage(record.afterPhotoUrl)} 
                          />
                          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">維修後</div>
                        </div>
                      </div>
                    )}
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
