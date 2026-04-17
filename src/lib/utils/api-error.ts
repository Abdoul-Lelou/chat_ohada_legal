import { NextResponse } from 'next/server';

/**
 * 🔐 Nomenclature des Codes d'Erreur Professionnels
 */
export type ErrorCode = 
  | 'ERR_API_GENERIC' 
  | 'ERR_RAG_NO_DATA' 
  | 'ERR_TIMEOUT' 
  | 'ERR_UNAUTHORIZED' 
  | 'ERR_INVALID_REQUEST'
  | 'ERR_STREAMS_ERROR';

export interface ErrorResponse {
  error: true;
  message: string;
  code: ErrorCode;
}

/**
 * 🧠 Central Error Handler for API Routes
 * Transforms technical exceptions into professional messages for jurists.
 */
export function handleApiError(error: any, context?: string): NextResponse<ErrorResponse> {
  // 1. Log internal details for developers
  console.error(`[INTERNAL_LOG] [${context || 'API'}]`, {
    message: error.message,
    stack: error.stack,
    details: error,
  });

  // 2. Default Values
  let status = 500;
  let code: ErrorCode = 'ERR_API_GENERIC';
  let message = "Une erreur technique est survenue. Veuillez réessayer.";

  // 3. Categorization logic
  const errorMsg = String(error.message || '').toLowerCase();

  if (errorMsg.includes('unauthorized') || errorMsg.includes('auth')) {
    status = 401;
    code = 'ERR_UNAUTHORIZED';
    message = "Votre session a expiré ou vous n'avez pas les droits nécessaires.";
  } 
  else if (errorMsg.includes('invalid') || errorMsg.includes('required')) {
    status = 400;
    code = 'ERR_INVALID_REQUEST';
    message = "Les informations envoyées sont incorrectes ou incomplètes.";
  }
  else if (errorMsg.includes('timeout') || errorMsg.includes('deadline')) {
    status = 504;
    code = 'ERR_TIMEOUT';
    message = "Le traitement est en cours mais prend plus de temps que prévu. Merci de réessayer.";
  }
  else if (errorMsg.includes('none found') || errorMsg.includes('base juridique')) {
    status = 404;
    code = 'ERR_RAG_NO_DATA';
    message = "Les informations demandées ne sont pas disponibles dans la base fournie.";
  }

  return NextResponse.json(
    { error: true, message, code },
    { status }
  );
}
