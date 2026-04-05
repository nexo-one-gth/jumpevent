# Jumping Events — Contexto para Claude Code

## Qué es este proyecto

Sistema de gestión de eventos de Jumping Master Class para una organizadora en Argentina.
Permite gestionar profes invitados, inscripción de alumnos, cobro de entradas, 
control de asistencia con QR y acceso a contenido post-evento.

---

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend + Backend | Next.js 16 App Router + TypeScript | Vercel free tier |
| Base de datos | Supabase (PostgreSQL) | Free tier |
| Auth admin | Supabase Auth | Solo la organizadora |
| Email | Resend | Free: 3.000/mes |
| WhatsApp | Evolution API (ya en uso en otros proyectos) | Fallback a link wa.me manual |
| QR | `qrcode` (gen) + `html5-qrcode` (scan) | Sin app nativa |
| Estilos | Tailwind CSS | Estética iOS nativa |

---

## Decisiones de diseño tomadas (no cambiar sin consultar)

### Modelo de datos
- **Multi-evento**: la DB soporta múltiples eventos, pero la UI solo muestra el evento activo
- **Profesores**: tabla global reutilizable entre eventos
- **Slug del link de inscripción**: lo define la organizadora al asignar el profe a un evento, NO se genera solo del nombre
- **Tabla intermedia** `evento_profesores`: une profes con eventos y guarda el slug personalizado

### Reglas de negocio
- Profes con **6 o más alumnos confirmados** en un evento → entrada gratis automática
- La función SQL `verificar_entrada_gratis()` se llama desde las API routes cada vez que se confirma un pago
- Scanner QR protegido con **PIN simple** que la organizadora comparte por WhatsApp el día del evento

### Pagos (mixto, confirmación manual)
- **Transferencia**: alias + monto + código de referencia único → botón WhatsApp con comprobante pre-armado
- **MercadoPago**: confirmación manual por la organizadora (sin integración automática por ahora)
- **Efectivo**: estado `efectivo` desde el momento de la inscripción
- MercadoPago automático queda para una segunda fase

### Envío del ticket al confirmar pago
1. **Email** via Resend (siempre) — incluye QR como imagen adjunta
2. **WhatsApp** — dos modos:
   - `automatico`: Evolution API lo envía solo si está configurado
   - `manual`: el panel muestra botón wa.me pre-armado para que la organizadora lo mande con un tap

---

## Estética iOS nativa (obligatorio en todas las pantallas)

```
Fuente:     -apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Helvetica Neue'
Fondo app:  #F2F2F7
Cards:      #FFFFFF con border 0.5px rgba(60,60,67,0.12)
Separadores: 0.5px rgba(60,60,67,0.12)

Colores sistema:
  Azul:     #007AFF  (acción principal, links)
  Verde:    #34C759  (confirmado, éxito)
  Naranja:  #FF9500  (pendiente, advertencia)
  Rojo:     #FF3B30  (error, eliminar)
  Púrpura:  #AF52DE  (badges especiales)
  Label:    #000000 / rgba(60,60,67,0.6) / rgba(60,60,67,0.18)

Navegación:
  - NavBar superior con título grande (large title) estilo iOS
  - Tab bar INFERIOR con 4 tabs: Resumen / Profes / Alumnos / Evento
  - Bottom sheets para modales (no centrados en pantalla)
  - Segmented control para filtros

Componentes nativos:
  - Switches iOS (no checkboxes)
  - Celdas tipo Settings con separadores y chevron
  - Grupos de celdas con label uppercase y footer
  - Botones con border-radius: 14px y padding vertical generoso
```

---

## Lo que ya está construido

```
types/index.ts                          — Todos los tipos TypeScript del dominio
lib/supabase/server.ts                  — Cliente Supabase para Server Components y API routes
lib/supabase/client.ts                  — Cliente Supabase para el browser
lib/utils/index.ts                      — generarQRDataURL, generarCodigoReferencia, slugify,
                                          formatearPrecio, formatearFecha, mensajeWAComprobante
lib/email/index.ts                      — enviarTicketPorEmail() via Resend con QR adjunto
lib/whatsapp/index.ts                   — enviarTicketPorWA() con fallback manual,
                                          linkWATicket(), textoComprobantWA()
app/api/inscripcion/route.ts            — POST: registrar alumno en evento por slug
app/api/tickets/confirmar/route.ts      — POST: confirmar pago → email + WhatsApp
app/api/scanner/route.ts                — POST: validar QR con PIN el día del evento
supabase/migrations/001_schema_inicial.sql — Schema completo con RLS y datos de prueba
```

---

