// เก็บ state ของการสนทนา
export interface InterviewState {
  stage: 'initial' | 'clarifying' | 'impact' | 'mitigation' | 'summary';
  originalInput: string;
  extractedInfo: {
    isRisk?: boolean;
    vendorName?: string;
    delayReason?: string;
    affectedAreas?: string[];
    financialImpact?: number;
    mitigationStatus?: 'none' | 'planned' | 'active';
    [key: string]: any; // Allow dynamic keys
  };
  questionsAsked: string[];
  currentQuestion?: InterviewQuestion;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'number' | 'confirm';
  options?: { value: string; label: string }[];
  context?: string; // อธิบายว่าทำไมถามคำถามนี้
}

// คำถามต่อเนื่องตาม context
export const QUESTION_TEMPLATES: Record<string, InterviewQuestion[]> = {
  vendor_delay: [
    {
      id: 'vendor_name',
      question: 'เป็น vendor รายไหนครับ?',
      type: 'text',
      context: 'เพื่อประเมิน criticality - vendor หลักหรือรอง'
    },
    {
      id: 'delay_duration',
      question: 'ล่าช้าประมาณกี่วัน?',
      type: 'single_choice',
      options: [
        { value: '1-3', label: '1-3 วัน (Minor)' },
        { value: '4-7', label: '4-7 วัน (Moderate)' },
        { value: '8-14', label: '8-14 วัน (Major)' },
        { value: '15+', label: '15+ วัน (Critical)' }
      ],
      context: 'ระยะเวลาส่งผลต่อ impact score'
    },
    {
      id: 'affected_areas',
      question: 'กระทบส่วนไหนบ้าง? (เลือกได้หลายข้อ)',
      type: 'multiple_choice',
      options: [
        { value: 'production', label: 'สายการผลิต' },
        { value: 'delivery', label: 'การส่งมอบลูกค้า' },
        { value: 'revenue', label: 'รายได้' },
        { value: 'reputation', label: 'ชื่อเสียง' },
        { value: 'other_contracts', label: 'สัญญาอื่นๆ' }
      ],
      context: 'ยิ่งกระทบหลายส่วน ยิ่งต้อง escalate'
    },
    {
      id: 'mitigation',
      question: 'มีแผนรองรับหรือยัง?',
      type: 'single_choice',
      options: [
        { value: 'none', label: 'ยังไม่มี' },
        { value: 'planned', label: 'วางแผนแล้ว รอ execute' },
        { value: 'active', label: 'กำลังทำอยู่' },
        { value: 'resolved', label: 'แก้ไขแล้ว' }
      ],
      context: 'ถ้ายังไม่มีแผน ต้องรีบทำ'
    }
  ],
  
  server_capacity: [
    {
      id: 'server_type',
      question: 'เป็นระบบไหนครับ?',
      type: 'single_choice',
      options: [
        { value: 'production', label: 'Production (ลูกค้าใช้งาน)' },
        { value: 'internal', label: 'Internal (พนักงานใช้)' },
        { value: 'backup', label: 'Backup/DR' }
      ]
    },
    {
      id: 'current_usage',
      question: 'ใช้งานไปกี่เปอร์เซ็นต์แล้ว?',
      type: 'single_choice',
      options: [
        { value: '70-80', label: '70-80%' },
        { value: '80-90', label: '80-90%' },
        { value: '90-95', label: '90-95% ⚠️' },
        { value: '95+', label: '95%+ 🚨' }
      ]
    },
    {
      id: 'scaling_plan',
      question: 'มีแผน scale หรือยัง?',
      type: 'single_choice',
      options: [
        { value: 'auto', label: 'Auto-scaling ทำงานอยู่' },
        { value: 'manual', label: 'ต้อง scale เอง (มีแผน)' },
        { value: 'budget_pending', label: 'รออนุมัติ budget' },
        { value: 'none', label: 'ยังไม่มีแผน' }
      ]
    }
  ],

  client_risk: [
    {
      id: 'client_name',
      question: 'ชื่อลูกค้าหรือโครงการคืออะไรครับ?',
      type: 'text',
      context: 'ระบุเพื่อให้ทีม Sales ทราบ'
    },
    {
      id: 'contract_impact',
      question: 'มูลค่าสัญญาหรือผลกระทบทางการเงินประมาณเท่าไหร่?',
      type: 'single_choice',
      options: [
        { value: 'low', label: '< $10k' },
        { value: 'medium', label: '$10k - $100k' },
        { value: 'high', label: '> $100k' }
      ]
    },
    {
      id: 'relationship_status',
      question: 'สถานะความสัมพันธ์กับลูกค้าตอนนี้เป็นอย่างไร?',
      type: 'single_choice',
      options: [
        { value: 'good', label: 'ดี' },
        { value: 'strained', label: 'ตึงเครียด' },
        { value: 'critical', label: 'วิกฤต (อาจยกเลิกสัญญา)' }
      ]
    }
  ],

  hr_risk: [
    {
      id: 'position',
      question: 'ตำแหน่งที่มีปัญหาคืออะไรครับ?',
      type: 'text'
    },
    {
      id: 'impact_level',
      question: 'ผลกระทบต่องานมากน้อยแค่ไหน?',
      type: 'single_choice',
      options: [
        { value: 'low', label: 'กระทบเล็กน้อย' },
        { value: 'medium', label: 'งานล่าช้าแต่จัดการได้' },
        { value: 'high', label: 'งานหยุดชะงัก / Project เสี่ยงล้มเหลว' }
      ]
    },
    {
      id: 'replacement_plan',
      question: 'แผนการหาคนทดแทนเป็นอย่างไร?',
      type: 'single_choice',
      options: [
        { value: 'internal', label: 'มีคนในแทนได้' },
        { value: 'recruiting', label: 'กำลังรับสมัคร' },
        { value: 'difficult', label: 'หายาก / ต้องใช้เวลาฝึกนาน' }
      ]
    }
  ],

  generic: [
    {
      id: 'impact_desc',
      question: 'ความเสี่ยงนี้ส่งผลกระทบหลักๆ เรื่องอะไรครับ?',
      type: 'text',
      context: 'เช่น การเงิน, ชื่อเสียง, ความปลอดภัย'
    },
    {
      id: 'likelihood_est',
      question: 'โอกาสที่จะเกิดขึ้นมีมากน้อยแค่ไหน?',
      type: 'single_choice',
      options: [
        { value: '1', label: 'น้อยมาก (Rare)' },
        { value: '3', label: 'ปานกลาง (Possible)' },
        { value: '5', label: 'สูงมาก (Almost Certain)' }
      ]
    },
    {
      id: 'severity',
      question: 'ความรุนแรงหากเกิดขึ้น?',
      type: 'single_choice',
      options: [
        { value: '1', label: 'เล็กน้อย' },
        { value: '3', label: 'ปานกลาง' },
        { value: '5', label: 'รุนแรงมาก' }
      ]
    }
  ]
};

