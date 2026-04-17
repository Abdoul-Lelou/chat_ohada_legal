/**
 * 🔐 Frontend Error Parser Logic
 * Ensures no technical jargon or HTML leaks to the UI.
 */

export interface FriendlyError {
  message: string;
  code: string;
  isTechnical: boolean;
}

const DEFAULT_ERROR_MESSAGE = "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.";

/**
 * Parses a Response object safely.
 * If the response is not JSON or is missing the expected structure, 
 * it returns a generic friendly message.
 */
export async function parseApiError(response: Response): Promise<FriendlyError> {
  try {
    // 1. Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        message: DEFAULT_ERROR_MESSAGE,
        code: 'ERR_NON_JSON_RESPONSE',
        isTechnical: true
      };
    }

    // 2. Parse the body
    const data = await response.json();

    // 3. Extract professional message or use fallback
    return {
      message: data.message || data.error || DEFAULT_ERROR_MESSAGE,
      code: data.code || 'ERR_UNKNOWN',
      isTechnical: false
    };

  } catch (err) {
    console.error('[FRONTEND_ERROR_PARSER_FAIL]', err);
    return {
      message: DEFAULT_ERROR_MESSAGE,
      code: 'ERR_PARSING_FAILED',
      isTechnical: true
    };
  }
}

/**
 * Helper to handle generic catch blocks in frontend components.
 */
export function handleUknownError(error: any): FriendlyError {
  console.error('[UNKNOWN_FRONTEND_ERROR]', error);
  
  // Handle network failures (fetch failed)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: "Impossible de contacter le serveur. Veuillez vérifier votre connexion.",
      code: 'ERR_NETWORK_FAILED',
      isTechnical: false
    };
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    code: 'ERR_UNKNOWN',
    isTechnical: true
  };
}
