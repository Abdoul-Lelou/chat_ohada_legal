import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/utils/api-error';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
       throw new Error('ERR_INVALID_REQUEST: Missing conversationId');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('ERR_UNAUTHORIZED');

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`DB_ERROR: ${error.message}`);

    return NextResponse.json(data);
  } catch (err: any) {
    return handleApiError(err, 'GET_MESSAGES');
  }
}
