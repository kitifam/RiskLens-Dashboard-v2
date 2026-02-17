import { Risk, RiskType } from "../types/risk";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Language } from "./translations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function getRiskLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 21) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
  if (score >= 13) return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
  if (score >= 7) return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);
}

export function classifyRisk(text: string): { type: RiskType; confidence: number } {
  const issueKeywords = ['happened', 'occurred', 'broke', 'failed', 'is happening', 'outage', 'crash', 'stopped', 'resigned', 'breach', 'overrun'];
  const riskKeywords = ['might', 'could', 'may', 'potential', 'risk of', 'possible', 'forecast', 'future', 'coming', 'expecting', 'threat'];
  
  const lowerText = text.toLowerCase();
  const issueCount = issueKeywords.filter(kw => lowerText.includes(kw)).length;
  const riskCount = riskKeywords.filter(kw => lowerText.includes(kw)).length;
  
  if (issueCount > riskCount) {
    // If issue keywords dominate
    return { type: 'issue', confidence: Math.min(0.95, 0.75 + (issueCount * 0.05)) };
  } else if (riskCount > issueCount) {
    // If risk keywords dominate
    return { type: 'risk', confidence: Math.min(0.95, 0.70 + (riskCount * 0.05)) };
  }
  
  // Default fallback if ambiguous, default to risk but low confidence
  return { type: 'risk', confidence: 0.5 };
}

export function getRiskContent(risk: Risk, language: Language) {
  if (language === 'en' && risk.titleEn) {
    return {
      title: risk.titleEn,
      description: risk.descriptionEn || risk.description
    };
  }
  return {
    title: risk.title,
    description: risk.description
  };
}