// วิเคราะห์ข้อความเริ่มต้น แล้วเลือกชุดคำถามที่เหมาะสม
export function analyzeInputAndSelectFlow(input: string): { 
  flow: string; 
  confidence: number;
  suggestedType: 'risk' | 'issue';
} {
  const lower = input.toLowerCase();
  
  // Keyword matching แบบง่าย (ใน production ใช้ AI วิเคราะห์)
  if (lower.includes('vendor') || lower.includes('supplier') || lower.includes('ส่งของ')) {
    return { flow: 'vendor_delay', confidence: 0.9, suggestedType: 'risk' };
  }
  if (lower.includes('server') || lower.includes('ระบบล่ม') || lower.includes('capacity')) {
    return { flow: 'server_capacity', confidence: 0.85, suggestedType: 'issue' };
  }
  if (lower.includes('ลูกค้า') || lower.includes('client') || lower.includes('contract') || lower.includes('สัญญา')) {
    return { flow: 'client_risk', confidence: 0.8, suggestedType: 'risk' };
  }
  if (lower.includes('พนักงาน') || lower.includes('ลาออก') || lower.includes('turnover')) {
    return { flow: 'hr_risk', confidence: 0.85, suggestedType: 'risk' };
  }
  
  return { flow: 'generic', confidence: 0.5, suggestedType: 'risk' };
}

