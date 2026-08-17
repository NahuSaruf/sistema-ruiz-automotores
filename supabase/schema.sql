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

-- ============================================================
-- TABLA: grupos_invitados
-- Reporte real "Grupos Invitados Acto <N>" (Panel Admin -> pestaña "Licitaciones"):
-- qué Grupo y Orden está invitado a licitar en qué acto. Reemplaza el flag
-- `grupoHabilitadoLicitacion` que antes estaba hardcodeado en el panel del
-- cliente — si su grupo_orden aparece acá, está habilitado; si no, no.
-- Clave primaria compuesta (acto, grupo_orden) porque el mismo grupo puede
-- aparecer invitado en distintos actos a lo largo del tiempo.
-- ============================================================
create table if not exists grupos_invitados (
  acto text not null,
  grupo_orden text not null,
  fecha_web text default '',
  titular text default '',
  porcentaje_financia text default '',
  modelo text default '',
  oferta_comercial text default '',
  ultima_cuota text default '',
  cuota_licitacion text default '',
  updated_at timestamptz not null default now(),
  primary key (acto, grupo_orden)
);

create index if not exists idx_grupos_invitados_grupo_orden on grupos_invitados (grupo_orden);

-- ============================================================
-- TABLA: condiciones_comerciales
-- Fila única (id=1) con el catálogo comercial completo — precios de lista, cuota 1,
-- modalidad/plazo, ficha técnica y bonificación/vigencia de cada uno de los 9
-- modelos, más el título/descripción de la promo del mes — serializado como JSON en
-- `data`. Es la misma configuración que localStorage guarda bajo la clave
-- "condiciones_comerciales_ruiz" (ver src/utils/condicionesComerciales.ts): esta
-- tabla es sólo el respaldo en la nube, para que ese catálogo se sincronice entre
-- dispositivos en vez de vivir sólo en el navegador de quien lo cargó.
-- ============================================================
create table if not exists condiciones_comerciales (
  id int primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint condiciones_comerciales_fila_unica check (id = 1)
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

drop trigger if exists trg_grupos_invitados_updated_at on grupos_invitados;
create trigger trg_grupos_invitados_updated_at
  before update on grupos_invitados
  for each row execute function set_updated_at();

drop trigger if exists trg_condiciones_comerciales_updated_at on condiciones_comerciales;
create trigger trg_condiciones_comerciales_updated_at
  before update on condiciones_comerciales
  for each row execute function set_updated_at();

-- ============================================================
-- TABLA: admins
-- Lista blanca de usuarios de Supabase Auth con rol de Administrador de la
-- agencia. Vacía por defecto: nadie puede escribir en cartera_clientes ni
-- adjudicados hasta que se registre acá el UID de una cuenta real.
--
-- Cómo dar de alta al primer administrador:
--   1. Creá la cuenta desde el Dashboard de Supabase: Authentication -> Users ->
--      Add user (o dejá que se registre y confirmá el email), con el email y
--      contraseña que va a usar para entrar al Panel Admin del sitio.
--   2. Copiá su UID (columna "User UID" en esa misma pantalla) y ejecutá:
--        insert into admins (user_id, email) values ('<UID-copiado>', '<email>');
-- ============================================================
create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text default '',
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Devuelve true si el usuario autenticado actual (auth.uid()) es Administrador
-- de la agencia. `security definer` + `search_path` fijo para que la función
-- pueda leer `admins` sin importar las políticas RLS del que la llama (evita el
-- problema del huevo y la gallina con la policy de abajo), y sin quedar expuesta
-- a un search_path hostil.
create or replace function is_admin_ruiz()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where user_id = auth.uid()
  );
$$;

-- Sólo un administrador ya autenticado puede ver la lista blanca (por ejemplo,
-- para que el panel muestre quién más tiene acceso); nadie puede escribirla
-- desde el cliente — altas/bajas de administradores se hacen a mano por SQL.
drop policy if exists "admins_read_self_or_admin" on admins;
drop policy if exists "admins_read_admin_only" on admins;
create policy "admins_read_admin_only"
  on admins
  for select
  to authenticated
  using (is_admin_ruiz());

