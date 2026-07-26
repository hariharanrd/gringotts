import { BASE_URL, fetchWithCredentials, handleResponse } from './common';
import { GoblinParseResult } from '../../types';

export const aiApi = {
  parseTransactionWithGoblin: async (
    userMessage: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<GoblinParseResult> => {
    const response = await fetchWithCredentials(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: userMessage,
        chatHistory: chatHistory
      })
    });
    const data = await handleResponse(response);
    return {
      goblinResponse: data.goblinResponse || data.goblin_response || '',
      actionPayload: data.actionPayload || data.action_payload || {}
    };
  }
};
