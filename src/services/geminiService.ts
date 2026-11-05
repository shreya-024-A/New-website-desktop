import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || "" });

export interface CertificateAnalysis {
  category: string;
  points: number;
  extractedText: string;
  extractedName: string;
  isNameMatch: boolean;
  confidence: number;
  description: string;
}

export async function analyzeCertificate(base64Data: string, studentName: string): Promise<CertificateAnalysis> {
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const base64Content = base64Data.split(",")[1] || base64Data;

  const prompt = `
    CRITICAL ROLE: You are a strict KTU Verification Officer. 
    The student logged in is "${studentName}".
    
    TASKS:
    1. Extract the FULL NAME from the certificate.
    2. Set "isNameMatch" to false if the name on the certificate does NOT refer to "${studentName}".
    3. Calculate points EXACTLY using these rules:
       - Workshop at IIT/NIT (Sl No 11): 15 pts.
       - Workshop at any other KTU College (Sl No 11a): 6 pts.
       - Tech Fest/Quiz Participation (Sl No 8): 10-50 pts.
       - Professional Society Competition (Sl No 10): 10-40 pts.
       - Internship (Sl No 14, min 5 days): 20 pts.
       - Industrial Visit (Sl No 15): 5 pts.
       - NSS/Volunteer (Sl No 28-31): 5 pts.
    
    Return the result strictly as JSON.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: base64Content } }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedName: { type: Type.STRING },
            category: { type: Type.STRING },
            points: { type: Type.NUMBER },
            description: { type: Type.STRING },
            isNameMatch: { type: Type.BOOLEAN },
            extractedText: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["extractedName", "category", "points", "description", "isNameMatch", "extractedText", "confidence"],
        },
      },
    });

    const analysis = JSON.parse(result.response.text());
    
    // Safety Force Check: If the student's name isn't contained in the extracted name, it's a mismatch.
    const found = analysis.extractedName.toLowerCase();
    const target = studentName.toLowerCase();
    if (!found.includes(target) && !target.includes(found)) {
        analysis.isNameMatch = false;
    }

    return analysis;
  } catch (error) {
    throw new Error("AI Analysis Failed.");
  }
}