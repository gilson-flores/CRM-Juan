export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Formata uma string para o padrão de CEP (99999-999).
 */
export function formatCep(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 5) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return clean;
}

/**
 * Consulta a API pública do ViaCEP para preenchimento automático de endereço.
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResult | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.erro) return null;
    return data as ViaCepResult;
  } catch (error) {
    console.warn('Erro ao consultar ViaCEP:', error);
    return null;
  }
}
