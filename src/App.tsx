import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Globe, 
  TriangleAlert,
  GitBranch,
  Target
} from 'lucide-react';
import { AddRiskForm } from './components/AddRiskForm';
import { Dashboard } from './components/Dashboard';
import { WeeklySummary } from './components/WeeklySummary';
import { RiskNetwork } from './components/RiskNetwork';
import { CommandCenter } from './components/CommandCenter';
import { cn } from './lib/utils';
import { Risk } from './types/risk';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MOCK_RISKS } from './data/mockData';

// ✅ เพิ่ม 'network' และ 'command' ใน type นี้
type View = 'dashboard' | 'add-risk' | 'summary' | 'network' | 'command';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>(undefined);
  const { t, language, setLanguage } = useLanguage();

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk);
    setCurrentView('add-risk');
  };

  const handleNavChange = (view: View) => {
    setCurrentView(view);
    if (view !== 'add-risk') {
        setEditingRisk(undefined);
    } else {
        setEditingRisk(undefined);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  // ✅ Component ย่อยสำหรับปุ่ม navigation (ทำให้ code สะอาดขึ้น)
  const NavButton = ({ 
    view, 
    icon: Icon, 
    label, 
    badge 
  }: { 
    view: View; 
    icon: React.ElementType; 
    label: string;
    badge?: string;
  }) => (
    <button 
      onClick={() => handleNavChange(view)}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 relative",
        currentView === view 
          ? "bg-cyan-900/20 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(8,145,178,0.2)]" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      {/* ✅ แสดงจุดแดงถ้ามี badge="new" */}
      {badge && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative">
      {/* Navigation Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-xl font-bold text-slate-100 hidden sm:block tracking-wide">
                {t.appTitle} <span className="text-cyan-500 text-xs font-normal ml-1">v2.0</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* ✅ ปุ่ม Dashboard (เหมือนเดิม) */}
              <NavButton 
                view="dashboard" 
                icon={LayoutDashboard} 
                label={t.dashboard || 'Dashboard'} 
              />
              
              {/* ✅ ปุ่มใหม่: Command Center (มีจุดแดงแสดงว่าใหม่) */}
              <NavButton 
                view="command" 
                icon={Target} 
                label={language === 'th' ? 'Command' : 'Command'}
                badge="new"
              />
              
              {/* ✅ ปุ่มใหม่: Risk Network */}
              <NavButton 
                view="network" 
                icon={GitBranch} 
                label={language === 'th' ? 'Network' : 'Network'} 
              />
              
              {/* ✅ ปุ่ม Summary (เหมือนเดิม) */}
              <NavButton 
                view="summary" 
                icon={FileText} 
                label={t.summary || 'Summary'} 
              />

              <div className="h-6 w-px bg-slate-800 mx-1" />

              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all min-w-[60px] justify-center"
              >
                <Globe className="w-3 h-3" />
                {language.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'add-risk' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-100">
                  {editingRisk ? (language === 'th' ? 'แก้ไขข้อมูล' : 'Edit Risk') : t.addRisk}
              </h1>
            </div>
            <AddRiskForm 
              onCancel={() => handleNavChange('dashboard')} 
              onSuccess={() => handleNavChange('dashboard')}
              initialData={editingRisk}
            />
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-100">{t.dashboard}</h1>
            </div>
            
            <Dashboard onEditRisk={handleEditRisk} />
          </div>
        )}

        {currentView === 'summary' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeeklySummary />
          </div>
        )}

        {/* ✅ หน้าใหม่: Risk Network */}
        {currentView === 'network' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  {language === 'th' ? 'เครือข่ายความเสี่ยง' : 'Risk Correlation Network'}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {language === 'th' 
                    ? 'แสดงความสัมพันธ์ระหว่างความเสี่ยงแบบ real-time' 
                    : 'Visualize risk relationships and cascade effects in real-time'}
                </p>
              </div>
            </div>
            <RiskNetwork 
              risks={MOCK_RISKS} 
              onRiskClick={(id) => {
                const risk = MOCK_RISKS.find(r => r.id === id);
                if (risk) handleEditRisk(risk);
              }}
            />
          </div>
        )}

        {/* ✅ หน้าใหม่: Command Center */}
        {currentView === 'command' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Target className="w-6 h-6 text-cyan-400" />
                  {language === 'th' ? 'ศูนย์บัญชาการ' : 'Command Center'}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {language === 'th' 
                    ? 'สรุปสำหรับผู้บริหาร: ตัดสินใจใน 10 วินาที' 
                    : 'Executive summary: Know what to decide in 10 seconds'}
                </p>
              </div>
            </div>
            <CommandCenter 
              risks={MOCK_RISKS}
              onRiskClick={(id) => {
                const risk = MOCK_RISKS.find(r => r.id === id);
                if (risk) handleEditRisk(risk);
              }}
            />
          </div>
        )}

      </main>

      {/* Floating Action Button (FAB) for Add Risk */}
      {currentView !== 'add-risk' && (
        <button
            onClick={() => handleNavChange('add-risk')}
            className="fixed bottom-8 right-8 z-50 p-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(8,145,178,0.6)] hover:shadow-[0_0_25px_rgba(8,145,178,0.8)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
        >
            <TriangleAlert className="w-8 h-8" />
            <span className="absolute right-full mr-4 bg-slate-800 text-slate-200 text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 shadow-xl">
                {t.addRisk}
            </span>
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;