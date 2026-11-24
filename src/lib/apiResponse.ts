function extractNonJsonHint(rawText: string): string {
  const text = rawText.trim();
  if (!text) return '';

  const vercelCodeMatch = text.match(
    /\b(FUNCTION_INVOCATION_FAILED|FUNCTION_INVOCATION_TIMEOUT|FUNCTION_PAYLOAD_TOO_LARGE|EDGE_FUNCTION_INVOCATION_FAILED|MIDDLEWARE_INVOCATION_FAILED|GATEWAY_TIMEOUT)\b/
  );
  if (vercelCodeMatch) {
    return vercelCodeMatch[1];
  }

  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]?.trim()) {
    return titleMatch[1].trim().slice(0, 100);
  }

  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.slice(0, 100);
}

export async function parseApiJsonResponse<T extends Record<string, unknown>>(
  res: Response,
  endpointName: string,
  fallbackErrorPrefix: string,
  includeRetryHint = true
): Promise<T> {
  const rawText = await res.text();
  if (!rawText) {
    if (!res.ok) {
      throw new Error(
        `${fallbackErrorPrefix} (HTTP ${res.status}).${includeRetryHint ? ' Please tap Retry.' : ''}`
      );
    }
    return {} as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    console.error(`[CRICKIFY API Error] ${endpointName} HTTP ${res.status}:`, rawText.slice(0, 400));
    const hint = extractNonJsonHint(rawText);
    if (!res.ok) {
      throw new Error(
        `${fallbackErrorPrefix} (HTTP ${res.status}${hint ? `: ${hint}` : ''}).${includeRetryHint ? ' Please tap Retry.' : ''}`
      );
    }
    throw new Error(
      `${fallbackErrorPrefix} returned an unexpected response${hint ? ` (${hint})` : ''}.${includeRetryHint ? ' Please tap Retry.' : ''}`
    );
  }
}
