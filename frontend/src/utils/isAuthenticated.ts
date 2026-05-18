const ACCESS_TOKEN_KEYS = ['access_token', 'loophack_access_token', 'token'] as const;

function getStoredAccessToken(): string | null {
  for (const key of ACCESS_TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) {
      return token;
    }
  }

  return null;
}

export function isAuthenticated(): boolean {
  const token = getStoredAccessToken();
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.exp) {
      return false;
    }

    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}