import './index.css';
import './styles/animations.css';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  Globe, 
  Plus,
  GitBranch,
  Target,
  Trophy,
  Shield,
  LogOut,
  Settings,
  Users,
  ListChecks
} from 'lucide-react';
import { AddRiskForm } from './components/AddRiskForm';
import { Dashboard } from './components/Dashboard';
import { WeeklySummary } from './components/WeeklySummary';
import { RiskNetwork } from './components/RiskNetwork';
import { RiskIntelligenceHub } from './components/RiskIntelligenceHub';
import { CommandCenter } from './components/CommandCenter';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { UserManagement } from './components/Admin/UserManagement';
import { Leaderboard } from './components/Leaderboard';
import { Settings as SettingsPage } from './components/Settings';
import { RiskList } from './components/RiskList';
import { cn } from './lib/utils';
import { Risk } from './types/risk';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { RiskProvider, useRisks } from './contexts/RiskContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleSwitcher } from './components/RoleSwitcher';
import { getRBACRole } from './types/user';
import type { User } from './types/user';
import { filterRisksByRole } from './lib/rbac';

type View = 'dashboard' | 'add-risk' | 'summary' | 'network' | 'command' | 'login' | 'register' | 'admin-users' | 'leaderboard' | 'settings' | 'my-risks';

/** สิทธิ์การเห็นหน้า: User ไม่เห็น Dashboard,Command,Network,Summary,Admin | Manager ไม่เห็น Network,Summary,Admin | CEO ไม่เห็น Admin | Admin เห็นทั้งหมด */
function canSeeView(role: string | undefined, view: View): boolean {
  if (!role) return false;
  switch (view) {
    case 'dashboard': return ['admin', 'manager', 'ceo'].includes(role);
    case 'command': return ['admin', 'manager', 'ceo'].includes(role);
    case 'network': return ['admin', 'ceo'].includes(role);
    case 'summary': return ['admin', 'ceo'].includes(role);
    case 'admin-users': case 'settings': return role === 'admin';
    case 'add-risk': case 'leaderboard': case 'my-risks': return true;
    default: return false;
  }
}

