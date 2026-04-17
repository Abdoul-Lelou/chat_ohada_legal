import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file       = formData.get('file')       as File | null;
    const title      = formData.get('title')      as string;
    const sourceType = formData.get('sourceType') as string || 'OHADA';

    if (!file)         return NextResponse.json({ error: 'Aucun fichier fourni' },   { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: 'Le titre est requis' },   { status: 400 });

    // Validate MIME type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 });
    }

    // Validate size (10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop lourd (max 10 Mo)' }, { status: 400 });
    }

    // Sanitize filename and build storage path scoped to user folder
    const safeName    = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${user.id}/${uuidv4()}_${safeName}`;

    // Upload to Supabase Storage using admin client (bypasses storage RLS)
    const adminSupabase = createAdminClient();
    const fileBuffer = await file.arrayBuffer();
    const { error: storageError } = await adminSupabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) {
      console.error('Storage Error:', storageError);
      return NextResponse.json(
        { error: `Erreur lors de l'upload : ${storageError.message}` },
        { status: 500 }
      );
    }

    // Insert document metadata via admin client (user is already verified above)
    const { data: docData, error: docError } = await adminSupabase
      .from('documents')
      .insert({
        user_id:     user.id,
        title:       title.trim(),
        source_type: sourceType,
        file_path:   storagePath,
        status:      'processing',
      })
      .select('id')
      .single();

    if (docError || !docData) {
      // Cleanup orphaned file if DB insert fails
      await adminSupabase.storage.from('documents').remove([storagePath]);
      console.error('DB Insert Error:', JSON.stringify(docError));
      return NextResponse.json({
        error: `DB Insert failed: ${docError?.message ?? 'Unknown error'} [code: ${docError?.code ?? '?'}]`,
        details: docError,
      }, { status: 500 });
    }

    return NextResponse.json({
      success:    true,
      documentId: docData.id,
      storagePath,
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
