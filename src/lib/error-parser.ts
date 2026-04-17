/**
 * 🔐 Frontend Error Parser Logic (Strict OHADA Compliance)
 * Ensures no technical jargon, HTML proxy errors, or raw system exceptions leak to the UI.
 */

export interface FriendlyError {
  message: string;
  code: string;
  isTechnical: boolean;
}

const DEFAULT_ERROR_MESSAGE = "Une erreur technique est survenue. Veuillez réessayer plus tard.";

/**
 * Parses a Response object safely according to Rule #1.
 * "Toute réponse non JSON doit être ignorée et remplacée par un message générique"
 */
export async function parseApiError(response: Response): Promise<FriendlyError> {
  try {
    // 1. Strict JSON Check
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Rule #1 Enforcement: Generic message for non-JSON content (HTML, Text, Proxy Errors)
      return {
        message: DEFAULT_ERROR_MESSAGE,
        code: 'ERR_NON_JSON_RESPONSE',
        isTechnical: true
      };
    }

    // 2. Parse the body safely
    const data = await response.json();

    // 3. Extract professional message and predefined code
    // Ensure no raw system info leaks (Rule #2)
    return {
      message: data.message || DEFAULT_ERROR_MESSAGE,
      code: data.code || 'ERR_API_GENERIC',
      isTechnical: false
    };

  } catch (err) {
    // Catching parsing failures (Rule #1)
    console.error('[CRITICAL_FRONTEND_PARSE_FAIL]', err);
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
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
    return {
      message: "Impossible de contacter le serveur. Veuillez vérifier votre connexion.",
      code: 'ERR_NETWORK_FAILED',
      isTechnical: false
    };
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    code: 'ERR_API_GENERIC',
    isTechnical: true
  };
}
