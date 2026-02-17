export type RiskSentiment = 'confident' | 'concerned' | 'urgent' | 'panic' | 'neutral';

export interface SentimentResult {
  sentiment: RiskSentiment;
  score: number; // -1 ถึง 1
  keywords: string[];
  explanation: string;
  recommendedAction: string;
}

// Rule-based analysis (เร็ว ไม่ต้องเรียก API)
export function analyzeSentimentLocal(text: string): SentimentResult {
  const lower = text.toLowerCase();
  
  // คำที่บ่งบอก sentiment
  const panicWords = ['แน่นอน', 'จะต้อง', 'หนักมาก', 'วิกฤต', 'เสียหายมหาศาล', 'พัง', 'ล่มสลาย'];
  const urgentWords = ['ด่วน', 'เร่งด่วน', 'ต้องการ', 'ขาดแคลน', 'ปัญหาใหญ่', 'กระทบหนัก'];
  const concernedWords = ['กังวล', 'ไม่แน่ใจ', 'อาจจะ', 'เสี่ยง', 'น่าเป็นห่วง', 'ระวัง'];
  const confidentWords = ['รับมือได้', 'มีแผน', 'ควบคุมได้', 'ปกติ', 'ไม่น่ากังวล', 'จัดการแล้ว'];
  
  let score = 0;
  const foundKeywords: string[] = [];
  
  panicWords.forEach(word => {
    if (lower.includes(word)) {
      score -= 0.4;
      foundKeywords.push(word);
    }
  });
  
  urgentWords.forEach(word => {
    if (lower.includes(word)) {
      score -= 0.3;
      foundKeywords.push(word);
    }
  });
  
  concernedWords.forEach(word => {
    if (lower.includes(word)) {
      score -= 0.15;
      foundKeywords.push(word);
    }
  });
  
  confidentWords.forEach(word => {
    if (lower.includes(word)) {
      score += 0.2;
      foundKeywords.push(word);
    }
  });
  
  // ปรับตาม punctuation
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 2) score -= 0.1 * exclamationCount;
  
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount > 0) score -= 0.05 * questionCount;
  
  // ปรับตามตัวพิมพ์ใหญ่ (CAPS)
  const capsRatio = (text.match(/[A-Zก-ฮ]/g) || []).length / text.length;
  if (capsRatio > 0.3) score -= 0.2;
  
  // Clamp score
  score = Math.max(-1, Math.min(1, score));
  
  // แปลงเป็น sentiment
  let sentiment: RiskSentiment;
  if (score <= -0.6) sentiment = 'panic';
  else if (score <= -0.3) sentiment = 'urgent';
  else if (score <= -0.1) sentiment = 'concerned';
  else if (score >= 0.2) sentiment = 'confident';
  else sentiment = 'neutral';
  
  // คำแนะนำ
  const actionMap: Record<RiskSentiment, string> = {
    panic: 'ต้องรีบติดต่อเจ้าของ risk ทันที - อาจต้อง escalate ถึง CEO',
    urgent: 'นัด meeting ภายใน 24 ชม. เพื่อวางแผนรับมือ',
    concerned: 'ติดตามใกล้ชิด ขอ update ทุกสัปดาห์',
    neutral: 'ติดตามตามปกติ',
    confident: 'บันทึกไว้ ไม่ต้องติดตามบ่อย'
  };
  
  return {
    sentiment,
    score,
    keywords: foundKeywords.slice(0, 5),
    explanation: `พบคำว่า "${foundKeywords.slice(0, 3).join(', ')}" ${foundKeywords.length > 3 ? 'และอื่นๆ' : ''}`,
    recommendedAction: actionMap[sentiment]
  };
}

// สำหรับ batch analysis (หลาย risk พร้อมกัน)
export function analyzeBatchSentiment(risks: { id: string; description: string }[]): Record<string, SentimentResult> {
  return risks.reduce((acc, risk) => {
    acc[risk.id] = analyzeSentimentLocal(risk.description);
    return acc;
  }, {} as Record<string, SentimentResult>);
}

// สรุป sentiment ของทั้งองค์กร
export function getOrganizationSentimentSummary(results: Record<string, SentimentResult>) {
  const sentiments = Object.values(results);
  const total = sentiments.length;
  
  const distribution = {
    panic: sentiments.filter(s => s.sentiment === 'panic').length,
    urgent: sentiments.filter(s => s.sentiment === 'urgent').length,
    concerned: sentiments.filter(s => s.sentiment === 'concerned').length,
    neutral: sentiments.filter(s => s.sentiment === 'neutral').length,
    confident: sentiments.filter(s => s.sentiment === 'confident').length
  };
  
  const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / total;
  
  let overallStatus: 'critical' | 'warning' | 'stable' | 'healthy';
  if (distribution.panic > 0 || distribution.urgent > total * 0.2) overallStatus = 'critical';
  else if (distribution.urgent > 0 || distribution.concerned > total * 0.3) overallStatus = 'warning';
  else if (avgScore > 0.1) overallStatus = 'healthy';
  else overallStatus = 'stable';
  
  return {
    distribution,
    avgScore,
    overallStatus,
    totalRisks: total
  };
}