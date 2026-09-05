export function isAdminToken(token: string): boolean {
  return tokenGameId(token) === null;
}

function tokenGameId(token: string): string | null {
  try {
    let payload = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payload.length % 4;
    if (pad) payload += '='.repeat(4 - pad);
    const json = JSON.parse(atob(payload));
    return json.gameId ?? null;
  } catch {
    return null;
  }
}

export function gmToken(gameId?: string): string {
  if (gameId) {
    const perGame = localStorage.getItem(`gmToken:${gameId}`);
    if (perGame && tokenGameId(perGame) === gameId) return perGame;
  }
  const fallback = localStorage.getItem('gmToken');
  if (fallback) {
    const fallbackGameId = tokenGameId(fallback);
    if (!fallbackGameId || (gameId && fallbackGameId === gameId)) return fallback;
  }
  return '';
}

export function setGmToken(gameId: string, token: string) {
  localStorage.setItem(`gmToken:${gameId}`, token);
}

export function setAdminToken(token: string) {
  localStorage.setItem('gmToken', token);
}
