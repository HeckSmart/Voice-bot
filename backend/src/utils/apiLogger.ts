/**
 * Centralized API call logging: request (method, URL, body) and response (status, body).
 */

export function logApiCall(
  label: string,
  method: string,
  url: string,
  status: number,
  responseBody: unknown,
  requestBody?: unknown
): void {
  const separator = '─'.repeat(60);
  console.log(`[API] ${label} ${separator}`);
  console.log(`[API] ${label} REQUEST  ${method} ${url}`);
  if (requestBody !== undefined) {
    console.log(`[API] ${label} Request body:`, JSON.stringify(requestBody, null, 2));
  }
  console.log(`[API] ${label} RESPONSE ${status}`);
  console.log(`[API] ${label} Response body:`, JSON.stringify(responseBody, null, 2));
  console.log(`[API] ${label} ${separator}`);
}
