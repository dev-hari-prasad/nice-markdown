import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

// Convert UI messages (with parts array) to model messages (with content string)
function convertMessages(messages: any[]): any[] {
  if (!messages || !Array.isArray(messages)) return [];
  
  return messages.map(msg => {
    // If already has content as string, return as-is
    if (typeof msg.content === 'string') {
      return { role: msg.role, content: msg.content };
    }
    
    // If has parts array (UI message format), extract text
    if (Array.isArray(msg.parts)) {
      const textContent = msg.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      return { role: msg.role, content: textContent };
    }
    
    // If content is array, extract text parts
    if (Array.isArray(msg.content)) {
      const textContent = msg.content
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      return { role: msg.role, content: textContent };
    }
    
    // Fallback
    return { role: msg.role, content: '' };
  });
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  // Extract values from body, headers, or anywhere possible
  const headerApiKey = req.headers.get('Authorization')?.replace('Bearer ', '') || 
                       req.headers.get('X-API-Key') || 
                       req.headers.get('x-api-key');
  
  const headerBaseUrl = req.headers.get('X-Base-URL') || 
                        req.headers.get('x-base-url') || 
                        req.headers.get('X-Base-Url');
  
  const headerModel = req.headers.get('X-Model') || 
                      req.headers.get('x-model');

  const finalApiKey = body.apiKey || body.api_key || body.key || headerApiKey;
  const finalBaseUrl = body.baseUrl || body.baseURL || body.base_url || headerBaseUrl || 'https://api.openai.com/v1';
  const finalModel = body.model || body.modelId || headerModel || 'gpt-4o';
  const finalSystemPrompt = body.systemPrompt || body.system_prompt || 'You are a helpful assistant.';

  if (!finalApiKey || finalApiKey === 'null' || finalApiKey === 'undefined') {
    return new Response('API Key is required. Please check your AI settings in the chat interface.', { 
      status: 400,
      headers: { 'X-Error-Reason': 'Missing API Key' }
    });
  }

  const openai = createOpenAI({
    apiKey: finalApiKey,
    baseURL: finalBaseUrl,
  });

  const languageModel = openai(finalModel);

  // Convert UI messages to model messages format
  const modelMessages = convertMessages(body.messages || []);

  const result = streamText({
    model: languageModel,
    messages: modelMessages,
    system: finalSystemPrompt,
  });

  return result.toUIMessageStreamResponse();
}
