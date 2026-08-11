-- Esquema de Supabase para Ruiz Automotores (Plan Rombo)
-- Corré este archivo completo en el SQL Editor de tu proyecto de Supabase
-- (https://app.supabase.com -> tu proyecto -> SQL Editor -> New query -> pegar y ejecutar).

-- ============================================================
-- TABLA: cartera_clientes
-- Base general de suscriptores (Base General + Carga Múltiple del Panel Admin).
-- ============================================================
create table if not exists cartera_clientes (
  grupo_orden text primary key,
  dni text default '',
  nombre text default '',
  telefono text default '',
  estado text default 'Ahorrista',
  updated_at timestamptz not null default now()
);

create index if not exists idx_cartera_clientes_dni on cartera_clientes (dni);

-- ============================================================
-- TABLA: adjudicados
-- Reporte SAP de Adjudicados (Panel Admin -> pestaña "Actos y Adjudicados").
-- ============================================================
create table if not exists adjudicados (
  grupo_orden text primary key,
  fecha_adjudicacion text default '',
  modalidad_ganadora text default '',
  modelo_suscripto text default '',
  modelo_adjudicado text default '',
  titular text default '',
  domicilio text default '',
  localidad text default '',
  codigo_postal text default '',
  provincia text default '',
  estado_adjudicacion text default '',
  codigo_pin text default '',
  email text default '',
  updated_at timestamptz not null default now()
);

-- Mantiene "updated_at" al día en cada upsert, sin que el código de la app tenga
-- que preocuparse por eso.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cartera_clientes_updated_at on cartera_clientes;
create trigger trg_cartera_clientes_updated_at
  before update on cartera_clientes
  for each row execute function set_updated_at();

drop trigger if exists trg_adjudicados_updated_at on adjudicados;
create trigger trg_adjudicados_updated_at
  before update on adjudicados
  for each row execute function set_updated_at();

-- ============================================================
-- SEGURIDAD (RLS)
--
-- ⚠️ IMPORTANTE — leé esto antes de usar datos reales de clientes:
-- Esta app es 100% client-side: el navegador del admin y el del cliente hablan
-- directo con Supabase usando la clave "anon" pública (VITE_SUPABASE_ANON_KEY),
-- que queda visible en el bundle JS de la web. No hay una sesión de usuario real
-- detrás del login "ADMIN" del panel — es solo una comparación de texto en el
-- frontend, no una autenticación real de Supabase.
--
-- Las políticas de abajo habilitan RLS pero permiten lectura y escritura anónima
-- completa en ambas tablas, para que el prototipo funcione end-to-end tal como
-- está pedido. Eso significa que CUALQUIERA que tenga la URL y la anon key del
-- proyecto (visibles en el código fuente de la página) puede leer y modificar
-- TODOS los DNI, teléfonos, domicilios y emails de la tabla.
--
-- Antes de cargar clientes reales en este esquema, como mínimo:
--   1. Agregá autenticación real (Supabase Auth) para el Panel Admin, y restringí
--      los INSERT/UPDATE/DELETE a usuarios autenticados con ese rol.
--   2. Para el login del cliente, reemplazá el SELECT abierto por una Postgres
--      function (RPC) con `security definer` que reciba el DNI/Grupo y Orden y
--      devuelva sólo esa fila, en vez de exponer la tabla completa.
-- ============================================================

alter table cartera_clientes enable row level security;
alter table adjudicados enable row level security;

drop policy if exists "cartera_clientes_anon_all" on cartera_clientes;
create policy "cartera_clientes_anon_all"
  on cartera_clientes
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "adjudicados_anon_all" on adjudicados;
create policy "adjudicados_anon_all"
  on adjudicados
  for all
  to anon
  using (true)
  with check (true);
