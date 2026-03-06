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

export async function analyzeCertificate(
  base64Data: string,
  studentName: string
): Promise<CertificateAnalysis> {
  const model = "gemini-3-flash-preview";
  
  // Remove data:image/png;base64, prefix if present
  const base64Content = base64Data.split(",")[1] || base64Data;

  const prompt = `
    Analyze this certificate for a student named "${studentName}".
    Extract the following information:
    1. The name of the person on the certificate.
    2. The category of the activity (e.g., NSS, NCC, Workshop, Sports, Arts, Technical, etc.).
    3. Suggested activity points (usually between 5 and 50 based on the intensity and duration).
    4. A brief description of what the certificate is for.
    5. Whether the name on the certificate matches the student's name "${studentName}".
    
    Return the result in JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG, but Gemini handles most images
              data: base64Content,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extractedName: { type: Type.STRING },
          category: { type: Type.STRING },
          points: { type: Type.NUMBER },
          description: { type: Type.STRING },
          isNameMatch: { type: Type.BOOLEAN },
          extractedText: { type: Type.STRING, description: "Full text from the certificate" },
          confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 1" },
        },
        required: ["extractedName", "category", "points", "description", "isNameMatch", "extractedText", "confidence"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text);
}
