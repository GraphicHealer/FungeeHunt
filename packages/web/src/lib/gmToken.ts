export function gmToken(gameId?: string): string {
  if (gameId) {
    const perGame = localStorage.getItem(`gmToken:${gameId}`);
    if (perGame) return perGame;
  }
  return localStorage.getItem('gmToken') ?? '';
}

export function setGmToken(gameId: string, token: string) {
  localStorage.setItem(`gmToken:${gameId}`, token);
}

export function setAdminToken(token: string) {
  localStorage.setItem('gmToken', token);
}
