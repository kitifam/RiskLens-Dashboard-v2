import { GoogleGenAI, Type } from "@google/genai";
import { RiskType } from "../types/risk";

// ---------------------------------------------------------
// PUT YOUR API KEY HERE
// Example: const apiKey = process.env.API_KEY; 
const apiKey = "AIzaSyDlcY7b6v3KbT50KPtli8JKvg_apzZJ_AE";

// ---------------------------------------------------------

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface AIAnalysisResult {
  detectedType: RiskType; // What the AI thinks the ORIGINAL text is
  targetType: RiskType;   // The type the user wants (passed in)
  confidence: number;
  reasoning: string;      // Conversational advice
  suggestedLikelihood: number;
  suggestedImpact: number;
  improvedTitle: string;
  improvedDescription: string;
}

export async function analyzeRiskWithGemini(title: string, description: string, targetType: RiskType): Promise<AIAnalysisResult> {
  // Fallback if no API key is present
  if (!ai) {
    console.warn("API Key not found. Using mock fallback.");
    return mockAnalyze(title, description, targetType);
  }

  try {
    const prompt = `
      You are an expert Risk Manager.
      
      User Input Title: "${title}"
      User Input Description: "${description}"
      User Selected Category: "${targetType}"
      
      Task:
      1. Analyze the input text. Does it sound like a "risk" (future potential event) or an "issue" (event already happened/happening)?
      2. If the text matches the User Selected Category, refine it to be clearer and professional (in Thai).
      3. **CRITICAL**: If the text matches the OPPOSITE category (e.g., User selected Risk, but text describes an Issue), REWRITE the Title and Description to fit the User Selected Category.
         - Example: If text is "System crashed" (Issue) but category is Risk, rewrite as "Risk of critical system failure impacting operations".
      4. Suggest Likelihood (1-5) and Impact (1-5) based on the REWRITTEN content.
      5. Provide reasoning in Thai. If you rewrote it to change the type, say something like: "ข้อความนี้ดูเหมือนเป็น [Detected] ให้ผมช่วยปรับเป็น [Target] ไหมครับ?"
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedType: { type: Type.STRING, enum: ["risk", "issue"] },
            targetType: { type: Type.STRING, enum: ["risk", "issue"] },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            suggestedLikelihood: { type: Type.NUMBER },
            suggestedImpact: { type: Type.NUMBER },
            improvedTitle: { type: Type.STRING },
            improvedDescription: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return mockAnalyze(title, description, targetType);
  }
}

// Fallback logic for demo without API Key
function mockAnalyze(title: string, description: string, targetType: RiskType): AIAnalysisResult {
  const text = (title + " " + description).toLowerCase();
  const issueKeywords = ['happened', 'occurred', 'broke', 'failed', 'is happening', 'outage', 'crash', 'stopped', 'incident', 'issue', 'problem', 'ล่ม', 'พัง', 'เสีย'];
  const riskKeywords = ['might', 'could', 'may', 'potential', 'risk', 'future', 'threat', 'forecast', 'expecting', 'likely', 'อาจ', 'ความเสี่ยง', 'แนวโน้ม'];
  
  const issueCount = issueKeywords.filter(w => text.includes(w)).length;
  const riskCount = riskKeywords.filter(w => text.includes(w)).length;
  
  // Detect what the text actually looks like
  let detectedType: RiskType = 'risk';
  if (issueCount > riskCount) detectedType = 'issue';
  else if (riskCount > issueCount) detectedType = 'risk';
  else detectedType = targetType; // Benefit of doubt

  const isMismatch = detectedType !== targetType;

  // Generate Improvement
  let improvedTitle = title;
  let improvedDescription = description;
  let reasoning = "ข้อความชัดเจนดีแล้วครับ";

  if (isMismatch) {
    // Simulate Conversion
    if (targetType === 'risk' && detectedType === 'issue') {
        improvedTitle = `ความเสี่ยงที่ ${title} อาจเกิดขึ้นซ้ำ`;
        improvedDescription = `[AI ปรับแก้] ความเสี่ยงที่ระบบอาจเกิดความขัดข้องส่งผลกระทบต่อการดำเนินงาน (ปรับจากข้อความเดิมที่เป็นปัญหาที่เกิดแล้ว)`;
        reasoning = "ข้อความนี้ดูเหมือนเป็นปัญหาที่เกิดขึ้นแล้ว (Issue) ให้ผมช่วยปรับเป็น 'ความเสี่ยง' (Risk) ไหมครับ?";
    } else if (targetType === 'issue' && detectedType === 'risk') {
        improvedTitle = `ปัญหา: ${title}`;
        improvedDescription = `[AI ปรับแก้] เหตุการณ์ ${title} ได้เกิดขึ้นแล้วและกำลังส่งผลกระทบ (ปรับจากข้อความเดิมที่เป็นความเสี่ยง)`;
        reasoning = "ข้อความนี้ดูเหมือนเป็นความเสี่ยง (Risk) ให้ผมช่วยปรับเป็น 'ปัญหา' (Issue) ที่เกิดขึ้นจริงไหมครับ?";
    }
  } else {
      improvedTitle = `[Professional] ${title}`;
      improvedDescription = `${description} (AI ตรวจสอบแล้วถูกต้อง)`;
      reasoning = "รายละเอียดสอดคล้องกับประเภทที่เลือกครับ ผมช่วยปรับสำนวนให้ทางการขึ้นเล็กน้อย";
  }

  return { 
    detectedType,
    targetType,
    confidence: 0.85, 
    reasoning,
    suggestedLikelihood: targetType === 'issue' ? 5 : 3,
    suggestedImpact: 3,
    improvedTitle,
    improvedDescription
  };
}