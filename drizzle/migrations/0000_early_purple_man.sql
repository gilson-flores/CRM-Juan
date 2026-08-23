CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'pf' NOT NULL,
	"name" text NOT NULL,
	"doc" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"cep" text,
	"address" text,
	"neighborhood" text,
	"city" text,
	"state" text,
	"complement" text,
	"created_at" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orcamentos" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"client_name" text NOT NULL,
	"address" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric DEFAULT '0' NOT NULL,
	"discount" numeric DEFAULT '0' NOT NULL,
	"total" numeric DEFAULT '0' NOT NULL,
	"observations" text,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
