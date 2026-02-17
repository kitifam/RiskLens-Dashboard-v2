export type RiskType = 'risk' | 'issue';
export type BusinessUnit = 'Sales' | 'IT' | 'Finance' | 'Operations' | 'HR';
export type RiskCategory = 'strategic' | 'operational' | 'financial' | 'compliance';

export interface Risk {
  id: string;
  title: string;
  description: string;
  // Optional English translations for mock data
  titleEn?: string;
  descriptionEn?: string;
  type: RiskType;
  businessUnit: BusinessUnit;
  likelihood: number; // 1-5
  impact: number; // 1-5
  score: number; // Auto-calculated: likelihood * impact
  expectedDate?: string; // ISO date string
  financialImpact?: number; // Estimated financial impact in USD
  aiSuggestedType?: RiskType;
  aiConfidence?: number; // 0-1
  aiOverride?: boolean; // True if user ignored AI suggestion
  status: 'active' | 'mitigated' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface RiskStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}