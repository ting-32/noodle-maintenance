import { useState } from 'react';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, X, Check, Settings } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'items'>('equipment');

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
      </div>

      <div className="p-4 pb-24">
        {activeTab === 'equipment' ? <EquipmentManager /> : <ItemManager />}
      </div>
    </div>
  );
}

function EquipmentManager() {
  const { equipment, loadingEquipment: loading, setEquipment, items } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

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
      {isAdding ? (
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="輸入新設備名稱"
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 h-[60px] text-zinc-100 focus:outline-none focus:border-amber-500"
            autoFocus
          />
          <button onClick={handleAdd} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-amber-500 text-zinc-950 rounded-lg font-bold">
            <Check size={24} />
          </button>
          <button onClick={() => setIsAdding(false)} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-zinc-800 text-zinc-300 rounded-lg">
            <X size={24} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full h-[60px] flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500 transition-colors"
        >
          <Plus size={20} />
          <span className="font-bold">新增設備</span>
        </button>
      )}

      {equipment.map(eq => (
        <div key={eq.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          {editingId === eq.id ? (
            <>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 h-[60px] text-zinc-100 focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <button onClick={() => handleUpdate(eq.id)} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-amber-500 text-zinc-950 rounded-lg">
                <Check size={24} />
              </button>
              <button onClick={() => setEditingId(null)} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-zinc-800 text-zinc-300 rounded-lg">
                <X size={24} />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 px-2 font-medium text-lg truncate">{eq.name}</div>
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
                onClick={() => { setEditingId(eq.id); setEditName(eq.name); }}
                className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-amber-500 bg-zinc-950 rounded-lg"
              >
                <Edit2 size={20} />
              </button>
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
                <button
                  onClick={() => setDeletingId(eq.id)}
                  className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-red-500 bg-zinc-950 rounded-lg"
                >
                  <Trash2 size={20} />
                </button>
              )}
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
              {['定期維護', '設備維修', '更新配件'].map(cat => {
                const catItems = items.filter(item => item.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat}>
                    <h4 className="text-amber-500 font-bold mb-2">{cat}</h4>
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
    </div>
  );
}

function ItemManager() {
  const { items, loadingItems: loading, setItems } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('定期維護');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('定期維護');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempItem = { id: tempId, name: newName.trim(), category: newItemCategory };
    
    setItems(prev => [...prev, tempItem]);
    setNewName('');
    setNewItemCategory('定期維護');
    setIsAdding(false);
    
    api.addItem(newName.trim(), newItemCategory)
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
    
    setItems(prev => prev.map(item => item.id === id ? { ...item, name: editName.trim(), category: editCategory } : item));
    setEditingId(null);
    
    api.updateItem(id, editName.trim(), editCategory)
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
      {isAdding ? (
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col gap-2">
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 h-[60px] text-zinc-100 focus:outline-none focus:border-amber-500 appearance-none"
          >
            <option value="定期維護">定期維護</option>
            <option value="設備維修">設備維修</option>
            <option value="更新配件">更新配件</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="輸入新項目名稱"
              className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 h-[60px] text-zinc-100 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <button onClick={handleAdd} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-amber-500 text-zinc-950 rounded-lg font-bold">
              <Check size={24} />
            </button>
            <button onClick={() => setIsAdding(false)} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-zinc-800 text-zinc-300 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full h-[60px] flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500 transition-colors"
        >
          <Plus size={20} />
          <span className="font-bold">新增項目</span>
        </button>
      )}

      {['定期維護', '設備維修', '更新配件'].map(cat => {
        const catItems = items.filter(item => item.category === cat);
        if (catItems.length === 0) return null;
        
        return (
          <div key={cat} className="mb-6">
            <h4 className="text-amber-500 font-bold mt-4 mb-2">{cat}</h4>
            <div className="space-y-3">
              {catItems.map(item => (
                <div key={item.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col gap-3">
                  {editingId === item.id ? (
                    <>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 h-[60px] text-zinc-100 focus:outline-none focus:border-amber-500 appearance-none"
                      >
                        <option value="定期維護">定期維護</option>
                        <option value="設備維修">設備維修</option>
                        <option value="更新配件">更新配件</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 h-[60px] text-zinc-100 focus:outline-none focus:border-amber-500"
                          autoFocus
                        />
                        <button onClick={() => handleUpdate(item.id)} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-amber-500 text-zinc-950 rounded-lg">
                          <Check size={24} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="w-[60px] h-[60px] flex-none flex items-center justify-center bg-zinc-800 text-zinc-300 rounded-lg">
                          <X size={24} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-2 font-medium text-lg truncate">{item.name}</div>
                      <button
                        onClick={() => { setEditingId(item.id); setEditName(item.name); setEditCategory(item.category); }}
                        className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-amber-500 bg-zinc-950 rounded-lg"
                      >
                        <Edit2 size={20} />
                      </button>
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
                          onClick={() => setDeletingId(item.id)}
                          className="w-[60px] h-[60px] flex-none flex items-center justify-center text-zinc-400 hover:text-red-500 bg-zinc-950 rounded-lg"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
