import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { firstMessage } = await req.json();

    if (!firstMessage) {
      return NextResponse.json({ title: 'Nouvelle discussion' });
    }

    const prompt = `Génère un titre très court (max 5 mots) et professionnel en français pour une discussion juridique commençant par ce message : "${firstMessage}". 
    Réponds UNIQUEMENT avec le titre, sans ponctuation inutile à la fin.`;

    // Correct usage for @google/genai SDK (Unified SDK)
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    // Safely extract text
    let titleText = '';
    try {
      titleText = result.text().trim();
    } catch (e) {
      // Fallback if text() method fails
      titleText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }

    if (!titleText) {
        return NextResponse.json({ title: 'Nouvelle discussion' });
    }

    const title = titleText.replace(/^"|"$/g, '');

    return NextResponse.json({ title });
  } catch (error: any) {
    // For titles, we silently fallback to a default title in UI, but log internally
    console.error('[TITLE_GEN_ERROR]', error);
    return NextResponse.json({ title: 'Nouvelle discussion' });
  }
}
