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

    // Use the @google/genai SDK structure
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Génère un titre très court (max 5 mots) et professionnel en français pour une discussion juridique commençant par ce message : "${firstMessage}". 
    Réponds UNIQUEMENT avec le titre, sans ponctuation inutile à la fin.`;

    const result = await model.generateContent(prompt);
    
    // Safety check on response
    if (!result.response || !result.response.text) {
        return NextResponse.json({ title: 'Nouvelle discussion' });
    }

    const title = result.response.text().trim().replace(/^"|"$/g, '');

    return NextResponse.json({ title });
  } catch (error: any) {
    // For titles, we silently fallback to a default title in UI, but log internally
    console.error('[TITLE_GEN_ERROR]', error);
    return NextResponse.json({ title: 'Nouvelle discussion' });
  }
}