-- ============================================================
-- SEGURIDAD (RLS) — cartera_clientes, adjudicados, grupos_invitados y condiciones_comerciales
--
-- ⚠️ IMPORTANTE — leé esto antes de usar datos reales de clientes:
-- Esta app es 100% client-side: el navegador del admin y el del cliente hablan
-- directo con Supabase usando la clave "anon" pública (VITE_SUPABASE_ANON_KEY),
-- que queda visible en el bundle JS de la web.
--
-- LECTURA de `cartera_clientes` y `adjudicados`: YA NO es de tabla abierta a
-- `anon` (antes cualquiera con la anon key podía leer todos los DNI, teléfonos,
-- domicilios y emails con un SELECT sin filtro). El buscador de autoservicio del
-- cliente (DNI o Grupo y Orden, en App.tsx vía buscarClienteEnNube/
-- buscarAdjudicadoEnNube en src/lib/supabase.ts) ahora pasa por las funciones
-- `security definer` `buscar_cliente_publico(p_query)` / `buscar_adjudicado_publico
-- (p_grupo_orden)` más abajo: corren con privilegios elevados así que sí pueden
-- leer la tabla, pero cada una sólo devuelve la fila puntual que matchea el
-- parámetro que reciben — nunca la tabla entera. `anon` sigue sin poder hacer
-- SELECT directo sobre estas dos tablas; sólo `authenticated` (el panel de Admin,
-- ya logueado) puede.
--
-- `grupos_invitados` y `condiciones_comerciales` SÍ siguen con SELECT abierto a
-- `anon` a propósito (ver sus comentarios puntuales más abajo): no contienen DNI/
-- teléfono/domicilio, sólo grupo+acto+fecha y el catálogo público de precios.
--
-- ESCRITURA: sigue requiriendo una sesión real de Supabase Auth (`to authenticated`)
-- Y que ese usuario figure en la tabla `admins` (`is_admin_ruiz()`). Un usuario
-- autenticado que no sea administrador no puede insertar/actualizar/borrar nada.
-- ============================================================

alter table cartera_clientes enable row level security;
alter table adjudicados enable row level security;
alter table grupos_invitados enable row level security;
alter table condiciones_comerciales enable row level security;

drop policy if exists "cartera_clientes_anon_all" on cartera_clientes;

-- Sólo `authenticated` (Admin ya logueado) puede leer la tabla entera con SELECT.
-- El buscador anónimo del cliente pasa por buscar_cliente_publico() más abajo.
drop policy if exists "cartera_clientes_read_all" on cartera_clientes;
drop policy if exists "cartera_clientes_read_authenticated" on cartera_clientes;
create policy "cartera_clientes_read_authenticated"
  on cartera_clientes
  for select
  to authenticated
  using (true);

drop policy if exists "cartera_clientes_write_admin" on cartera_clientes;
create policy "cartera_clientes_write_admin"
  on cartera_clientes
  for insert
  to authenticated
  with check (is_admin_ruiz());

drop policy if exists "cartera_clientes_update_admin" on cartera_clientes;
create policy "cartera_clientes_update_admin"
  on cartera_clientes
  for update
  to authenticated
  using (is_admin_ruiz())
  with check (is_admin_ruiz());

drop policy if exists "cartera_clientes_delete_admin" on cartera_clientes;
create policy "cartera_clientes_delete_admin"
  on cartera_clientes
  for delete
  to authenticated
  using (is_admin_ruiz());

drop policy if exists "adjudicados_anon_all" on adjudicados;

-- Sólo `authenticated` (Admin ya logueado) puede leer la tabla entera con SELECT.
-- El buscador anónimo del cliente pasa por buscar_adjudicado_publico() más abajo.
drop policy if exists "adjudicados_read_all" on adjudicados;
drop policy if exists "adjudicados_read_authenticated" on adjudicados;
create policy "adjudicados_read_authenticated"
  on adjudicados
  for select
  to authenticated
  using (true);

