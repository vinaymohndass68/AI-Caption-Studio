import { GoogleGenAI, Type } from "@google/genai";
import { ReplyStance, ImageStyle, Tone } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data.split(',')[1],
      mimeType
    },
  };
};

const languageMap: { [key: string]: string } = {
    'en-US': 'English',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'sa-IN': 'Sanskrit',
    'mai-IN': 'Maithili'
};

/**
 * Generates 5 compelling captions based on an image and/or text prompt.
 */
export const generateCaptions = async (
  image: { data: string; mimeType: string } | null,
  prompt: string,
  tone: Tone,
  language: string,
  existingCaptions: string[] = []
): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';
    const parts: any[] = [];
    const languageName = languageMap[language] || 'English';

    let basePrompt = `Generate 5 unique and compelling captions in ${languageName} with a ${tone} tone.`;
    if (existingCaptions.length > 0) {
      basePrompt += ` Make them different from these: ${existingCaptions.join(', ')}.`;
    }

    let generationPrompt = image 
      ? `${basePrompt} Context from user: "${prompt}". Focus on the visual elements of the attached image.`
      : `${basePrompt} Topic/Description: "${prompt}".`;
    
    parts.push({ text: generationPrompt });
    if (image) parts.push(fileToGenerativePart(image.data, image.mimeType));
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    
    const result = response.text;
    if (!result) return [];
    return JSON.parse(result.trim());
  } catch (error) {
    console.error("Caption error:", error);
    throw new Error("Failed to generate captions.");
  }
};

/**
 * Generates reply suggestions based on a statement, stance, tone, and language.
 */
export const generateReplies = async (
  statement: string,
  stance: ReplyStance,
  tone: Tone,
  language: string,
  image: { data: string; mimeType: string } | null = null,
  maxWords: number = 50,
  maxChars: number = 280
): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';
    const languageName = languageMap[language] || 'English';
    const promptParts: any[] = [
      { text: `Statement to reply to: "${statement}"\nRequested Stance: ${stance}\nRequested Tone: ${tone}\nOutput Language: ${languageName}.\n\nCONSTRAINTS:\n- Max Word Limit: ${maxWords} words per reply.\n- Max Character Limit: ${maxChars} characters per reply.\n\nGenerate 5 contextually appropriate replies strictly adhering to these limits.` }
    ];

    if (image) {
      promptParts.push(fileToGenerativePart(image.data, image.mimeType));
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts: promptParts },
      config: {
        systemInstruction: `You are an expert social media communication assistant. Generate 5 creative and contextually appropriate replies that match the user's requested tone (${tone}), stance (${stance}).\n\nCRITICAL CONSTRAINTS: Each reply MUST be under ${maxWords} words AND under ${maxChars} characters. Return the result as a JSON array of strings.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Generate replies error:", error);
    throw error;
  }
};

/**
 * Generates stylized images using the gemini-2.5-flash-image model.
 * Switched from pro to flash-image to avoid mandatory billing-linked key selection 403 errors by default.
 */
export const generateImageFromPrompt = async (prompt: string, style: ImageStyle = ImageStyle.Realistic): Promise<{ data: string; mimeType: string }> => {
  try {
    const ai = getAiClient();
    // Defaulting to gemini-2.5-flash-image for broader compatibility and fewer 403 errors
    const model = 'gemini-2.5-flash-image';
    const finalPrompt = `Professional artistic background for social media. Style: ${style}. Topic: ${prompt}. No text in image.`;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [{ text: finalPrompt }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
    });

    if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No candidates returned from AI.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          mimeType: part.inlineData.mimeType
        };
      }
    }
    throw new Error("No visual output generated by AI.");
  } catch (error: any) {
    console.error("Detailed error in generateImageFromPrompt:", error);
    const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
    
    // Catch common permission/billing errors to trigger the key selector in the UI
    if (errorString.includes("403") || errorString.includes("PERMISSION_DENIED") || errorString.includes("permission")) {
        throw new Error("PERMISSION_DENIED");
    }
    if (errorString.includes("entity was not found")) {
        throw new Error("KEY_MISSING");
    }
    throw error;
  }
};

/**
 * Edits an existing image based on a prompt using the gemini-2.5-flash-image model.
 */
export const editImageWithPrompt = async (
  sourceImage: { data: string; mimeType: string },
  editPrompt: string
): Promise<{ data: string; mimeType: string }> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          fileToGenerativePart(sourceImage.data, sourceImage.mimeType),
          { text: `Edit this image: ${editPrompt}. Maintain the overall structure but apply the requested changes accurately.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No candidates returned.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          mimeType: part.inlineData.mimeType
        };
      }
    }
    throw new Error("Image edit failed - no visual output.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};