// สร้าง risk statement สมบูรณ์จากข้อมูลที่เก็บมา
export function generateRiskStatement(state: InterviewState): {
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  reasoning: string;
} {
  const { extractedInfo, originalInput } = state;
  
  // Logic คำนวณ score จากคำตอบ
  let likelihood = 3;
  let impact = 3;
  
  // ปรับ likelihood ตาม mitigation
  if (extractedInfo.mitigationStatus === 'none') likelihood += 1;
  if (extractedInfo.mitigationStatus === 'active') likelihood -= 1;
  if (extractedInfo.likelihood_est) {
      // Generic flow likelihood mapping
      likelihood = parseInt(extractedInfo.likelihood_est as string) || 3;
  }
  
  // ปรับ impact ตาม affected areas หรือ impact level
  if (extractedInfo.affectedAreas?.includes('revenue')) impact += 1;
  if (extractedInfo.affectedAreas?.includes('production')) impact += 1;
  if (extractedInfo.affectedAreas?.length && extractedInfo.affectedAreas.length > 2) impact += 1;
  
  // Handle HR/Client specific impact
  if (extractedInfo.impact_level === 'high' || extractedInfo.contract_impact === 'high') impact = 5;
  if (extractedInfo.impact_level === 'low' || extractedInfo.contract_impact === 'low') impact = 2;
  if (extractedInfo.severity) {
      impact = parseInt(extractedInfo.severity as string) || 3;
  }

  // Clamp ค่า 1-5
  likelihood = Math.max(1, Math.min(5, likelihood));
  impact = Math.max(1, Math.min(5, impact));
  
  // สร้าง title อัตโนมัติ
  let title = originalInput;
  if (extractedInfo.vendorName) title = `ความเสี่ยง ${extractedInfo.vendorName} ส่งของล่าช้า`;
  else if (extractedInfo.client_name) title = `ความเสี่ยงโครงการลูกค้า ${extractedInfo.client_name}`;
  else if (extractedInfo.position) title = `ปัญหาอัตรากำลังคน: ${extractedInfo.position}`;
  
  // สร้าง description สมบูรณ์
  const descriptionParts = [originalInput];
  if (extractedInfo.delayDuration) {
    descriptionParts.push(`ระยะเวลาล่าช้า: ${extractedInfo.delayDuration} วัน`);
  }
  if (extractedInfo.affectedAreas?.length) {
    descriptionParts.push(`กระทบต่อ: ${extractedInfo.affectedAreas.join(', ')}`);
  }
  if (extractedInfo.contract_impact) {
      const valMap: any = { low: '< $10k', medium: '$10k-$100k', high: '> $100k' };
      descriptionParts.push(`มูลค่าผลกระทบ: ${valMap[extractedInfo.contract_impact as string] || extractedInfo.contract_impact}`);
  }
  if (extractedInfo.replacement_plan) {
      const planMap: any = { internal: 'ใช้คนใน', recruiting: 'กำลังรับสมัคร', difficult: 'หาคนยาก' };
      descriptionParts.push(`แผนทดแทน: ${planMap[extractedInfo.replacement_plan as string]}`);
  }
  if (extractedInfo.impact_desc) {
      descriptionParts.push(`ผลกระทบ: ${extractedInfo.impact_desc}`);
  }
  if (extractedInfo.mitigationStatus) {
    const mitigationText = {
      none: 'ยังไม่มีแผนรองรับ',
      planned: 'มีแผนรองรับแล้ว รอดำเนินการ',
      active: 'กำลังดำเนินการแก้ไข',
      resolved: 'แก้ไขแล้ว'
    };
    descriptionParts.push(`สถานะ: ${mitigationText[extractedInfo.mitigationStatus as 'none' | 'planned' | 'active' | 'resolved']}`);
  }
  
  return {
    title,
    description: descriptionParts.join(' | '),
    likelihood,
    impact,
    reasoning: `Likelihood ${likelihood}/5, Impact ${impact}/5 (Auto-calculated based on interview answers)`
  };
}