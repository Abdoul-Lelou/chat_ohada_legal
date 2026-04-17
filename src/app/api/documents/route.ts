import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleApiError } from '@/lib/utils/api-error';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('ERR_UNAUTHORIZED');

    const { data, error } = await supabase
      .from('documents')
      .select('id, title, source_type, status, file_path, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB_ERROR: ${error.message}`);

    return NextResponse.json(data);
  } catch (err: any) {
    return handleApiError(err, 'GET_DOCUMENTS');
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('ERR_UNAUTHORIZED');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) throw new Error('ERR_INVALID_REQUEST: Missing document ID');

    const adminSupabase = createAdminClient();

    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
       throw new Error('ERR_INVALID_REQUEST: Document introuvable');
    }

    // 2. Delete document from DB
    const { error: deleteError } = await adminSupabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
       throw new Error(`DB_ERROR: ${deleteError.message}`);
    }

    // 3. Delete from Storage (best-effort)
    if (doc.file_path) {
      const { error: storageError } = await adminSupabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.warn('[STORAGE_CLEANUP_FAILED]', storageError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return handleApiError(err, 'DELETE_DOCUMENT');
  }
}
