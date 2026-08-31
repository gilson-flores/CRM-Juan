// Helper para garantir URLs corretas de assets estáticos em qualquer ambiente (GitHub Pages com basePath, Cloud Run ou Local)
export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // No build do GitHub Actions ou com basePath definido, ajustamos o prefixo
  const isGithubActions = typeof process !== 'undefined' && process.env.GITHUB_ACTIONS === 'true';
  const basePath = isGithubActions ? '/CRM-Juan' : '';

  return `${basePath}${cleanPath}`;
}
