import { useState } from 'react';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, X, Check, Settings, MoreVertical } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'items' | 'categories'>('equipment');

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 h-[60px] flex items-center justify-center text-sm font-bold tracking-wider transition-colors ${
            activeTab === 'equipment' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400'
          }`}
        >
          設備管理
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 h-[60px] flex items-center justify-center text-sm font-bold tracking-wider transition-colors ${
            activeTab === 'items' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400'
          }`}
        >
          項目管理
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 h-[60px] flex items-center justify-center text-sm font-bold tracking-wider transition-colors ${
            activeTab === 'categories' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400'
          }`}
        >
          類別管理
        </button>
      </div>

      <div className="p-4 pb-24">
        {activeTab === 'equipment' && <EquipmentManager />}
        {activeTab === 'items' && <ItemManager />}
        {activeTab === 'categories' && <CategoryManager />}
      </div>
    </div>
  );
}

function CategoryManager() {
  const { categories, loadingCategories: loading, setCategories, items } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const PASTEL_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500',
    'bg-green-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ];

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempCategory = { id: tempId, name: newName.trim(), color: newColor || PASTEL_COLORS[0] };
    
    setCategories(prev => [...prev, tempCategory]);
    setNewName('');
    setNewColor('');
    setIsAdding(false);
    
    api.addCategory(newName.trim(), tempCategory.color)
      .then((realData) => {
        setCategories(prev => prev.map(cat => cat.id === tempId ? realData : cat));
        toast.success('類別已新增');
      })
      .catch((err) => {
        setCategories(prev => prev.filter(cat => cat.id !== tempId));
        toast.error('新增失敗，請檢查網路');
        console.error(err);
      });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    
    const previousCategories = [...categories];
    
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, name: editName.trim(), color: editColor } : cat));
    setEditingId(null);
    
    api.updateCategory(id, editName.trim(), editColor)
      .then(() => {
        toast.success('類別已更新');
      })
      .catch((err) => {
        setCategories(previousCategories);
        toast.error('更新失敗');
        console.error(err);
      });
  };

  const handleDelete = (id: string) => {
    // 防呆機制：檢查是否被項目使用中
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;
    
    const isUsed = items.some(item => item.category === categoryToDelete.name);
    if (isUsed) {
      toast.error('此類別下尚有維護項目，請先轉移後再刪除');
      setDeletingId(null);
      return;
    }

    const previousCategories = [...categories];
    
    setCategories(prev => prev.filter(cat => cat.id !== id));
    setDeletingId(null);
    
    api.deleteCategory(id)
      .then(() => {
        toast.success('類別已刪除');
      })
      .catch((err) => {
        setCategories(previousCategories);
        toast.error('刪除失敗');
        console.error(err);
      });
  };

  if (loading) return <div className="text-center py-8 text-zinc-500">載入中...</div>;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setNewName('');
          setNewColor(PASTEL_COLORS[0]);
          setIsAdding(true);
        }}
        className="w-full h-[60px] flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500 transition-colors"
      >
        <Plus size={20} />
        <span className="font-bold">新增類別</span>
      </button>

      {categories.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-bold text-zinc-300 mb-2">尚無類別</h3>
          <p className="text-sm text-zinc-500">點擊上方按鈕建立第一個類別</p>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full flex-none ${cat.color || 'bg-zinc-500'}`} />
          <div className="flex-1 px-2 font-medium text-lg truncate">{cat.name}</div>
          {deletingId === cat.id ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(cat.id)}
                className="w-[60px] h-[60px] flex-none flex items-center justify-center text-white bg-red-600 rounded-lg font-bold text-sm"
              >
                刪除
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-300 bg-zinc-800 rounded-lg font-bold text-sm"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveMenuId(cat.id)}
              className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-amber-500 bg-zinc-950 rounded-lg"
            >
              <MoreVertical size={20} />
            </button>
          )}
        </div>
      ))}

      {/* 底部抽屜 (Bottom Sheet) */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
          onClick={() => setActiveMenuId(null)}
        >
          <div 
            className="bg-zinc-900 w-full rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom-full duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
            <div className="space-y-3">
              <button
                onClick={() => {
                  const catToEdit = categories.find(c => c.id === activeMenuId);
                  if (catToEdit) {
                    setEditingId(activeMenuId);
                    setEditName(catToEdit.name);
                    setEditColor(catToEdit.color || PASTEL_COLORS[0]);
                  }
                  setActiveMenuId(null);
                }}
                className="w-full h-[60px] flex items-center gap-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-zinc-200 transition-colors"
              >
                <Edit2 size={20} className="text-amber-500" />
                <span className="font-bold text-lg">編輯類別名稱</span>
              </button>
              <button
                onClick={() => {
                  setDeletingId(activeMenuId);
                  setActiveMenuId(null);
                }}
                className="w-full h-[60px] flex items-center gap-3 px-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"
              >
                <Trash2 size={20} />
                <span className="font-bold text-lg">刪除類別</span>
              </button>
              <button
                onClick={() => setActiveMenuId(null)}
                className="w-full h-[60px] flex items-center justify-center bg-zinc-800 rounded-xl text-zinc-300 font-bold text-lg mt-4"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 類別表單抽屜 (Bottom Sheet) */}
      {(isAdding || editingId) && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
          onClick={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
        >
          <div 
            className="bg-zinc-900 w-full rounded-t-2xl p-5 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 flex-none" />
            <h3 className="text-xl font-bold text-zinc-100 mb-6">
              {isAdding ? '新增類別' : '編輯類別'}
            </h3>
            
            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">類別名稱</label>
                <input
                  type="text"
                  value={isAdding ? newName : editName}
                  onChange={(e) => isAdding ? setNewName(e.target.value) : setEditName(e.target.value)}
                  placeholder="輸入類別名稱"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 h-[60px] text-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">標籤顏色</label>
                <div className="grid grid-cols-6 gap-3">
                  {PASTEL_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => isAdding ? setNewColor(color) : setEditColor(color)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${color} ${
                        (isAdding ? newColor : editColor) === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {(isAdding ? newColor : editColor) === color && <Check size={16} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 flex-none">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="flex-1 h-[60px] bg-zinc-800 text-zinc-300 rounded-xl font-bold text-lg transition-colors hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (isAdding) {
                    handleAdd();
                  } else if (editingId) {
                    handleUpdate(editingId);
                  }
                }}
                className="flex-1 h-[60px] bg-amber-500 text-zinc-950 rounded-xl font-bold text-lg transition-colors hover:bg-amber-400"
              >
                確認{isAdding ? '新增' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EquipmentManager() {
  const { equipment, loadingEquipment: loading, setEquipment, items, categories } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempEquipment = { id: tempId, name: newName.trim() };
    
    setEquipment(prev => [...prev, tempEquipment]);
    setNewName('');
    setIsAdding(false);
    
    api.addEquipment(newName.trim())
      .then((realData) => {
        setEquipment(prev => prev.map(eq => eq.id === tempId ? realData : eq));
        toast.success('設備已新增');
      })
      .catch((err) => {
        setEquipment(prev => prev.filter(eq => eq.id !== tempId));
        toast.error('新增失敗，請檢查網路');
        console.error(err);
      });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    
    const previousEquipment = [...equipment];
    const eqToUpdate = equipment.find(e => e.id === id);
    
    setEquipment(prev => prev.map(eq => eq.id === id ? { ...eq, name: editName.trim() } : eq));
    setEditingId(null);
    
    api.updateEquipment(id, editName.trim(), eqToUpdate?.itemIds || [])
      .then(() => {
        toast.success('設備已更新');
      })
      .catch((err) => {
        setEquipment(previousEquipment);
        toast.error('更新失敗');
        console.error(err);
      });
  };

  const handleSaveConfig = () => {
    if (!configuringId) return;
    
    const previousEquipment = [...equipment];
    const eqToUpdate = equipment.find(e => e.id === configuringId);
    if (!eqToUpdate) return;

    setEquipment(prev => prev.map(eq => eq.id === configuringId ? { ...eq, itemIds: selectedItemIds } : eq));
    setConfiguringId(null);
    
    api.updateEquipment(configuringId, eqToUpdate.name, selectedItemIds)
      .then(() => {
        toast.success('關聯項目已更新');
      })
      .catch((err) => {
        setEquipment(previousEquipment);
        toast.error('更新失敗');
        console.error(err);
      });
  };

  const handleDelete = (id: string) => {
    const previousEquipment = [...equipment];
    
    setEquipment(prev => prev.filter(eq => eq.id !== id));
    setDeletingId(null);
    
    api.deleteEquipment(id)
      .then(() => {
        toast.success('設備已刪除');
      })
      .catch((err) => {
        setEquipment(previousEquipment);
        toast.error('刪除失敗');
        console.error(err);
      });
  };

  if (loading) return <div className="text-center py-8 text-zinc-500">載入中...</div>;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setNewName('');
          setIsAdding(true);
        }}
        className="w-full h-[60px] flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500 transition-colors"
      >
        <Plus size={20} />
        <span className="font-bold">新增設備</span>
      </button>

      {equipment.map(eq => (
        <div key={eq.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div className="flex-1 px-2 font-medium text-lg truncate">{eq.name}</div>
          {deletingId === eq.id ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(eq.id)}
                className="w-[60px] h-[60px] flex-none flex items-center justify-center text-white bg-red-600 rounded-lg font-bold text-sm"
              >
                刪除
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-300 bg-zinc-800 rounded-lg font-bold text-sm"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setConfiguringId(eq.id);
                  setSelectedItemIds(eq.itemIds || []);
                }}
                className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-blue-500 bg-zinc-950 rounded-lg"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setActiveMenuId(eq.id)}
                className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-amber-500 bg-zinc-950 rounded-lg"
              >
                <MoreVertical size={20} />
              </button>
            </>
          )}
        </div>
      ))}

      {/* 設定關聯項目 Modal */}
      {configuringId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-100">
                設定關聯項目 - {equipment.find(e => e.id === configuringId)?.name}
              </h3>
              <button onClick={() => setConfiguringId(null)} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {categories.map(cat => {
                const catItems = items.filter(item => item.category === cat.name);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h4 className="text-amber-500 font-bold mb-2">{cat.name}</h4>
                    <div className="space-y-2">
                      {catItems.map(item => (
                        <label key={item.id} className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItemIds(prev => [...prev, item.id]);
                              } else {
                                setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                            className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 bg-zinc-900"
                          />
                          <span className="text-zinc-200">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={handleSaveConfig}
                className="w-full h-[50px] bg-amber-500 text-zinc-950 rounded-xl font-bold text-lg"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部抽屜 (Bottom Sheet) */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
          onClick={() => setActiveMenuId(null)}
        >
          <div 
            className="bg-zinc-900 w-full rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom-full duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEditingId(activeMenuId);
                  setEditName(equipment.find(e => e.id === activeMenuId)?.name || '');
                  setActiveMenuId(null);
                }}
                className="w-full h-[60px] flex items-center gap-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-zinc-200 transition-colors"
              >
                <Edit2 size={20} className="text-amber-500" />
                <span className="font-bold text-lg">編輯設備名稱</span>
              </button>
              <button
                onClick={() => {
                  setDeletingId(activeMenuId);
                  setActiveMenuId(null);
                }}
                className="w-full h-[60px] flex items-center gap-3 px-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"
              >
                <Trash2 size={20} />
                <span className="font-bold text-lg">刪除設備</span>
              </button>
              <button
                onClick={() => setActiveMenuId(null)}
                className="w-full h-[60px] flex items-center justify-center bg-zinc-800 rounded-xl text-zinc-300 font-bold text-lg mt-4"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 設備表單抽屜 (Bottom Sheet) */}
      {(isAdding || editingId) && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
          onClick={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
        >
          <div 
            className="bg-zinc-900 w-full rounded-t-2xl p-5 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 flex-none" />
            <h3 className="text-xl font-bold text-zinc-100 mb-6">
              {isAdding ? '新增設備' : '編輯設備'}
            </h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">設備名稱</label>
                <input
                  type="text"
                  value={isAdding ? newName : editName}
                  onChange={(e) => isAdding ? setNewName(e.target.value) : setEditName(e.target.value)}
                  placeholder="輸入設備名稱"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 h-[60px] text-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8 flex-none">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="flex-1 h-[60px] bg-zinc-800 text-zinc-300 rounded-xl font-bold text-lg transition-colors hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (isAdding) {
                    handleAdd();
                  } else if (editingId) {
                    handleUpdate(editingId);
                  }
                }}
                className="flex-1 h-[60px] bg-amber-500 text-zinc-950 rounded-xl font-bold text-lg transition-colors hover:bg-amber-400"
              >
                確認{isAdding ? '新增' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemManager() {
  const { items, loadingItems: loading, setItems, categories } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    const categoryToUse = newItemCategory || (categories.length > 0 ? categories[0].name : '定期維護');
    const tempId = `temp-${Date.now()}`;
    const tempItem = { id: tempId, name: newName.trim(), category: categoryToUse };
    
    setItems(prev => [...prev, tempItem]);
    setNewName('');
    setNewItemCategory('');
    setIsAdding(false);
    
    api.addItem(newName.trim(), categoryToUse)
      .then((realData) => {
        setItems(prev => prev.map(item => item.id === tempId ? realData : item));
        toast.success('項目已新增');
      })
      .catch((err) => {
        setItems(prev => prev.filter(item => item.id !== tempId));
        toast.error('新增失敗，請檢查網路');
        console.error(err);
      });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    
    const previousItems = [...items];
    const categoryToUse = editCategory || (categories.length > 0 ? categories[0].name : '定期維護');
    
    setItems(prev => prev.map(item => item.id === id ? { ...item, name: editName.trim(), category: categoryToUse } : item));
    setEditingId(null);
    
    api.updateItem(id, editName.trim(), categoryToUse)
      .then(() => {
        toast.success('項目已更新');
      })
      .catch((err) => {
        setItems(previousItems);
        toast.error('更新失敗');
        console.error(err);
      });
  };

  const handleDelete = (id: string) => {
    const previousItems = [...items];
    
    setItems(prev => prev.filter(item => item.id !== id));
    setDeletingId(null);
    
    api.deleteItem(id)
      .then(() => {
        toast.success('項目已刪除');
      })
      .catch((err) => {
        setItems(previousItems);
        toast.error('刪除失敗');
        console.error(err);
      });
  };

  if (loading) return <div className="text-center py-8 text-zinc-500">載入中...</div>;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setNewName('');
          setNewItemCategory(categories.length > 0 ? categories[0].name : '定期維護');
          setIsAdding(true);
        }}
        className="w-full h-[60px] flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500 transition-colors"
      >
        <Plus size={20} />
        <span className="font-bold">新增項目</span>
      </button>

      {categories.map(cat => {
        const catItems = items.filter(item => item.category === cat.name);
        if (catItems.length === 0) return null;
        
        return (
          <div key={cat.id} className="mb-6">
            <h4 className="text-amber-500 font-bold mt-4 mb-2">{cat.name}</h4>
            <div className="space-y-3">
              {catItems.map(item => (
                <div key={item.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-2 font-medium text-lg truncate">{item.name}</div>
                    {deletingId === item.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-[60px] h-[60px] flex-none flex items-center justify-center text-white bg-red-600 rounded-lg font-bold text-sm"
                        >
                          刪除
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-300 bg-zinc-800 rounded-lg font-bold text-sm"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveMenuId(item.id)}
                        className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-amber-500 bg-zinc-950 rounded-lg"
                      >
                        <MoreVertical size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 底部抽屜 (Bottom Sheet) */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
          onClick={() => setActiveMenuId(null)}
        >
          <div 
            className="bg-zinc-900 w-full rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom-full duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
            <div className="space-y-3">
              <button
                onClick={() => {
                  const itemToEdit = items.find(i => i.id === activeMenuId);
                  if (itemToEdit) {
                    setEditingId(activeMenuId);
                    setEditName(itemToEdit.name);
                    setEditCategory(itemToEdit.category);
                  }
                  setActiveMenuId(null);
                }}
                className="w-full h-[60px] flex items-center gap-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-zinc-200 transition-colors"
              >
                <Edit2 size={20} className="text-amber-500" />
                <span className="font-bold text-lg">編輯項目名稱</span>
              </button>
              <button
                onClick={() => {
                  setDeletingId(activeMenuId);
                  setActiveMenuId(null);
                }}
                className="w-full h-[60px] flex items-center gap-3 px-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"
              >
                <Trash2 size={20} />
                <span className="font-bold text-lg">刪除項目</span>
              </button>
              <button
                onClick={() => setActiveMenuId(null)}
                className="w-full h-[60px] flex items-center justify-center bg-zinc-800 rounded-xl text-zinc-300 font-bold text-lg mt-4"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 項目表單抽屜 (Bottom Sheet) */}
      {(isAdding || editingId) && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
          onClick={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
        >
          <div 
            className="bg-zinc-900 w-full rounded-t-2xl p-5 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 flex-none" />
            <h3 className="text-xl font-bold text-zinc-100 mb-6">
              {isAdding ? '新增項目' : '編輯項目'}
            </h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">項目分類</label>
                <select
                  value={isAdding ? newItemCategory : editCategory}
                  onChange={(e) => isAdding ? setNewItemCategory(e.target.value) : setEditCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 h-[60px] text-lg text-zinc-100 focus:outline-none focus:border-amber-500 appearance-none"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">項目名稱</label>
                <input
                  type="text"
                  value={isAdding ? newName : editName}
                  onChange={(e) => isAdding ? setNewName(e.target.value) : setEditName(e.target.value)}
                  placeholder="輸入項目名稱"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 h-[60px] text-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8 flex-none">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="flex-1 h-[60px] bg-zinc-800 text-zinc-300 rounded-xl font-bold text-lg transition-colors hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (isAdding) {
                    handleAdd();
                  } else if (editingId) {
                    handleUpdate(editingId);
                  }
                }}
                className="flex-1 h-[60px] bg-amber-500 text-zinc-950 rounded-xl font-bold text-lg transition-colors hover:bg-amber-400"
              >
                確認{isAdding ? '新增' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
