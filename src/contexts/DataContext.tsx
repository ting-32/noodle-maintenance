import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { Equipment, MaintenanceItem, MaintenanceRecord } from '../types';

// 1. 定義 Context 提供的內容型別
interface DataContextType {
  equipment: Equipment[];
  items: MaintenanceItem[];
  history: MaintenanceRecord[];
  loadingEquipment: boolean;
  loadingItems: boolean;
  loadingHistory: boolean;
  setEquipment: React.Dispatch<React.SetStateAction<Equipment[]>>;
  setItems: React.Dispatch<React.SetStateAction<MaintenanceItem[]>>;
  // 允許子元件指定要重新整理哪一種資料
  refreshData: (type: 'equipment' | 'items' | 'history' | 'all') => Promise<void>;
}

// 2. 建立 Context (初始值先給 undefined，稍後用 Provider 填入)
const DataContext = createContext<DataContextType | undefined>(undefined);

// 3. 建立 Provider 元件
export function DataProvider({ children }: { children: ReactNode }) {
  // --- State 宣告 ---
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // --- 抓取資料邏輯 ---
  const fetchEquipment = async () => {
    setLoadingEquipment(true);
    try {
      const data = await api.getEquipment();
      setEquipment(data);
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- 統一的重新整理介面 ---
  const refreshData = async (type: 'equipment' | 'items' | 'history' | 'all') => {
    const promises = [];
    if (type === 'equipment' || type === 'all') promises.push(fetchEquipment());
    if (type === 'items' || type === 'all') promises.push(fetchItems());
    if (type === 'history' || type === 'all') promises.push(fetchHistory());
    
    await Promise.all(promises);
  };

  // --- 初始載入 (App 啟動時執行一次) ---
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingEquipment(true);
      setLoadingItems(true);
      setLoadingHistory(true);
      
      try {
        // 一次拿回所有資料
        const data = await api.getInitialData();
        
        setEquipment(data.equipment);
        setItems(data.items);
        setHistory(data.history);
      } catch (error) {
        console.error('Failed to load initial data', error);
      } finally {
        setLoadingEquipment(false);
        setLoadingItems(false);
        setLoadingHistory(false);
      }
    };

    loadInitialData();
  }, []);

  // --- 將所有東西打包提供出去 ---
  const value = {
    equipment,
    items,
    history,
    loadingEquipment,
    loadingItems,
    loadingHistory,
    setEquipment,
    setItems,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// 4. 建立自訂 Hook 供其他元件使用
export function useData() {
  const context = useContext(DataContext);
  
  // 防呆機制：確保 useData 只能在 DataProvider 內部使用
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
}
