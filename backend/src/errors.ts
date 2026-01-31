/**
 * User-friendly API error messages when tokens run out or keys are invalid.
 */

function getStatus(err: unknown): number | undefined {
  const e = err as { status?: number; statusCode?: number; code?: number };
  return e?.status ?? e?.statusCode ?? e?.code;
}

export function messageForGroqError(err: unknown): string {
  const status = getStatus(err);
  const msg = (err as Error)?.message ?? '';
  if (status === 401 || /invalid|unauthorized|api.key|authentication/i.test(msg)) {
    return 'Groq API key invalid or expired. Check GROQ_API_KEY in backend/.env';
  }
  if (status === 429 || /rate.limit|quota|limit.exceeded/i.test(msg)) {
    return 'Groq rate limit or quota exceeded. Try again later or check your plan at console.groq.com';
  }
  return `Groq error: ${msg || 'Check your API key and quota.'}`;
}

export function messageForElevenLabsError(statusCode: number, body: string): string {
  if (statusCode === 401) {
    return 'ElevenLabs API key invalid or expired. Check ELEVENLABS_API_KEY in backend/.env';
  }
  if (statusCode === 429) {
    return 'ElevenLabs quota or rate limit exceeded. Try again later or check your plan at elevenlabs.io';
  }
  try {
    const j = JSON.parse(body);
    const detail = j?.detail?.message ?? j?.message ?? body;
    return `ElevenLabs error: ${detail}`;
  } catch {
    return `ElevenLabs error (${statusCode}). Check your API key and quota.`;
  }
}
