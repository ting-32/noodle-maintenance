import { Equipment, MaintenanceItem, MaintenanceRecord, AddLogPayload, MaintenanceCategory } from '../types';

const GAS_URL = (import.meta as any).env?.VITE_GAS_URL || '';

// Mock data for development
let equipmentList: Equipment[] = [
  { id: '1', name: '一號製麵機' },
  { id: '2', name: '二號包裝機' },
  { id: '3', name: '大型攪拌機' },
];

let categoryList: MaintenanceCategory[] = [
  { id: '1', name: '定期維護' },
  { id: '2', name: '設備維修' },
  { id: '3', name: '更新配件' },
];

let itemList: MaintenanceItem[] = [
  { id: '1', name: '潤滑齒輪', category: '定期維護' },
  { id: '2', name: '更換皮帶', category: '更新配件' },
  { id: '3', name: '清潔濾網', category: '設備維修' },
];

let historyList: MaintenanceRecord[] = [
  {
    id: '1',
    equipmentId: '1',
    equipmentName: '一號製麵機',
    category: '定期維護',
    itemId: '1',
    itemName: '潤滑齒輪',
    date: '2026-03-10 14:30',
    status: 'completed',
    notes: '齒輪有些微磨損，已加強潤滑。',
    beforePhotoUrl: 'https://picsum.photos/seed/gear_before/400/300',
    afterPhotoUrl: 'https://picsum.photos/seed/gear_after/400/300',
  },
  {
    id: '2',
    equipmentId: '3',
    equipmentName: '大型攪拌機',
    category: '設備維修',
    itemId: '3',
    itemName: '清潔濾網',
    date: '2026-03-11 09:15',
    status: 'issue',
    notes: '濾網破損，需採購新品更換。暫時清理後裝回。',
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchGet(action: string) {
  if (!GAS_URL) return null;
  try {
    const res = await fetch(`${GAS_URL}?action=${action}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${action}:`, error);
    return null;
  }
}

async function fetchPost(action: string, payload: any) {
  if (!GAS_URL) return null;
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error posting ${action}:`, error);
    return null;
  }
}

// Helper function to convert Google Drive view links to direct image links
const convertDriveUrl = (url: string | undefined | null) => {
  if (!url) return '';
  
  let fileId = '';
  
  // 匹配格式 1: 手動複製的網址 (https://drive.google.com/file/d/{ID}/view)
  const regex1 = /file\/d\/([a-zA-Z0-9_-]+)/;
  // 匹配格式 2: GAS 後端產生的網址 (https://drive.google.com/uc?export=view&id={ID})
  const regex2 = /[?&]id=([a-zA-Z0-9_-]+)/;
  
  const match1 = url.match(regex1);
  const match2 = url.match(regex2);
  
  if (match1 && match1[1]) {
    fileId = match1[1];
  } else if (match2 && match2[1]) {
    fileId = match2[1];
  }
  
  if (fileId) {
    // 使用 Google Drive 縮圖 API，這是目前最穩定、不會被跨域阻擋的圖片顯示方式
    // sz=w1000 代表寬度最大 1000px，足以在網頁上清晰顯示
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  
  // 如果都不是，回傳原始網址
  return url;
};

export const api = {
  getInitialData: async (): Promise<{ equipment: Equipment[], items: MaintenanceItem[], history: MaintenanceRecord[], categories: MaintenanceCategory[] }> => {
    if (GAS_URL) {
      const data = await fetchGet('getInitialData');
      if (data) {
        return {
          equipment: Array.isArray(data.equipment) ? data.equipment.map((d: any) => ({ id: d['ID'], name: d['名稱'], itemIds: d['關聯項目'] ? String(d['關聯項目']).split(',') : [], order: d['排序'] ? Number(d['排序']) : 0 })).sort((a, b) => (a.order || 0) - (b.order || 0)) : [],
          items: Array.isArray(data.items) ? data.items.map((d: any) => ({ id: d['ID'], name: d['名稱'], category: d['類別'] || '定期維護' })) : [],
          categories: Array.isArray(data.categories) ? data.categories.map((d: any) => ({ id: d['ID'], name: d['名稱'], color: d['顏色'] })) : [],
          history: Array.isArray(data.history) ? data.history.map((d: any) => ({
            id: d['ID'],
            equipmentId: d['設備ID'] || '', 
            equipmentName: d['設備名稱'],
            category: d['類別'],
            itemId: '',
            itemName: d['維修項目'],
            date: d['日期'] ? new Date(d['日期']).toLocaleString() : '',
            status: 'completed',
            notes: d['備註'],
            beforePhotoUrl: convertDriveUrl(d['維修前照片URL']),
            afterPhotoUrl: convertDriveUrl(d['維修後照片URL']),
            vendorName: (() => {
              const key = Object.keys(d).find(k => k.includes('廠商'));
              return key ? (d[key] || '') : '';
            })(),
            vendorPhone: (() => {
              const key = Object.keys(d).find(k => k.includes('電話'));
              return key ? (d[key] || '') : '';
            })(),
            cost: (() => {
              const key = Object.keys(d).find(k => k.includes('金額') || k.includes('花費') || k.toLowerCase().includes('cost'));
              if (key && d[key] !== undefined && d[key] !== null) {
                return parseInt(String(d[key]).replace(/\D/g, ''), 10) || 0;
              }
              return 0;
            })(),
          })).reverse() : []
        };
      }
    }
    await delay(300);
    return {
      equipment: [...equipmentList].sort((a, b) => (a.order || 0) - (b.order || 0)),
      items: [...itemList],
      categories: [...categoryList],
      history: [...historyList]
    };
  },
  getEquipment: async (): Promise<Equipment[]> => {
    if (GAS_URL) {
      const data = await fetchGet('getEquipments');
      if (data && Array.isArray(data)) {
        return data.map((d: any) => ({ id: d['ID'], name: d['名稱'], itemIds: d['關聯項目'] ? String(d['關聯項目']).split(',') : [], order: d['排序'] ? Number(d['排序']) : 0 })).sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    }
    await delay(300);
    return [...equipmentList].sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  addEquipment: async (name: string, itemIds: string[] = []): Promise<Equipment> => {
    if (GAS_URL) {
      const res = await fetchPost('addEquipment', { name, itemIds });
      if (res?.success) return { id: res.id, name: res.name, itemIds, order: res.order || 0 };
    }
    await delay(300);
    const newEq = { id: Date.now().toString(), name, itemIds, order: equipmentList.length };
    equipmentList.push(newEq);
    return newEq;
  },
  updateEquipment: async (id: string, name: string, itemIds: string[] = []): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('editEquipment', { id, name, itemIds });
      return;
    }
    await delay(300);
    const eq = equipmentList.find(e => e.id === id);
    if (eq) {
      eq.name = name;
      eq.itemIds = itemIds;
    }
  },
  updateEquipmentOrder: async (orderedIds: string[]): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('updateEquipmentOrder', { orderedIds });
      return;
    }
    await delay(300);
    orderedIds.forEach((id, index) => {
      const eq = equipmentList.find(e => e.id === id);
      if (eq) {
        eq.order = index;
      }
    });
  },
  deleteEquipment: async (id: string): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('deleteEquipment', { id });
      return;
    }
    await delay(300);
    equipmentList = equipmentList.filter(e => e.id !== id);
  },

  getItems: async (): Promise<MaintenanceItem[]> => {
    if (GAS_URL) {
      const data = await fetchGet('getItems');
      if (data && Array.isArray(data)) {
        return data.map((d: any) => ({ id: d['ID'], name: d['名稱'], category: d['類別'] || '定期維護' }));
      }
    }
    await delay(300);
    return [...itemList];
  },
  addItem: async (name: string, category: string): Promise<MaintenanceItem> => {
    if (GAS_URL) {
      const res = await fetchPost('addItem', { name, category });
      if (res?.success) return { id: res.id, name: res.name, category };
    }
    await delay(300);
    const newItem = { id: Date.now().toString(), name, category };
    itemList.push(newItem);
    return newItem;
  },
  updateItem: async (id: string, name: string, category: string): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('editItem', { id, name, category });
      return;
    }
    await delay(300);
    const item = itemList.find(e => e.id === id);
    if (item) {
      item.name = name;
      item.category = category;
    }
  },
  deleteItem: async (id: string): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('deleteItem', { id });
      return;
    }
    await delay(300);
    itemList = itemList.filter(e => e.id !== id);
  },

  getCategories: async (): Promise<MaintenanceCategory[]> => {
    if (GAS_URL) {
      const data = await fetchGet('getCategories');
      if (data && Array.isArray(data)) {
        return data.map((d: any) => ({ id: d['ID'], name: d['名稱'], color: d['顏色'] }));
      }
    }
    await delay(300);
    return [...categoryList];
  },
  addCategory: async (name: string, color?: string): Promise<MaintenanceCategory> => {
    if (GAS_URL) {
      const res = await fetchPost('addCategory', { name, color });
      if (res?.success) return { id: res.id, name: res.name, color };
    }
    await delay(300);
    const newCategory = { id: Date.now().toString(), name, color };
    categoryList.push(newCategory);
    return newCategory;
  },
  updateCategory: async (id: string, name: string, color?: string): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('editCategory', { id, name, color });
      return;
    }
    await delay(300);
    const cat = categoryList.find(e => e.id === id);
    if (cat) {
      cat.name = name;
      cat.color = color;
    }
  },
  deleteCategory: async (id: string): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('deleteCategory', { id });
      return;
    }
    await delay(300);
    categoryList = categoryList.filter(e => e.id !== id);
  },

  getHistory: async (): Promise<MaintenanceRecord[]> => {
    if (GAS_URL) {
      const data = await fetchGet('getLogs');
      if (data && Array.isArray(data)) {
        return data.map((d: any) => ({
          id: d['ID'],
          equipmentId: d['設備ID'] || '', 
          equipmentName: d['設備名稱'],
          category: d['類別'],
          itemId: '',
          itemName: d['維修項目'],
          date: d['日期'] ? new Date(d['日期']).toLocaleString() : '',
          status: 'completed',
          notes: d['備註'],
          beforePhotoUrl: convertDriveUrl(d['維修前照片URL']),
          afterPhotoUrl: convertDriveUrl(d['維修後照片URL']),
          vendorName: (() => {
            const key = Object.keys(d).find(k => k.includes('廠商'));
            return key ? (d[key] || '') : '';
          })(),
          vendorPhone: (() => {
            const key = Object.keys(d).find(k => k.includes('電話'));
            return key ? (d[key] || '') : '';
          })(),
          cost: (() => {
            const key = Object.keys(d).find(k => k.includes('金額') || k.includes('花費') || k.toLowerCase().includes('cost'));
            if (key && d[key] !== undefined && d[key] !== null) {
              return parseInt(String(d[key]).replace(/\D/g, ''), 10) || 0;
            }
            return 0;
          })(),
        })).reverse();
      }
    }
    await delay(300);
    return [...historyList];
  },

  addLog: async (payload: AddLogPayload): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('addLog', payload);
      return;
    }
    await delay(800);
    const newRecord: MaintenanceRecord = {
      id: Date.now().toString(),
      equipmentId: payload.equipmentId,
      equipmentName: payload.equipmentName,
      category: payload.category,
      itemId: payload.itemIds.join(','),
      itemName: payload.itemName,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      notes: payload.notes,
      beforePhotoUrl: payload.beforePhotoBase64,
      afterPhotoUrl: payload.afterPhotoBase64,
      vendorName: payload.vendorName,
      vendorPhone: payload.vendorPhone,
      cost: payload.cost,
    };
    historyList.unshift(newRecord);
  },

  updateLogPhoto: async (payload: { id: string; photoType: 'before' | 'after'; base64String: string }): Promise<void> => {
    if (GAS_URL) {
      await fetchPost('updateLogPhoto', payload);
      return;
    }
    await delay(800);
    const record = historyList.find(r => r.id === payload.id);
    if (record) {
      if (payload.photoType === 'before') {
        record.beforePhotoUrl = payload.base64String;
      } else {
        record.afterPhotoUrl = payload.base64String;
      }
    }
  }
};

