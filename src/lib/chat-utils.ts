/**
 * 📝 Chat Utilities
 */

const TRIVIAL_MESSAGES = ['bonjour', 'salut', 'hello', 'hey', 'hi', 'ça va', 'test'];

export const chatUtils = {
  /**
   * Sanitizes text for display and titling
   */
  sanitizeText: (text: string): string => {
    return text
      .replace(/\r?\n|\r/g, ' ') // Remove newlines
      .replace(/\s+/g, ' ')      // Remove multiple spaces
      .trim();
  },

  /**
   * Generates an intuitive title based on the first message
   */
  generateAutoTitle: (firstMessage: string): string => {
    const clean = chatUtils.sanitizeText(firstMessage);
    
    // Check if message is trivial
    const isTrivial = TRIVIAL_MESSAGES.some(t => clean.toLowerCase() === t);
    
    if (!clean || isTrivial) {
      return 'Nouvelle discussion';
    }

    // Truncate to 40-60 reasonably
    if (clean.length <= 50) return clean;
    
    return clean.substring(0, 47) + '...';
  },

  /**
   * Generate UUID v4 for local IDs
   */
  generateId: (): string => {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
};
