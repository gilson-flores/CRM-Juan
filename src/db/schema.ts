import { pgTable, text, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  type: text('type').notNull().default('pf'), // 'pf' | 'pj'
  name: text('name').notNull(),
  doc: text('doc').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  cep: text('cep'),
  address: text('address'),
  neighborhood: text('neighborhood'),
  city: text('city'),
  state: text('state'),
  complement: text('complement'),
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const orcamentos = pgTable('orcamentos', {
  id: text('id').primaryKey(),
  clientId: text('client_id'),
  clientName: text('client_name').notNull(),
  address: text('address'),
  items: jsonb('items').notNull().default([]),
  subtotal: numeric('subtotal').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  total: numeric('total').notNull().default('0'),
  observations: text('observations'),
  status: text('status').notNull().default('rascunho'), // 'rascunho' | 'aprovado' | 'rejeitado'
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type ClientModel = typeof clients.$inferSelect;
export type NewClientModel = typeof clients.$inferInsert;
export type OrcamentoModel = typeof orcamentos.$inferSelect;
export type NewOrcamentoModel = typeof orcamentos.$inferInsert;
