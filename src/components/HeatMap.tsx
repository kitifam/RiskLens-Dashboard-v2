import React from 'react';
import { Risk } from '../types/risk';
import { cn, getRiskLevel, getRiskContent } from '../lib/utils';
import { Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeatMapProps {
  risks: Risk[];
  onRiskClick?: (riskId: string) => void;
  onCellClick?: (likelihood: number, impact: number) => void;
  selectedCell?: { likelihood: number, impact: number } | null;
}

export function HeatMap({ risks, onRiskClick, onCellClick, selectedCell }: HeatMapProps) {
  const { t, language } = useLanguage();
  // Grid coordinates: Y = Likelihood (5 to 1), X = Impact (1 to 5)
  const rows = [5, 4, 3, 2, 1];
  const cols = [1, 2, 3, 4, 5];

  const getCellColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    const level = getRiskLevel(score);
    // Dark mode: use very subtle background for context, brighter on hover
    if (level.color.includes('red')) return 'bg-red-500/5 hover:bg-red-500/10 border-red-500/10';
    if (level.color.includes('orange')) return 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/10';
    if (level.color.includes('yellow')) return 'bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/10';
    return 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10';
  };

  const getRisksInCell = (likelihood: number, impact: number) => {
    return risks.filter(r => r.likelihood === likelihood && r.impact === impact);
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-lg border border-slate-800 min-h-[340px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-100">{t.riskHeatMap}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
           <Info className="w-4 h-4" />
           <span>{t.clickToFilter}</span>
        </div>
      </div>

      <div className="relative flex">
        {/* Y-Axis Label */}
        <div className="hidden sm:flex flex-col justify-center items-center mr-4">
          <span className="transform -rotate-90 whitespace-nowrap text-sm font-medium text-slate-500 tracking-wider">
            {t.likelihood}
          </span>
        </div>

        <div className="flex-1">
            <div className="grid grid-cols-5 gap-1 md:gap-2">
                {rows.map((row) => (
                <React.Fragment key={`row-${row}`}>
                    {cols.map((col) => {
                    const cellRisks = getRisksInCell(row, col);
                    const cellBaseClass = getCellColor(row, col);
                    const isSelected = selectedCell?.likelihood === row && selectedCell?.impact === col;
                    
                    return (
                        <div
                        key={`${row}-${col}`}
                        onClick={() => onCellClick?.(row, col)}
                        className={cn(
                            "aspect-square relative border rounded-md transition-all p-1 md:p-2 flex flex-wrap content-center justify-center gap-1 cursor-pointer",
                            cellBaseClass,
                            isSelected ? "ring-2 ring-cyan-500 border-cyan-500 z-10 bg-slate-800" : ""
                        )}
                        >
                        {/* Render Dots */}
                        {cellRisks.slice(0, 4).map((risk) => {
                            const { title } = getRiskContent(risk, language);
                            return (
                            <div
                                key={risk.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRiskClick?.(risk.id);
                                }}
                                className={cn(
                                "w-3 h-3 md:w-4 md:h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-125 transition-transform group relative",
                                risk.score >= 21 ? "bg-red-500 shadow-red-500/50" : 
                                risk.score >= 13 ? "bg-orange-500 shadow-orange-500/50" :
                                risk.score >= 7 ? "bg-yellow-500 shadow-yellow-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                                )}
                            >
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48 p-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded shadow-xl pointer-events-none">
                                <div className="font-semibold mb-1 truncate text-cyan-400">{title}</div>
                                <div>{t.score}: {risk.score} ({risk.businessUnit})</div>
                                </div>
                            </div>
                            );
                        })}
                        
                        {cellRisks.length > 4 && (
                            <div className="w-full text-[10px] md:text-xs text-center text-slate-500 font-medium">
                            +{cellRisks.length - 4}
                            </div>
                        )}
                        </div>
                    );
                    })}
                </React.Fragment>
                ))}
            </div>
             {/* X-Axis Label */}
            <div className="text-center mt-4">
                <span className="text-sm font-medium text-slate-500 tracking-wider">{t.impact}</span>
            </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>{t.low} (1-6)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>{t.medium} (7-12)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]"></div>{t.high} (13-20)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>{t.critical} (21-25)</div>
      </div>
    </div>
  );
}