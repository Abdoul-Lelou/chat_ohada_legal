import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';
import { handleApiError } from '@/lib/utils/api-error';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('ERR_UNAUTHORIZED');
    }

    const formData = await req.formData();
    const file       = formData.get('file')       as File | null;
    const title      = formData.get('title')      as string;
    const sourceType = formData.get('sourceType') as string || 'OHADA';

    if (!file)         throw new Error('ERR_INVALID_REQUEST: Aucun fichier fourni');
    if (!title?.trim()) throw new Error('ERR_INVALID_REQUEST: Le titre est requis');

    // Validate MIME type
    if (file.type !== 'application/pdf') {
       throw new Error('ERR_INVALID_REQUEST: Seuls les fichiers PDF sont acceptés');
    }

    // Validate size (10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
       throw new Error('ERR_INVALID_REQUEST: Fichier trop lourd (max 10 Mo)');
    }

    // Sanitize filename and build storage path
    const safeName    = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${user.id}/${uuidv4()}_${safeName}`;

    // Upload to Supabase Storage
    const adminSupabase = createAdminClient();
    const fileBuffer = await file.arrayBuffer();
    const { error: storageError } = await adminSupabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) {
      throw new Error(`STORAGE_ERROR: ${storageError.message}`);
    }

    // Insert document metadata
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
      // Cleanup orphaned file
      await adminSupabase.storage.from('documents').remove([storagePath]);
      throw new Error(`DB_ERROR: ${docError?.message || 'Insert failed'}`);
    }

    return NextResponse.json({
      success:    true,
      documentId: docData.id,
      storagePath,
    });

  } catch (error: any) {
    return handleApiError(error, 'UPLOAD_API');
  }
}
