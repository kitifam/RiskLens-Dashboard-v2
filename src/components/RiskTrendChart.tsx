import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Risk } from '../types/risk';
import { useLanguage } from '../contexts/LanguageContext';

interface RiskTrendChartProps {
    risks: Risk[];
}

export function RiskTrendChart({ risks }: RiskTrendChartProps) {
    const { t, language } = useLanguage();

    // Mock data: แนวโน้มความเสี่ยงรายวัน (ความเสี่ยงใหม่ + วิกฤตที่ยกระดับ) ตาม M T W T F S S
    const dataPoints = [
        { day: 'M', newRisks: 5, criticalEscalations: 2, label: 'Mon' },
        { day: 'T', newRisks: 8, criticalEscalations: 3, label: 'Tue' },
        { day: 'W', newRisks: 6, criticalEscalations: 4, label: 'Wed' },
        { day: 'T', newRisks: 11, criticalEscalations: 5, label: 'Thu' },
        { day: 'F', newRisks: 9, criticalEscalations: 3, label: 'Fri' },
        { day: 'S', newRisks: 4, criticalEscalations: 2, label: 'Sat' },
        { day: 'S', newRisks: 3, criticalEscalations: 1, label: 'Sun' },
    ];

    const totals = dataPoints.map(d => d.newRisks + d.criticalEscalations);
    const maxValue = Math.max(1, ...totals);

    return (
        <Card className="h-full bg-slate-900 border border-slate-800 shadow-lg min-h-[340px]">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        {t.riskTrendAnalysis}
                    </CardTitle>
                    <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> IT (+12%)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Ops (-5%)
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* พื้นที่กราฟมีความสูงคงที่ เพื่อให้ % ของแท่งคำนวณได้ถูกต้อง */}
                <div className="h-[200px] w-full flex items-end justify-between gap-1 sm:gap-2 pt-2 px-1">
                    {dataPoints.map((point, index) => {
                        const total = point.newRisks + point.criticalEscalations;
                        const totalHeightPercent = total > 0 ? Math.max(8, (total / maxValue) * 100) : 0;
                        const barHeightPx = (total / maxValue) * 180;
                        
                        const criticalRatio = total > 0 ? (point.criticalEscalations / total) * 100 : 0;
                        const newRatio = total > 0 ? (point.newRisks / total) * 100 : 0;
                        
                        const criticalHeight = `${criticalRatio}%`;
                        const newHeight = `${newRatio}%`;

                        return (
                            <div key={`${point.day}-${index}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 group relative h-full">
                                <div className="relative w-full flex-1 flex flex-col justify-end items-center min-h-0" style={{ minHeight: 160 }}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs px-2 py-1.5 rounded border border-slate-700 whitespace-nowrap z-10 shadow-lg pointer-events-none">
                                        <div className="font-semibold text-slate-200 mb-1">{point.label}</div>
                                        <div className="flex items-center gap-1.5 text-cyan-400">{t.newRisks}: {point.newRisks}</div>
                                        <div className="flex items-center gap-1.5 text-red-400">{t.criticalEscalations}: {point.criticalEscalations}</div>
                                    </div>
                                    <div
                                        className="w-full max-w-[36px] min-w-[20px] rounded-t flex flex-col-reverse overflow-hidden hover:brightness-110 transition-all cursor-pointer border border-slate-700/50"
                                        style={{ height: `${barHeightPx}px`, minHeight: total > 0 ? 24 : 0 }}
                                    >
                                        <div style={{ height: newHeight }} className="w-full bg-cyan-500 shrink-0" title={`${t.newRisks}: ${point.newRisks}`} />
                                        <div style={{ height: criticalHeight }} className="w-full bg-red-500 shrink-0" title={`${t.criticalEscalations}: ${point.criticalEscalations}`} />
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium shrink-0">{point.day}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-cyan-500"></div> {t.newRisks}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500"></div> {t.criticalEscalations}
                    </div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-3 pb-1">
                    {dataPoints.reduce((a, p) => a + p.newRisks + p.criticalEscalations, 0)} {language === 'th' ? 'รายการในสัปดาห์' : 'items this week'}
                </p>
            </CardContent>
        </Card>
    );
}