function getDefaultViewForRole(role: string | undefined): View {
  if (role === 'user') return 'my-risks';
  return 'dashboard';
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  MANAGER: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  USER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  CEO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>(undefined);
  const { currentUser, login, logout } = useAuth();
  const isAuthenticated = !!currentUser;
  const user = currentUser;
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { risks } = useRisks();
  const commandRisks = React.useMemo(() => filterRisksByRole(risks, user ?? null), [risks, user]);

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('login');
  };

  useEffect(() => {
    if (isAuthenticated && (currentView === 'login' || currentView === 'register')) {
      setCurrentView(getDefaultViewForRole(user?.role));
    }
  }, [isAuthenticated, currentView, user?.role]);

  useEffect(() => {
    if ((currentView === 'admin-users' || currentView === 'settings') && user?.role !== 'admin') {
      setCurrentView(getDefaultViewForRole(user?.role));
    }
  }, [currentView, user]);

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAdminMenu && !(event.target as Element).closest('.relative')) {
        setShowAdminMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAdminMenu]);

  // If not authenticated, show auth pages
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        {currentView === 'login' ? (
          <LoginForm 
            onSuccess={handleLogin}
            onRegisterClick={() => setCurrentView('register')}
            loginFn={login}
          />
        ) : (
          <RegisterForm 
            onSuccess={() => setCurrentView('login')}
            onLoginClick={() => setCurrentView('login')}
          />
        )}
      </div>
    );
  }

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

  const validViews: View[] = ['dashboard', 'add-risk', 'summary', 'network', 'command', 'leaderboard', 'my-risks', 'admin-users', 'settings'];
  const effectiveView = (() => {
    const view = validViews.includes(currentView) ? currentView : getDefaultViewForRole(user?.role);
    if (!canSeeView(user?.role, view)) return getDefaultViewForRole(user?.role);
    return view;
  })();

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
        effectiveView === view 
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
                {t.appTitle} <span className="text-cyan-500 text-xs font-normal ml-1">v5.0</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {canSeeView(user?.role, 'dashboard') && (
                <NavButton view="dashboard" icon={LayoutDashboard} label="Dashboard" />
              )}
              {canSeeView(user?.role, 'command') && (
                <NavButton view="command" icon={Target} label={language === 'th' ? 'Command' : 'Command'} badge="new" />
              )}
              {canSeeView(user?.role, 'network') && (
                <NavButton view="network" icon={GitBranch} label={language === 'th' ? 'Network' : 'Network'} />
              )}
              {canSeeView(user?.role, 'summary') && (
                <NavButton view="summary" icon={FileText} label="Summary" />
              )}
              {canSeeView(user?.role, 'leaderboard') && (
                <NavButton view="leaderboard" icon={Trophy} label="Leaderboard" />
              )}
              {user?.role === 'user' && (
                <NavButton view="my-risks" icon={ListChecks} label={language === 'th' ? 'My Risk' : 'My Risks'} />
              )}
              {user?.role === 'admin' && (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 relative",
                      (currentView === 'admin-users' || currentView === 'settings')
                        ? "bg-cyan-900/20 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(8,145,178,0.2)]" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showAdminMenu && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setCurrentView('admin-users');
                          setShowAdminMenu(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                          currentView === 'admin-users'
                            ? "bg-cyan-900/30 text-cyan-400"
                            : "text-slate-300 hover:bg-slate-700"
                        )}
                      >
                        <Users className="w-4 h-4" />
                        <span>User Management</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('settings');
                          setShowAdminMenu(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                          currentView === 'settings'
                            ? "bg-cyan-900/30 text-cyan-400"
                            : "text-slate-300 hover:bg-slate-700"
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {user?.role === 'user' && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-900/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
                  <Trophy className="w-3.5 h-3.5" />
                  {user.score}
                </span>
              )}
              {user && (
                <RoleSwitcher />
              )}
              <div className="h-6 w-px bg-slate-800 mx-1" />

              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all min-w-[60px] justify-center"
              >
                <Globe className="w-3 h-3" />
                {language.toUpperCase()}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-red-900/50 hover:text-red-300 border border-slate-700 transition-all"
                title={language === 'th' ? 'ออกจากระบบ' : 'Log out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {effectiveView === 'add-risk' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-100">
                  {editingRisk ? (language === 'th' ? 'แก้ไขข้อมูล' : 'Edit Risk') : t.addRisk}
              </h1>
            </div>
            <AddRiskForm 
              onCancel={() => handleNavChange(getDefaultViewForRole(user?.role))} 
              onSuccess={() => handleNavChange(getDefaultViewForRole(user?.role))}
              initialData={editingRisk}
            />
          </div>
        )}

        {effectiveView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-100">{t.dashboard}</h1>
            </div>
            
            <Dashboard onEditRisk={handleEditRisk} currentUser={user} />
          </div>
        )}

        {effectiveView === 'summary' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeeklySummary />
          </div>
        )}

        {/* หน้า Network: เครือข่ายความสัมพันธ์ + ศูนย์ข่าวกรองความเสี่ยง */}
        {effectiveView === 'network' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              risks={risks}
              onRiskClick={(id) => {
                const risk = risks.find(r => r.id === id);
                if (risk) handleEditRisk(risk);
              }}
            />
            <div className="mt-8">
              <RiskIntelligenceHub
                risks={risks}
                onRiskClick={(id) => {
                  const risk = risks.find(r => r.id === id);
                  if (risk) handleEditRisk(risk);
                }}
              />
            </div>
          </div>
        )}

        {/* ✅ หน้าใหม่: Command Center */}
        {effectiveView === 'command' && (
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
              risks={commandRisks}
              onRiskClick={(id) => {
                const risk = risks.find(r => r.id === id);
                if (risk) handleEditRisk(risk);
              }}
            />
          </div>
        )}

        {effectiveView === 'leaderboard' && (
          <div className="animate-in fade-in duration-500">
            <Leaderboard />
          </div>
        )}

        {effectiveView === 'my-risks' && user?.role === 'user' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {language === 'th' ? 'ประวัติ Risk ที่ฉันป้อน' : 'My Submitted Risks'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {language === 'th'
                  ? 'รายการความเสี่ยงที่คุณเป็นผู้รายงาน'
                  : 'Risks you have submitted'}
              </p>
            </div>
            <RiskList
              risks={risks.filter((r) => r.reportedByUserId === user.id)}
              onView={(risk) => handleEditRisk(risk)}
              onEdit={handleEditRisk}
            />
          </div>
        )}

        {effectiveView === 'admin-users' && user?.role === 'admin' && (
          <div className="animate-in fade-in duration-500">
            <UserManagement />
          </div>
        )}

        {effectiveView === 'settings' && (
          <div className="animate-in fade-in duration-500">
            <SettingsPage />
          </div>
        )}

      </main>

      {/* RBAC: Role indicator มุมจอล่างซ้าย (CEO แยกจาก Admin) */}
      {user && (() => {
        const label = user.role === 'ceo' ? 'CEO' : getRBACRole(user.role);
        if (!label) return null;
        return (
          <div
            className={cn(
              'fixed bottom-6 left-6 z-40 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase shadow-lg',
              ROLE_BADGE_CLASS[label] || 'bg-slate-600 text-slate-300 border-slate-500'
            )}
            title={language === 'th' ? `บทบาท: ${label}` : `Role: ${label}`}
          >
            {label}
          </div>
        );
      })()}

      {/* Floating Action Button (FAB) for Add Risk */}
      {currentView !== 'add-risk' && (
        <button
            onClick={() => handleNavChange('add-risk')}
            className="fixed bottom-8 right-8 z-50 p-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(8,145,178,0.6)] hover:shadow-[0_0_25px_rgba(8,145,178,0.8)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
        >
            <Plus className="w-5 h-5" aria-hidden />
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
      <AuthProvider>
        <RiskProvider>
          <AppContent />
        </RiskProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
