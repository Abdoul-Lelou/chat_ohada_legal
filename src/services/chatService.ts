/**
 * 🚀 Chat Service Layer
 * Handles API communication, stream processing, and store updates.
 */

import { useChatStore } from '@/store/useChatStore';

export const chatService = {
  /**
   * AI-powered auto-titling enhancement
   */
  async generateSmartTitle(conversationId: string, firstMessage: string) {
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstMessage })
      });
      if (res.ok) {
        const { title } = await res.json();
        if (title) {
          useChatStore.getState().updateTitle(conversationId, title);
        }
      }
    } catch (error) {
      console.error('Failed to generate smart title:', error);
    }
  },

  /**
   * Sends a message and processes the stream with ID isolation
   */
  async sendMessage(conversationId: string, messages: any[]) {
    const store = useChatStore.getState();
    const assistantMsgId = Date.now().toString();

    // 🧠 AI Auto-Title Enhancement (Bonus)
    // If the conversation title is generic, upgrade it using AI
    const conv = store.conversations.find(c => c.id === conversationId);
    if (conv && (conv.title === 'Nouvelle discussion' || !conv.title)) {
      this.generateSmartTitle(conversationId, messages[messages.length - 1].content);
    }

    try {
      store.setStreaming(true);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          conversationId
        })
      });

      if (!res.ok) throw new Error('Erreur réseau');

      // 🔍 Extract sources from headers
      const sourcesBase64 = res.headers.get('X-Sources');
      let citedSources = [];
      if (sourcesBase64) {
        try {
          citedSources = JSON.parse(atob(sourcesBase64));
        } catch (e) {
          console.error("Failed to parse sources", e);
        }
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (!reader) throw new Error('Pas de stream');

      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          useChatStore.getState().updateStreamingMessage(
            conversationId, 
            assistantMsgId, 
            chunk, 
            citedSources
          );
        }
      }

    } catch (err: any) {
      console.error('Service Chat Error:', err);
      useChatStore.getState().addMessage(conversationId, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ **Erreur** : ${err.message}`
      });
    } finally {
      useChatStore.getState().setStreaming(false);
    }
  }
};