drop policy if exists "adjudicados_write_admin" on adjudicados;
create policy "adjudicados_write_admin"
  on adjudicados
  for insert
  to authenticated
  with check (is_admin_ruiz());

drop policy if exists "adjudicados_update_admin" on adjudicados;
create policy "adjudicados_update_admin"
  on adjudicados
  for update
  to authenticated
  using (is_admin_ruiz())
  with check (is_admin_ruiz());

drop policy if exists "adjudicados_delete_admin" on adjudicados;
create policy "adjudicados_delete_admin"
  on adjudicados
  for delete
  to authenticated
  using (is_admin_ruiz());

-- ============================================================
-- BÚSQUEDA PÚBLICA PUNTUAL (security definer) — reemplaza el SELECT abierto
-- que antes tenían cartera_clientes/adjudicados. Cada función corre con
-- privilegios elevados (bypassa RLS) pero su propio WHERE + LIMIT 1 garantiza
-- que como máximo devuelve UNA fila, la que matchea el parámetro recibido —
-- nunca la tabla entera. Usadas por buscarClienteEnNube/buscarAdjudicadoEnNube
-- en src/lib/supabase.ts, vía supabase.rpc(...).
-- ============================================================

create or replace function buscar_cliente_publico(p_query text)
returns setof cartera_clientes
language sql
security definer
set search_path = public
stable
as $$
  select *
  from cartera_clientes
  where dni = p_query or grupo_orden = p_query
  limit 1;
$$;

revoke all on function buscar_cliente_publico(text) from public;
grant execute on function buscar_cliente_publico(text) to anon, authenticated;

create or replace function buscar_adjudicado_publico(p_grupo_orden text)
returns setof adjudicados
language sql
security definer
set search_path = public
stable
as $$
  select *
  from adjudicados
  where grupo_orden = p_grupo_orden
  limit 1;
$$;

revoke all on function buscar_adjudicado_publico(text) from public;
grant execute on function buscar_adjudicado_publico(text) to anon, authenticated;

-- grupos_invitados: lectura abierta (el cliente necesita poder chequear si su
-- grupo está habilitado para licitar sin estar autenticado); escritura sólo Admin.
drop policy if exists "grupos_invitados_read_all" on grupos_invitados;
create policy "grupos_invitados_read_all"
  on grupos_invitados
  for select
  to anon, authenticated
  using (true);

drop policy if exists "grupos_invitados_write_admin" on grupos_invitados;
create policy "grupos_invitados_write_admin"
  on grupos_invitados
  for insert
  to authenticated
  with check (is_admin_ruiz());

drop policy if exists "grupos_invitados_update_admin" on grupos_invitados;
create policy "grupos_invitados_update_admin"
  on grupos_invitados
  for update
  to authenticated
  using (is_admin_ruiz())
  with check (is_admin_ruiz());

drop policy if exists "grupos_invitados_delete_admin" on grupos_invitados;
create policy "grupos_invitados_delete_admin"
  on grupos_invitados
  for delete
  to authenticated
  using (is_admin_ruiz());

-- condiciones_comerciales: lectura abierta (el Catálogo, la Vitrina y el Estado de
-- Cuenta del cliente la leen sin estar autenticado); escritura sólo Administrador.
drop policy if exists "condiciones_comerciales_read_all" on condiciones_comerciales;
create policy "condiciones_comerciales_read_all"
  on condiciones_comerciales
  for select
  to anon, authenticated
  using (true);

drop policy if exists "condiciones_comerciales_write_admin" on condiciones_comerciales;
create policy "condiciones_comerciales_write_admin"
  on condiciones_comerciales
  for insert
  to authenticated
  with check (is_admin_ruiz());

drop policy if exists "condiciones_comerciales_update_admin" on condiciones_comerciales;
create policy "condiciones_comerciales_update_admin"
  on condiciones_comerciales
  for update
  to authenticated
  using (is_admin_ruiz())
  with check (is_admin_ruiz());
