import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, AlertTriangle, Globe, Zap, TrendingUp, 
  Users, Server, Shield, Clock, ChevronRight, 
  Radio, Terminal, AlertCircle
} from 'lucide-react';
import { Risk } from '../types/risk';
import { cn, formatCurrency } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

// Types
interface RiskEvent {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  department: string;
  message: string;
  timestamp: Date;
  impact: number;
  location?: string;
}

interface IntelligenceHubProps {
  risks: Risk[];
  onRiskClick?: (riskId: string) => void;
}

// Mock locations for globe visualization
const LOCATIONS = [
  { name: 'Bangkok', x: 75, y: 45, code: 'BKK' },
  { name: 'Singapore', x: 78, y: 55, code: 'SIN' },
  { name: 'Tokyo', x: 85, y: 35, code: 'TYO' },
  { name: 'London', x: 45, y: 30, code: 'LON' },
  { name: 'New York', x: 25, y: 35, code: 'NYC' },
  { name: 'Sydney', x: 88, y: 75, code: 'SYD' },
  { name: 'Dubai', x: 60, y: 42, code: 'DXB' },
  { name: 'Frankfurt', x: 48, y: 32, code: 'FRA' },
];

export const RiskIntelligenceHub: React.FC<IntelligenceHubProps> = ({ 
  risks, 
  onRiskClick 
}) => {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [activeTab, setActiveTab] = useState<'live' | 'globe' | 'stream'>('live');
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [typingText, setTypingText] = useState('');

  // Generate initial events from actual risks
  useEffect(() => {
    const initialEvents: RiskEvent[] = risks
      .slice(0, 8)
      .map((risk, i) => ({
        id: risk.id,
        type: risk.score >= 20 ? 'critical' : risk.score >= 15 ? 'high' : risk.score >= 10 ? 'medium' : 'low',
        department: risk.businessUnit || 'Unknown',
        message: risk.title || (risk.description ? (risk.description.substring(0, 50) + '...') : 'Risk detected'),
        timestamp: new Date(Date.now() - i * 60000),
        impact: risk.financialImpact || Math.floor(Math.random() * 100000),
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)].name
      }));
    setEvents(initialEvents);
  }, [risks]);

  // Simulate real-time events
  useEffect(() => {
    const interval = setInterval(() => {
      const types: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
      const depts = ['IT', 'Finance', 'Sales', 'HR', 'Operations'];
      const messages = [
        'Server CPU เกิน 90%',
        'พบความผิดปกติใน Transaction',
        'ลูกค้ารายใหญ่แจ้งปัญหา',
        'พนักงานลาออกกะทันหัน',
        'ระบบ Backup ล้มเหลว',
        'พบการเข้าถึงที่ไม่ได้รับอนุญาต',
        'งบประมาณใกล้ถึงขีดจำกัด',
        'Contract สำคัญใกล้หมดอายุ'
      ];
      
      const newEvent: RiskEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: types[Math.floor(Math.random() * types.length)],
        department: depts[Math.floor(Math.random() * depts.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(),
        impact: Math.floor(Math.random() * 500000) + 50000,
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)].name
      };
      
      setEvents(prev => [newEvent, ...prev].slice(0, 12));
      setPulseIntensity(prev => Math.min(prev + 0.3, 2));
      setTimeout(() => setPulseIntensity(1), 600);
      
      // Typing effect for critical events
      if (newEvent.type === 'critical') {
        setTypingText('');
        const text = `CRITICAL: ${newEvent.message}`;
        let i = 0;
        const typeInterval = setInterval(() => {
          setTypingText(text.substring(0, i));
          i++;
          if (i > text.length) clearInterval(typeInterval);
        }, 30);
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const critical = events.filter(e => e.type === 'critical').length;
    const high = events.filter(e => e.type === 'high').length;
    const totalImpact = events.reduce((acc, e) => acc + e.impact, 0);
    const activeDepts = new Set(events.map(e => e.department)).size;
    return { critical, high, totalImpact, activeDepts };
  }, [events]);

  const getTypeColor = (type: string) => {
    const colors = {
      critical: 'text-red-500 shadow-red-500/50',
      high: 'text-orange-500 shadow-orange-500/50',
      medium: 'text-yellow-500 shadow-yellow-500/50',
      low: 'text-cyan-500 shadow-cyan-500/50'
    };
    return colors[type as keyof typeof colors] || colors.low;
  };

  const getTypeBg = (type: string) => {
    const colors = {
      critical: 'bg-red-500/20 border-red-500/30 text-red-400',
      high: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      medium: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      low: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
    };
    return colors[type as keyof typeof colors] || colors.low;
  };

  /** สีจุดกระพริบ (Risk Pulse) ให้มองเห็นชัด */
  const getTypeDotBg = (type: string) => {
    const colors = {
      critical: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      high: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
      medium: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
      low: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
    };
    return colors[type as keyof typeof colors] || colors.low;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header with Animated Pulse */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, pulseIntensity, 1],
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                  '0 0 0 10px rgba(239, 68, 68, 0)',
                  '0 0 0 0 rgba(239, 68, 68, 0)'
                ]
              }}
              transition={{ duration: 0.6 }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full"
            />
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            {language === 'th' ? 'ศูนย์ข่าวกรองความเสี่ยง' : 'Risk Intelligence Hub'}
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
              LIVE
            </span>
          </h3>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-800/50 rounded-lg p-1 gap-1">
          {[
            { id: 'live', icon: Radio, label: language === 'th' ? 'สด' : 'Live' },
            { id: 'globe', icon: Globe, label: language === 'th' ? 'สาขา' : 'Branch' },
            { id: 'stream', icon: Terminal, label: language === 'th' ? 'สตรีม' : 'Stream' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                activeTab === tab.id 
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-0">
        
        {/* Left: Live Feed (8 cols) */}
        <div className="col-span-12 lg:col-span-8 border-r border-slate-800">
          <AnimatePresence mode="wait">
            
            {/* LIVE TAB */}
            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[400px] overflow-hidden relative"
              >
                {/* Scanning Line Effect */}
                <motion.div
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-lg shadow-cyan-500/50 z-10 pointer-events-none"
                />
                
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-950/80 to-transparent z-10" />
                
                <div className="p-4 space-y-2 h-full overflow-y-auto scrollbar-hide">
                  <AnimatePresence initial={false}>
                    {events.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -30, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: 30, height: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => onRiskClick?.(event.id)}
                        className="group p-3 rounded-xl border border-slate-800/50 bg-slate-950/30 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            animate={event.type === 'critical' ? { rotate: [0, 15, -15, 0] } : {}}
                            transition={{ duration: 0.5, repeat: event.type === 'critical' ? Infinity : 0, repeatDelay: 2 }}
                            className={cn(
                              "w-2 h-2 rounded-full mt-2 shrink-0",
                              getTypeDotBg(event.type)
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border",
                                getTypeBg(event.type)
                              )}>
                                {event.type}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Server className="w-3 h-3" />
                                {event.department}
                              </span>
                              <span className="text-xs text-slate-600">
                                {event.timestamp.toLocaleTimeString('th-TH')}
                              </span>
                              {event.location && (
                                <span className="text-xs text-slate-600 flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-300 mt-1.5 group-hover:text-white transition-colors line-clamp-2">
                              {event.message}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-slate-200">
                              {formatCurrency(event.impact)}
                            </div>
                            <div className="text-[10px] text-slate-500">Impact</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
              </motion.div>
            )}

            {/* GLOBE TAB */}
            {activeTab === 'globe' && (
              <motion.div
                key="globe"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-[400px] relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950"
              >
                {/* Animated Grid Background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }} />
                </div>
                
                {/* Globe Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[300px] h-[300px]">
                    {/* Outer Rings */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border border-cyan-500/20"
                      style={{ borderStyle: 'dashed' }}
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 rounded-full border border-cyan-500/10"
                    />
                    
                    {/* Center Globe */}
                    <div className="absolute inset-8 rounded-full bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)] flex items-center justify-center">
                      <Globe className="w-20 h-20 text-cyan-400/50" />
                    </div>
                    
                    {/* Location Dots */}
                    {LOCATIONS.map((loc, i) => {
                      const hasRisk = events.some(e => e.location === loc.name);
                      return (
                        <motion.button
                          key={loc.name}
                          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2"
                          onMouseEnter={() => setHoveredLocation(loc.name)}
                          onMouseLeave={() => setHoveredLocation(null)}
                          whileHover={{ scale: 1.2 }}
                        >
                          <motion.div
                            animate={hasRisk ? {
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5]
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                            className={cn(
                              "w-3 h-3 rounded-full border-2",
                              hasRisk 
                                ? "bg-red-500 border-red-400 shadow-lg shadow-red-500/50" 
                                : "bg-cyan-500/50 border-cyan-400/50"
                            )}
                          />
                          {hoveredLocation === loc.name && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-xs text-white rounded border border-slate-700 whitespace-nowrap z-20"
                            >
                              {loc.name} ({loc.code})
                              {hasRisk && <span className="text-red-400 ml-1">● Alert</span>}
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs">
                  <div className="flex gap-4">
                    <span className="text-slate-400">
                      <span className="text-cyan-400 font-bold">{LOCATIONS.length}</span> Locations
                    </span>
                    <span className="text-slate-400">
                      <span className="text-red-400 font-bold">{events.filter(e => e.location).length}</span> Active Alerts
                    </span>
                  </div>
                  <span className="text-slate-500">Real-time Global Monitor</span>
                </div>
              </motion.div>
            )}

            {/* STREAM TAB */}
            {activeTab === 'stream' && (
              <motion.div
                key="stream"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[400px] bg-slate-950 p-4 font-mono text-sm overflow-hidden relative"
              >
                <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  SYSTEM ONLINE
                </div>
                
                <div className="space-y-1 mt-8">
                  <div className="text-slate-500 text-xs mb-4">=== RISK MONITORING SYSTEM v2.0 ===</div>
                  
                  <AnimatePresence>
                    {events.slice(0, 10).map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "flex items-center gap-3 py-1",
                          event.type === 'critical' ? 'text-red-400' :
                          event.type === 'high' ? 'text-orange-400' :
                          event.type === 'medium' ? 'text-yellow-400' : 'text-cyan-400'
                        )}
                      >
                        <span className="text-slate-600 text-xs">[{event.timestamp.toLocaleTimeString('th-TH')}]</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold",
                          event.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                          event.type === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          event.type === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-cyan-500/20 text-cyan-400'
                        )}>
                          {event.type.toUpperCase()}
                        </span>
                        <span className="text-slate-300">[{event.department}]</span>
                        <span className="truncate">{event.message}</span>
                        <span className="ml-auto text-slate-500">{formatCurrency(event.impact)}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-cyan-400 mt-2"
                  >
                    ▋
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Stats & Mini Cards (4 cols) */}
        <div className="col-span-12 lg:col-span-4 p-4 space-y-4 bg-slate-950/20">
          
          {/* Risk Pulse Card */}
          <motion.div 
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-950/50 to-orange-950/30 border border-red-500/20 p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'th' ? 'ภัยคุกคามที่ใช้งาน' : 'Active Threats'}
                  </span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{stats.critical + stats.high}</span>
                <span className="text-sm text-red-300/70">
                  {language === 'th' ? 'รายการ' : 'items'}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/20">
                  {stats.critical} Critical
                </span>
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full border border-orange-500/20">
                  {stats.high} High
                </span>
              </div>
            </div>
          </motion.div>

          {/* Department Distribution */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                {language === 'th' ? 'ตามแผนก' : 'By Department'}
              </span>
            </div>
            <div className="space-y-3">
              {['IT', 'Finance', 'Sales', 'HR'].map((dept, i) => {
                const count = events.filter(e => e.department === dept).length;
                const max = Math.max(...['IT', 'Finance', 'Sales', 'HR'].map(d => 
                  events.filter(e => e.department === d).length
                )) || 1;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{dept}</span>
                      <span className="text-slate-300 font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / max) * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          dept === 'IT' ? 'bg-cyan-500' :
                          dept === 'Finance' ? 'bg-emerald-500' :
                          dept === 'Sales' ? 'bg-purple-500' : 'bg-pink-500'
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors flex flex-col items-center gap-1"
            >
              <Zap className="w-5 h-5" />
              <span className="text-[10px] font-medium">
                {language === 'th' ? 'ยกระดับทั้งหมด' : 'Escalate All'}
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors flex flex-col items-center gap-1"
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-medium">
                {language === 'th' ? 'สร้างรายงาน' : 'Generate Report'}
              </span>
            </motion.button>
          </div>

          {/* Typing Effect Banner */}
          <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 min-h-[60px]">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
              <Terminal className="w-3 h-3" />
              <span>LATEST ALERT</span>
            </div>
            <div className="text-xs text-red-400 font-mono">
              {typingText}
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-red-400 ml-0.5 align-middle"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Trend Sparkline */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {language === 'th' ? 'แนวโน้ม 24 ชั่วโมง' : '24h Trend'}
          </span>
          <span className="text-xs text-cyan-400">
            +{Math.floor(Math.random() * 20 + 5)}%
          </span>
        </div>
        <div className="h-10 flex items-end gap-0.5">
          {Array.from({ length: 40 }).map((_, i) => {
            const height = Math.random() * 100;
            const isRecent = i > 30;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
                className={cn(
                  "flex-1 rounded-t-[1px]",
                  isRecent 
                    ? height > 70 ? 'bg-red-500/60' : 'bg-cyan-500/60'
                    : 'bg-slate-700/40'
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RiskIntelligenceHub;