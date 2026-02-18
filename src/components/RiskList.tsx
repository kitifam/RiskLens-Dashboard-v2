import React, { useState } from 'react';
import { Risk } from '../types/risk';
import { getRiskLevel, cn, getRiskContent } from '../lib/utils';
import { Button } from './ui/Button';
import { Eye, Edit2, ChevronLeft, ChevronRight, AlertTriangle, Clock, HelpCircle, Minus, CheckCircle2, Trash2 } from 'lucide-react';
import { Badge } from './ui/Badge';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsernameById } from '../data/mockUsers';
import type { SentimentResult } from '../lib/sentimentAnalysis';

interface RiskListProps {
  risks: Risk[];
  onView?: (risk: Risk) => void;
  onEdit?: (risk: Risk) => void;
  onDelete?: (risk: Risk) => void;
  /** RBAC: แสดงปุ่ม Edit ได้หรือไม่ */
  canEdit?: (risk: Risk) => boolean;
  /** RBAC: แสดงปุ่ม Delete ได้หรือไม่ */
  canDelete?: (risk: Risk) => boolean;
  showReportedBy?: boolean;
  showSentiment?: boolean;
  sentimentMap?: Record<string, SentimentResult>;
}

function SentimentIcon({ sentiment }: { sentiment: SentimentResult['sentiment'] }) {
  const map: Record<SentimentResult['sentiment'], { Icon: typeof AlertTriangle; color: string; label: string }> = {
    panic: { Icon: AlertTriangle, color: 'text-red-400', label: 'Panic' },
    urgent: { Icon: Clock, color: 'text-orange-400', label: 'Urgent' },
    concerned: { Icon: HelpCircle, color: 'text-amber-400', label: 'Concerned' },
    neutral: { Icon: Minus, color: 'text-slate-400', label: 'Neutral' },
    confident: { Icon: CheckCircle2, color: 'text-emerald-400', label: 'Confident' },
  };
  const { Icon, color, label } = map[sentiment] || map.neutral;
  return <Icon className={cn('w-4 h-4', color)} title={label} />;
}

export function RiskList({ risks, onView, onEdit, onDelete, canEdit, canDelete, showReportedBy, showSentiment, sentimentMap }: RiskListProps) {
  const { t, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedRisks = [...risks].sort((a, b) => b.score - a.score);

  const totalPages = Math.ceil(sortedRisks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRisks = sortedRisks.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevious = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const colCount = 5 + (showReportedBy ? 1 : 0) + (showSentiment ? 1 : 0);

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-800 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-semibold text-slate-100">{t.riskRegistry}</h3>
        <span className="text-xs text-slate-500">{risks.length} {t.records}</span>
      </div>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-medium min-w-[200px]">{t.title}</th>
              <th className="px-4 py-3 font-medium min-w-[100px]">{t.businessUnit}</th>
              {showReportedBy && (
                <th className="px-4 py-3 font-medium min-w-[100px]">{language === 'th' ? 'ผู้ป้อน' : 'Reported by'}</th>
              )}
              <th className="px-4 py-3 font-medium min-w-[80px]">{t.type}</th>
              <th className="px-4 py-3 font-medium min-w-[80px]">{t.score}</th>
              {showSentiment && (
                <th className="px-4 py-3 font-medium min-w-[70px]">{language === 'th' ? 'โทน' : 'Tone'}</th>
              )}
              <th className="px-4 py-3 font-medium text-right min-w-[100px]">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {currentRisks.length === 0 ? (
                <tr>
                    <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500">
                        {t.notFound}
                    </td>
                </tr>
            ) : (
                currentRisks.map((risk) => {
                const level = getRiskLevel(risk.score);
                const { title, description } = getRiskContent(risk, language);
                const sentiment = showSentiment && sentimentMap?.[risk.id];
                
                return (
                    <tr 
                        key={risk.id} 
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        onClick={() => onView?.(risk)}
                    >
                    <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-200 truncate max-w-[250px] md:max-w-xs lg:max-w-sm" title={title}>{title}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[250px] md:max-w-xs lg:max-w-sm mt-1">{description}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                            {risk.businessUnit}
                        </span>
                    </td>
                    {showReportedBy && (
                      <td className="px-4 py-3 align-top text-slate-300 text-xs">
                        {risk.reportedByUserId ? getUsernameById(risk.reportedByUserId) : '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 align-top">
                        {risk.type === 'issue' ? (
                             <Badge variant="warning">Issue</Badge>
                        ) : (
                             <Badge variant="default">Risk</Badge>
                        )}
                    </td>
                    <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                            <span className={cn("font-bold font-mono", level.color)}>{risk.score}</span>
                            <div className={cn("w-2 h-2 rounded-full", level.bg.replace('/10', ''))}></div>
                        </div>
                    </td>
                    {showSentiment && (
                      <td className="px-4 py-3 align-top">
                        {sentiment ? <SentimentIcon sentiment={sentiment.sentiment} /> : <span className="text-slate-500">-</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 align-top text-right">
                        <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-cyan-400" 
                            title={t.view}
                            onClick={() => onView?.(risk)}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        {(!canEdit || canEdit(risk)) && (
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-cyan-400" 
                              title={t.edit}
                              onClick={() => onEdit?.(risk)}
                          >
                              <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {onDelete && canDelete?.(risk) && (
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-400" 
                              title={language === 'th' ? 'ลบ' : 'Delete'}
                              onClick={() => onDelete(risk)}
                          >
                              <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        </div>
                    </td>
                    </tr>
                );
                })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/50 mt-auto">
          <p className="text-xs text-slate-500">
            {t.page} {currentPage} {t.of} {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}