import { OFFICIAL_LOGO_DATA_URL } from './logoConstant';

// Helper para garantir URLs corretas de assets estáticos em qualquer ambiente (GitHub Pages com basePath, Cloud Run ou Local)
export function getAssetUrl(path: string): string {
  if (!path) return OFFICIAL_LOGO_DATA_URL;
  
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Para o logo oficial, retorna o Data URL incorporado (zero requisições de rede, 100% de sucesso)
  if (path === '/logo.svg' || path === 'logo.svg') {
    return OFFICIAL_LOGO_DATA_URL;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname || '';
    if (pathname.startsWith('/CRM-Juan')) {
      return `/CRM-Juan${cleanPath}`;
    }
  }

  const isGithubActions = typeof process !== 'undefined' && process.env.GITHUB_ACTIONS === 'true';
  const basePath = isGithubActions ? '/CRM-Juan' : '';

  return `${basePath}${cleanPath}`;
}
