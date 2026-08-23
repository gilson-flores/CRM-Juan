import { db } from '@/src/db';
import { clients, orcamentos } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getClientsAction() {
  if (!db) return [];
  try {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  } catch (error) {
    console.error('Erro ao buscar clientes no Neon:', error);
    return [];
  }
}

export async function saveClientAction(clientData: {
  id: string;
  type: 'pf' | 'pj';
  name: string;
  doc: string;
  phone: string;
  email?: string;
  cep?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  complement?: string;
  createdAt: string;
}) {
  if (!db) return { success: false, error: 'Database not connected' };
  try {
    await db
      .insert(clients)
      .values(clientData)
      .onConflictDoUpdate({
        target: clients.id,
        set: {
          ...clientData,
          updatedAt: new Date()
        }
      });

    revalidatePath('/clientes');
    revalidatePath('/orcamentos');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar cliente no Neon:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteClientAction(id: string) {
  if (!db) return { success: false, error: 'Database not connected' };
  try {
    await db.delete(clients).where(eq(clients.id, id));
    revalidatePath('/clientes');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir cliente no Neon:', error);
    return { success: false, error: String(error) };
  }
}

export async function saveOrcamentoAction(orcamentoData: {
  id: string;
  clientId?: string;
  clientName: string;
  address?: string;
  items: any[];
  subtotal: number;
  discount: number;
  total: number;
  observations?: string;
  status?: string;
  createdAt: string;
}) {
  if (!db) return { success: false, error: 'Database not connected' };
  try {
    await db
      .insert(orcamentos)
      .values({
        ...orcamentoData,
        subtotal: orcamentoData.subtotal.toString(),
        discount: orcamentoData.discount.toString(),
        total: orcamentoData.total.toString(),
        status: orcamentoData.status || 'rascunho'
      })
      .onConflictDoUpdate({
        target: orcamentos.id,
        set: {
          ...orcamentoData,
          subtotal: orcamentoData.subtotal.toString(),
          discount: orcamentoData.discount.toString(),
          total: orcamentoData.total.toString(),
          updatedAt: new Date()
        }
      });

    revalidatePath('/orcamentos');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar orçamento no Neon:', error);
    return { success: false, error: String(error) };
  }
}
