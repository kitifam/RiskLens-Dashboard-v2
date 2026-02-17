import React, { useState } from 'react';
import { Risk } from '../types/risk';
import { getRiskLevel, cn, getRiskContent } from '../lib/utils';
import { Button } from './ui/Button';
import { Eye, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/Badge';
import { useLanguage } from '../contexts/LanguageContext';

interface RiskListProps {
  risks: Risk[];
  onView?: (risk: Risk) => void;
  onEdit?: (risk: Risk) => void;
}

export function RiskList({ risks, onView, onEdit }: RiskListProps) {
  const { t, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedRisks = [...risks].sort((a, b) => b.score - a.score);

  const totalPages = Math.ceil(sortedRisks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRisks = sortedRisks.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevious = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

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
              <th className="px-4 py-3 font-medium w-5/12 min-w-[200px]">{t.title}</th>
              <th className="px-4 py-3 font-medium w-2/12 min-w-[100px]">{t.businessUnit}</th>
              <th className="px-4 py-3 font-medium w-2/12 min-w-[100px]">{t.type}</th>
              <th className="px-4 py-3 font-medium w-1/12 min-w-[80px]">{t.score}</th>
              <th className="px-4 py-3 font-medium w-2/12 text-right min-w-[100px]">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {currentRisks.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        {t.notFound}
                    </td>
                </tr>
            ) : (
                currentRisks.map((risk) => {
                const level = getRiskLevel(risk.score);
                const { title, description } = getRiskContent(risk, language);
                
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
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-cyan-400" 
                            title={t.edit}
                            onClick={() => onEdit?.(risk)}
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
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