import React from 'react';
import { Risk } from '../types/risk';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { X, Calendar, Activity, Building2 } from 'lucide-react';
import { formatDate, getRiskLevel, cn, getRiskContent } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface RiskDetailsModalProps {
  risk: Risk;
  onClose: () => void;
  onEdit: (risk: Risk) => void;
}

export function RiskDetailsModal({ risk, onClose, onEdit }: RiskDetailsModalProps) {
  const { t, language } = useLanguage();
  const level = getRiskLevel(risk.score);
  const { title, description } = getRiskContent(risk, language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start p-6 border-b border-slate-800 bg-slate-900/50">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant={risk.type === 'issue' ? 'warning' : 'default'} className="uppercase">
                        {risk.type}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">ID: {risk.id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 leading-tight">{title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn("p-4 rounded-lg border", level.bg, level.border)}>
                    <div className={cn("flex items-center gap-2 mb-1", level.color)}>
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">{t.score}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={cn("text-3xl font-bold", level.color)}>{risk.score}</span>
                        <span className="text-sm text-slate-400">/ 25</span>
                    </div>
                    <Badge className={cn("mt-2 border-transparent bg-slate-900/30", level.color)}>{level.label}</Badge>
                </div>
                
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                     <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Building2 className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">{t.businessUnit}</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-200">{risk.businessUnit}</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                     <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">{t.expectedDate}</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-200">
                        {risk.expectedDate ? formatDate(risk.expectedDate) : (language === 'th' ? 'ไม่ระบุ' : 'N/A')}
                    </p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Details</h3>
                <p className="text-slate-400 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-slate-800 pt-6">
                <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase mb-1">{t.likelihood}</span>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" style={{ width: `${(risk.likelihood / 5) * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-cyan-400">{risk.likelihood}/5</span>
                    </div>
                </div>
                <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase mb-1">{t.impact}</span>
                    <div className="flex items-center gap-2">
                         <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" style={{ width: `${(risk.impact / 5) * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-cyan-400">{risk.impact}/5</span>
                    </div>
                </div>
            </div>
            
            {risk.aiSuggestedType && (
                 <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-900/30 p-3 rounded border border-indigo-500/30">
                    <span className="font-semibold">AI Insight:</span>
                    {language === 'th' 
                        ? `AI จำแนกประเภทความเสี่ยงนี้ด้วยความมั่นใจ ${Math.round((risk.aiConfidence || 0) * 100)}%`
                        : `AI Classified this risk with ${Math.round((risk.aiConfidence || 0) * 100)}% confidence`}
                </div>
            )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
                {language === 'th' ? 'ปิด (Close)' : 'Close'}
            </Button>
            <Button onClick={() => {
                onEdit(risk);
                onClose();
            }}>
                {language === 'th' ? 'แก้ไข (Edit)' : 'Edit'}
            </Button>
        </div>
      </div>
    </div>
  );
}