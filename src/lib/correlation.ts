import { Risk } from '../types/risk';

export interface CorrelationLink {
  source: string;
  target: string;
  strength: number; // 0-1
  type: 'same-bu' | 'similar-score' | 'keyword-match' | 'cascade';
}

export interface NetworkNode {
  id: string;
  title: string;
  businessUnit: string;
  score: number;
  type: 'risk' | 'issue';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

// Jaccard similarity for text comparison
function jaccardSimilarity(text1: string, text2: string, k: number = 3): number {
  const getShingles = (text: string): Set<string> => {
    const shingles = new Set<string>();
    // Allow Thai characters (\u0E00-\u0E7F) and alphanumeric
    const cleanText = text.toLowerCase().replace(/[^\u0E00-\u0E7Fa-z0-9]/g, '');
    for (let i = 0; i <= cleanText.length - k; i++) {
      shingles.add(cleanText.substring(i, i + k));
    }
    return shingles;
  };

  const set1 = getShingles(text1);
  const set2 = getShingles(text2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Calculate correlation between two risks
function calculateCorrelation(risk1: Risk, risk2: Risk): number {
  let score = 0;
  const weights = {
    sameBU: 0.3,
    scoreSimilarity: 0.2,
    textSimilarity: 0.3,
    temporal: 0.2
  };

  // Same Business Unit
  if (risk1.businessUnit === risk2.businessUnit) {
    score += weights.sameBU;
  }

  // Score similarity (inverse of difference)
  const scoreDiff = Math.abs(risk1.score - risk2.score);
  score += weights.scoreSimilarity * (1 - Math.min(scoreDiff / 25, 1));

  // Text similarity using Jaccard
  const textSim = jaccardSimilarity(
    `${risk1.title} ${risk1.description}`,
    `${risk2.title} ${risk2.description}`
  );
  score += weights.textSimilarity * textSim;

  // Temporal correlation (if expected dates are close)
  if (risk1.expectedDate && risk2.expectedDate) {
    const date1 = new Date(risk1.expectedDate);
    const date2 = new Date(risk2.expectedDate);
    const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 30) {
      score += weights.temporal * (1 - diffDays / 30);
    }
  }

  return score;
}

// Generate network data from risks
export function generateNetworkData(risks: Risk[]): { nodes: NetworkNode[]; links: CorrelationLink[] } {
  const nodes: NetworkNode[] = risks.map(r => ({
    id: r.id,
    title: r.title,
    businessUnit: r.businessUnit,
    score: r.score,
    type: r.type,
  }));

  const links: CorrelationLink[] = [];
  const threshold = 0.4; // Minimum correlation to show link

  for (let i = 0; i < risks.length; i++) {
    for (let j = i + 1; j < risks.length; j++) {
      const strength = calculateCorrelation(risks[i], risks[j]);
      if (strength > threshold) {
        let type: CorrelationLink['type'] = 'keyword-match';
        if (risks[i].businessUnit === risks[j].businessUnit) type = 'same-bu';
        else if (Math.abs(risks[i].score - risks[j].score) < 5) type = 'similar-score';
        
        links.push({
          source: risks[i].id,
          target: risks[j].id,
          strength,
          type
        });
      }
    }
  }

  return { nodes, links };
}

// Find cascade risks (risks that might trigger others)
export function findCascadeRisks(risks: Risk[], targetRisk: Risk): Risk[] {
  return risks.filter(r => {
    if (r.id === targetRisk.id) return false;
    const correlation = calculateCorrelation(targetRisk, r);
    return correlation > 0.6 && r.score > 15; // High correlation and high impact
  });
}

// Calculate risk velocity (trend)
export function calculateRiskVelocity(risk: Risk): 'increasing' | 'stable' | 'decreasing' {
  // Mock logic - in real app would compare historical data
  if (risk.score >= 20) return 'increasing';
  if (risk.score >= 15) return 'stable';
  return 'decreasing';
}