import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { firstMessage } = await req.json();

    if (!firstMessage) {
      return NextResponse.json({ title: 'Nouvelle discussion' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Génère un titre très court (max 5 mots) et professionnel en français pour une discussion juridique commençant par ce message : "${firstMessage}". 
    Réponds UNIQUEMENT avec le titre, sans ponctuation inutile à la fin.`;

    const result = await model.generateContent(prompt);
    const title = result.response.text().trim().replace(/^"|"$/g, '');

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Title generation error:', error);
    return NextResponse.json({ title: 'Nouvelle discussion' });
  }
}
