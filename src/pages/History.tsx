import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock, X, Camera, Loader2 } from 'lucide-react';
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
  const { history: records, loadingHistory: loading, refreshData } = useData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
                            capture="environment" 
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
                            capture="environment" 
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
