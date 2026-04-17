import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { firstMessage } = await req.json();

    if (!firstMessage) {
      // Inexploitable (Missing data) = ERR_INVALID_REQUEST (Rule #4)
      throw new Error('ERR_INVALID_REQUEST: firstMessage is required');
    }

    const prompt = `Génère un titre très court (max 5 mots) et professionnel en français pour une discussion juridique commençant par ce message : "${firstMessage}". 
    Réponds UNIQUEMENT avec le titre, sans ponctuation inutile à la fin.`;

    // Correct usage for @google/genai SDK (Unified SDK)
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    let titleText = '';
    
    // Safety extract (Rule #4 check)
    if (typeof (result as any).text === 'function') {
      try {
        titleText = (result as any).text().trim();
      } catch (e) {
        console.warn('[TITLE_EXTRACT_METHOD_FAIL]', e);
      }
    }
    
    if (!titleText) {
      titleText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }

    // Rule #4 Enforcement: Empty response is a functional error
    if (!titleText) {
        throw new Error('ERR_EMPTY_RESPONSE: AI returned no title');
    }

    const title = titleText.replace(/^"|"$/g, '');

    return NextResponse.json({ title });

  } catch (error: any) {
    // Audit Note: Using handleApiError ensures system exceptions aren't leaked (Rule #2)
    // and that predefined codes are used (Rule #3).
    return handleApiError(error, 'TITLE_API');
  }
}
