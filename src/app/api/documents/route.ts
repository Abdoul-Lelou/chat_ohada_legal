import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // RLS ensures results are scoped to this user automatically
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, source_type, status, file_path, created_at')
      .is('deleted_at', null)          // exclude soft-deleted
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET documents error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('GET /api/documents failed:', err);
    return NextResponse.json({ 
      error: err.message,
      details: "Check server logs for more info" 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });

    const adminSupabase = createAdminClient();

    // 1. Fetch the document to get its storage path (RLS ensures it belongs to user)
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    // 2. Delete document from DB (chunks cascade-deleted automatically)
    const { error: deleteError } = await adminSupabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 3. Delete the physical file from Supabase Storage
    if (doc.file_path) {
      const { error: storageError } = await adminSupabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) {
        // Log but don't fail — DB record is gone, file cleanup is best-effort
        console.warn('Storage cleanup failed (non-critical):', storageError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
