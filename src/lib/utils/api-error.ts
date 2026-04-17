import { NextResponse } from 'next/server';

/**
 * 🔐 Nomenclature des Codes d'Erreur Professionnels (OHADA Legal Chat)
 * Strictement limitée aux codes autorisés pour la production.
 */
export type ErrorCode = 
  | 'ERR_API_GENERIC'     // Erreur serveur inconnue
  | 'ERR_RAG_NO_DATA'     // Pas de contexte trouvé dans la base juridique
  | 'ERR_TIMEOUT'         // Délai de traitement dépassé
  | 'ERR_UNAUTHORIZED'    // Problème d'authentification ou de droits
  | 'ERR_INVALID_REQUEST' // Paramètres manquants ou malformés
  | 'ERR_EMPTY_RESPONSE'  // Le système a retourné une réponse vide (IA ou DB)
  | 'ERR_MALFORMED_DATA'  // Format de données incompatible après traitement
  | 'ERR_STREAMS_ERROR';  // Coupure durant le streaming

export interface ErrorResponse {
  error: true;
  message: string;
  code: ErrorCode;
}

/**
 * 🧠 Central Error Handler for API Routes
 * Transforms technical exceptions into professional messages for jurists.
 * Ensures NO system exceptions are leaked to the client.
 */
export function handleApiError(error: any, context?: string): NextResponse<ErrorResponse> {
  // 1. Log internal details for developers (Internal Logs Only)
  console.error(`[INTERNAL_LOG] [${context || 'API'}]`, {
    message: error.message,
    stack: error.stack,
    details: error,
  });

  // 2. Default Values (Safety fallback)
  let status = 500;
  let code: ErrorCode = 'ERR_API_GENERIC';
  let message = "Une erreur technique est survenue. Veuillez réessayer.";

  // 3. Categorization logic based on message keywords
  const errorMsg = String(error.message || '').toUpperCase();

  if (errorMsg.includes('UNAUTHORIZED') || errorMsg.includes('AUTH')) {
    status = 401;
    code = 'ERR_UNAUTHORIZED';
    message = "Votre session a expiré ou vous n'avez pas les droits nécessaires.";
  } 
  else if (errorMsg.includes('INVALID') || errorMsg.includes('REQUIRED')) {
    status = 400;
    code = 'ERR_INVALID_REQUEST';
    message = "Les informations envoyées sont incorrectes ou incomplètes.";
  }
  else if (errorMsg.includes('TIMEOUT') || errorMsg.includes('DEADLINE')) {
    status = 504;
    code = 'ERR_TIMEOUT';
    message = "Le traitement prend plus de temps que prévu. Veuillez réessayer dans quelques instants.";
  }
  else if (errorMsg.includes('NONE FOUND') || errorMsg.includes('BASE JURIDIQUE') || errorMsg.includes('NO_DATA')) {
    status = 404;
    code = 'ERR_RAG_NO_DATA';
    message = "Les informations demandées ne sont pas disponibles dans la base juridique actuelle.";
  }
  else if (errorMsg.includes('EMPTY') || errorMsg.includes('AUCUN CONTENU')) {
    status = 200; // Case where empty is a valid but error state for client
    code = 'ERR_EMPTY_RESPONSE';
    message = "Le système n'a retourné aucun contenu exploitable.";
  }
  else if (errorMsg.includes('MALFORMED') || errorMsg.includes('FORMAT')) {
    status = 422;
    code = 'ERR_MALFORMED_DATA';
    message = "Les données reçues sont corrompues ou illisibles.";
  }

  // 4. Force strict adherence to predefined codes
  return NextResponse.json(
    { error: true, message, code },
    { status }
  );
}
