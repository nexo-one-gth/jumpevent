-- ============================================================
-- JUMPING EVENTS · Schema inicial
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLA: eventos ──────────────────────────────────────────
CREATE TABLE eventos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                TEXT NOT NULL,
  fecha                 TIMESTAMPTZ NOT NULL,
  lugar                 TEXT NOT NULL,
  descripcion           TEXT,
  precio                INTEGER NOT NULL DEFAULT 5000,
  alias_transferencia   TEXT NOT NULL DEFAULT 'jumping.eventos',
  cvu                   TEXT,
  wa_comprobantes       TEXT,
  flyer_url             TEXT,
  min_alumnos_gratis    INTEGER NOT NULL DEFAULT 6,
  -- Contenido post-evento
  contenido_activo      BOOLEAN DEFAULT FALSE,
  link_fotos            TEXT,
  link_video            TEXT,
  link_tracks           TEXT,
  -- Control
  activo                BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: profesores (globales, reutilizables) ─────────────
CREATE TABLE profesores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  instagram   TEXT,
  tiktok      TEXT,
  telefono    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: evento_profesores (asignación por evento) ────────
CREATE TABLE evento_profesores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  profesor_id   UUID NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  -- Link personalizable por evento
  slug          TEXT NOT NULL,
  -- Ticket del profe
  ticket_estado TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (ticket_estado IN ('pendiente', 'confirmado', 'gratis')),
  ticket_token  UUID DEFAULT gen_random_uuid(),
  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  -- Restricciones
  UNIQUE (evento_id, profesor_id),
  UNIQUE (evento_id, slug)
);

-- ── TABLA: asistentes ────────────────────────────────────────
CREATE TABLE asistentes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id           UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  evento_profesor_id  UUID REFERENCES evento_profesores(id) ON DELETE SET NULL,
  -- Datos personales
  nombre              TEXT NOT NULL,
  email               TEXT NOT NULL,
  telefono            TEXT,
  -- Pago
  metodo_pago         TEXT NOT NULL
                      CHECK (metodo_pago IN ('MercadoPago', 'Transferencia', 'Efectivo')),
  estado              TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente', 'confirmado', 'efectivo')),
  codigo_referencia   TEXT UNIQUE,
  confirmado_at       TIMESTAMPTZ,
  -- QR único
  qr_token            TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  -- Asistencia el día del evento
  asistio             BOOLEAN DEFAULT FALSE,
  asistio_at          TIMESTAMPTZ,
  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: scanner_pins ──────────────────────────────────────
CREATE TABLE scanner_pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  pin         TEXT NOT NULL,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES para performance ─────────────────────────────────
CREATE INDEX idx_asistentes_evento          ON asistentes(evento_id);
CREATE INDEX idx_asistentes_qr_token        ON asistentes(qr_token);
CREATE INDEX idx_asistentes_estado          ON asistentes(estado);
CREATE INDEX idx_evento_profesores_evento   ON evento_profesores(evento_id);
CREATE INDEX idx_evento_profesores_slug     ON evento_profesores(slug);

-- ── FUNCIÓN: updated_at automático ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profesores_updated_at
  BEFORE UPDATE ON profesores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── FUNCIÓN: verificar entrada gratis ───────────────────────
-- Se llama desde la app al confirmar un asistente.
-- Si el profe acumuló min_alumnos_gratis, su ticket_estado pasa a 'gratis'.
CREATE OR REPLACE FUNCTION verificar_entrada_gratis(p_evento_profesor_id UUID)
RETURNS VOID AS $$
DECLARE
  v_evento_id       UUID;
  v_min_alumnos     INTEGER;
  v_total_alumnos   INTEGER;
BEGIN
  -- Obtener evento y mínimo configurado
  SELECT ep.evento_id, e.min_alumnos_gratis
    INTO v_evento_id, v_min_alumnos
    FROM evento_profesores ep
    JOIN eventos e ON e.id = ep.evento_id
   WHERE ep.id = p_evento_profesor_id;

  -- Contar alumnos confirmados + efectivo de ese profe
  SELECT COUNT(*)
    INTO v_total_alumnos
    FROM asistentes
   WHERE evento_profesor_id = p_evento_profesor_id
     AND estado IN ('confirmado', 'efectivo');

  -- Actualizar si alcanzó el mínimo
  IF v_total_alumnos >= v_min_alumnos THEN
    UPDATE evento_profesores
       SET ticket_estado = 'gratis'
     WHERE id = p_evento_profesor_id
       AND ticket_estado = 'pendiente';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE eventos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistentes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_pins      ENABLE ROW LEVEL SECURITY;

-- Políticas: solo el service role (admin) escribe, anon solo lee lo necesario
CREATE POLICY "service_role_all_eventos"
  ON eventos FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_profesores"
  ON profesores FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_evento_profesores"
  ON evento_profesores FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_asistentes"
  ON asistentes FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_scanner_pins"
  ON scanner_pins FOR ALL TO service_role USING (true);

-- Anon: puede leer evento_profesores (para mostrar el form público por slug)
CREATE POLICY "anon_read_evento_profesores"
  ON evento_profesores FOR SELECT TO anon USING (true);

-- Anon: puede leer eventos activos (para mostrar info en el form)
CREATE POLICY "anon_read_eventos_activos"
  ON eventos FOR SELECT TO anon USING (activo = true);

-- Anon: puede insertar asistentes (inscripción pública)
CREATE POLICY "anon_insert_asistentes"
  ON asistentes FOR INSERT TO anon WITH CHECK (true);

-- Anon: puede leer su propio ticket por token
CREATE POLICY "anon_read_ticket_by_token"
  ON asistentes FOR SELECT TO anon
  USING (true);

-- ── DATOS INICIALES DE PRUEBA ────────────────────────────────
INSERT INTO eventos (nombre, fecha, lugar, precio, alias_transferencia, wa_comprobantes, activo)
VALUES (
  'Jumping Master Class',
  '2025-06-14 10:00:00-03',
  'Club Atlético Morón, Salón Principal',
  5000,
  'jumping.eventos',
  '5491145678900',
  true
);

INSERT INTO profesores (nombre, instagram, tiktok, telefono) VALUES
  ('Luciana Méndez',  '@lu.jump',       '@lumendez',    '1145678901'),
  ('Carla Duarte',    '@carla.fitness',  '@carladuarte', '1156789012'),
  ('Romina Torres',   '@romi.jump',      '@romifit',     '1167890123'),
  ('Sofía Beltrán',   '@sofi.b',         '@sofiajump',   '1178901234');