## Lo que falta construir (en este orden)

### Fase 1 — Panel admin (organizadora)

**1. Layout admin** `app/(admin)/layout.tsx`
- Tab bar inferior con 4 tabs: Resumen, Profes, Alumnos, Evento
- NavBar superior con título dinámico
- Protección de ruta: solo la organizadora autenticada

**2. Dashboard** `app/(admin)/dashboard/page.tsx`
- Cards 2×2: total inscriptos, confirmados, pendientes, profes gratis
- Barra de progreso general de cobros
- Lista de profes con mini-progress bar por profe

**3. Gestión de profes** `app/(admin)/profes/page.tsx`
- Lista de todos los profes asignados al evento activo
- Badge automático "Entrada gratis 🎟" si tiene 6+ alumnos
- Botón "+" → bottom sheet para agregar profe al evento
  - Buscar profe existente en la DB global O crear nuevo
  - Campo para definir el slug del link (editable, no auto-generado)
  - Preview del link: `jumping.app/inscripcion/[slug]`
- Botón copiar link por profe
- Ver alumnos de ese profe inline

**4. Gestión de alumnos** `app/(admin)/alumnos/page.tsx`
- Buscador + segmented control (Todos / Pendiente / Confirmado / Efectivo)
- Lista agrupada por profe
- Botón "Confirmar pago" → llama a `/api/tickets/confirmar`
- Si WA modo manual → muestra botón wa.me para enviar ticket
- Indicador de si ya se envió el ticket (email ✓ / WA ✓)

**5. Configuración del evento** `app/(admin)/evento/page.tsx`
- Upload del flyer (se guarda en Supabase Storage)
- Editar: nombre, fecha, lugar, precio, alias, WhatsApp comprobantes
- Mínimo alumnos para entrada gratis (default: 6)
- Switch: activar contenido post-evento
- Links de fotos, video, tracks (aparecen cuando el switch está ON)
- PIN del scanner: generar y copiar

**6. Scanner QR** `app/(admin)/scanner/page.tsx`
- Pantalla simple, pensada para el cel
- Input PIN al entrar
- Cámara con html5-qrcode
- Resultado visual grande: ✅ ACCESO OK / ⚠️ YA ESCANEADO / ❌ INVÁLIDO / 💳 PAGO PENDIENTE
- Muestra nombre del asistente y profe al escanear

---

### Fase 2 — Páginas públicas

**7. Formulario de inscripción** `app/inscripcion/[slug]/page.tsx`
- Modo oscuro (como iOS en dark mode)
- Muestra flyer del evento si existe, sino header con gradiente
- Datos del profe (nombre, IG, TikTok)
- Campos: nombre, email, WhatsApp (opcional)
- Selector de método de pago con cards (MP / Transferencia / Efectivo)
- Si Transferencia: muestra alias + monto + código de referencia generado
- Pantalla de éxito con resumen + botón WhatsApp comprobante

**8. Ticket digital** `app/ticket/[token]/page.tsx`
- Modo oscuro
- Header con gradiente con nombre del evento
- QR generado en el cliente con `qrcode`
- Datos del asistente y profe
- Sección bloqueada 🔒 / desbloqueada según `contenido_activo` del evento
- Post-evento desbloqueado: links a fotos, video, tracks, redes de profes

---

## Variables de entorno necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Jumping Events
EVOLUTION_API_URL=          # opcional
EVOLUTION_API_KEY=          # opcional
EVOLUTION_INSTANCE_NAME=    # opcional
```

---

## Convenciones del proyecto

- Todo en **español**: comentarios, nombres de variables, texto de UI, logs
- **Server Components** por defecto; `'use client'` solo cuando se necesita interactividad
- API routes usan `createServiceClient()` (service role, acceso total)
- Páginas públicas usan `createClient()` (anon key, RLS aplica)
- Errores de UI con `react-hot-toast`
- Íconos con `lucide-react`
- Fechas con `date-fns` en locale `es`

---

## Cómo arrancar

```bash
npm install
# Configurar .env.local con las keys de Supabase
npm run dev
```

El schema SQL está en `supabase/migrations/001_schema_inicial.sql`.
Correlo en el SQL Editor de Supabase antes de arrancar.

---

## Prompt para empezar en Claude Code

```
Leé el CLAUDE.md completo. Vamos a construir el proyecto en el orden 
definido en "Lo que falta construir".

Arrancá por el paso 1: Layout admin con tab bar inferior iOS.
Respetá estrictamente la estética iOS definida en el CLAUDE.md.
Cuando termines cada pantalla avisame antes de pasar a la siguiente.
```
