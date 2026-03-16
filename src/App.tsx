/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Wrench, History as HistoryIcon, Settings, Server } from 'lucide-react';
import ExecuteMaintenance from './pages/ExecuteMaintenance';
import History from './pages/History';
import SystemSettings from './pages/SystemSettings';
import EquipmentOverview from './pages/EquipmentOverview';
import { DataProvider } from './contexts/DataContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'execute' | 'history' | 'overview' | 'settings'>('execute');

  return (
    <DataProvider>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30">
        {/* Header */}
        <header className="flex-none h-[60px] bg-zinc-900 border-b border-zinc-800 flex items-center justify-center px-4 shadow-md z-10">
          <h1 className="text-lg font-bold tracking-wider text-amber-500">麵廠維修系統</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-[80px]">
          {activeTab === 'execute' && <ExecuteMaintenance />}
          {activeTab === 'history' && <History />}
          {activeTab === 'overview' && <EquipmentOverview />}
          {activeTab === 'settings' && <SystemSettings />}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full h-[80px] bg-zinc-900 border-t border-zinc-800 flex justify-around items-center pb-safe z-20">
          <button
            onClick={() => setActiveTab('execute')}
            className={`flex flex-col items-center justify-center w-full h-full min-h-[60px] ${
              activeTab === 'execute' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wrench size={24} className="mb-1" />
            <span className="text-xs font-medium">執行維修</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center w-full h-full min-h-[60px] ${
              activeTab === 'history' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <HistoryIcon size={24} className="mb-1" />
            <span className="text-xs font-medium">歷史紀錄</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center w-full h-full min-h-[60px] ${
              activeTab === 'overview' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Server size={24} className="mb-1" />
            <span className="text-xs font-medium">設備總覽</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-full h-full min-h-[60px] ${
              activeTab === 'settings' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Settings size={24} className="mb-1" />
            <span className="text-xs font-medium">系統設定</span>
          </button>
        </nav>
      </div>
    </DataProvider>
  );
}
