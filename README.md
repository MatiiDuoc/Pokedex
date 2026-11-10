# Pokédex + Guías

Aplicación web para consultar el Pokédex Nacional y seguir guías de los juegos
principales y spin-offs de Pokémon. Incluye cuentas, progreso sincronizado,
checklists por juego, guías paso a paso y visor 3D.

## Características

- **Inicio renovado** con hero, búsqueda global de Pokémon y guías,
  “Continúa tu aventura”, Pokémon del día, Pokémon destacados, selector de
  juego, legendarios destacados y resumen del equipo.
- **Pokédex Nacional** con las 1025 especies, búsqueda por nombre/número,
  filtros por generación, tipo, categoría especial (legendario, mítico,
  ultraente), habilidad y estadística mínima, y **modo shiny** para ver la
  versión shiny de todos los Pokémon.
- **Página de detalle por Pokémon** (`/pokedex/[id]`) con artwork shiny,
  estadísticas, habilidades, entrada de la Pokédex, cadena de evolución,
  debilidades/resistencias, zonas de encuentro por versión, visor 3D, captura y
  SEO propio.
- **Team Builder** (`/equipo`) con los 6 huecos del equipo, arrastrar y soltar
  para reordenar, cobertura ofensiva, debilidades compartidas y sugerencias
  automáticas de Pokémon que cubren los huecos del equipo (pool ampliado a 65
  especies).
- **Equipo por juego** dentro de cada guía: equipo independiente por juego,
  búsqueda limitada al Pokédex regional, análisis de debilidades, amenazas
  concretas del juego, sugerencias de contras, preparación contra cada gimnasio
  y miembro del Alto Mando (puntuación, ventajas, riesgos y Pokémon
  recomendados) y exportación como imagen PNG.
- **Movimientos por versión** con nombres traducidos al español, tipo,
  categoría, potencia, precisión, STAB, ataques recomendados, MT/MO, tutor y
  huevo.
- **Guías visuales** con mapas SVG ilustrativos de cada región, pines de ruta,
  insignias y un Pokémon representativo del tipo de cada gimnasio.
- **Modo aventura** en cada guía: tarjeta “Tu siguiente paso”, progreso de la
  ruta, selector para saltar a cualquier paso, botón “Hecho y seguir” que
  avanza automáticamente y enlaces profundos `?paso=N`.
- **Notas personales por paso**, guardadas en la cuenta, para recordar objetos,
  compras, guardados o tareas pendientes.
- **Seguimiento de gimnasios e insignias**: marca cada desafío como conseguido,
  consulta el progreso y ve la **caja de insignias** con la imagen de cada
  medalla. Las no conseguidas aparecen en gris y las obtenidas se colorean.
  Incluye insignias de Kanto a Paldea, cristales Z de Alola y visuales de
  respaldo para rangos y desafíos sin medalla oficial.
- **Capturas recomendadas para el próximo desafío**, calculadas con los tipos
  del siguiente gimnasio y el Pokédex regional del juego.
- **Continuar donde lo dejaste** desde el inicio y desde el listado de guías,
  con progreso por guía y acceso directo al siguiente paso pendiente.
- **Modo oscuro** con toggle claro/oscuro, persistencia en localStorage,
  respeto a la preferencia del sistema y una capa de compatibilidad que adapta
  fondos, textos, bordes y degradados de toda la interfaz.
- **Visor 3D** con modelos normales y shiny, selector de animaciones, pantalla
  completa, rotación pausable, progreso de carga, precarga al pasar el ratón,
  caché de modelos en el Service Worker, ajuste de calidad en móvil y fallback
  a imagen.
- **Galería 3D** (`/pokedex/3d`) con una selección de modelos interactivos,
  filtros por generación, tipo y categoría, modo shiny y acceso a la ficha
  completa de cada Pokémon.
- **Comparador de Pokémon** (`/comparar`) para enfrentar estadísticas, tipos,
  habilidades, altura, peso y total de hasta tres especies.
- **Exportación del equipo** como imagen PNG desde el Team Builder global y
  desde el equipo de cada juego, con temas oscuro, claro y shiny.
- **Legendarios y míticos** identificados con badges y filtros, incluyendo
  ultraentes y las especies de todas las generaciones.
- **Navegación móvil** con barra inferior, iconos Lucide, skeletons de carga,
  microinteracciones y respeto a `prefers-reduced-motion`.
- **22 guías de juegos principales** desde la Generación I hasta la IX,
  incluyendo remakes y DLC.
- **14 guías de spin-offs**: Mystery Dungeon, Ranger, Colosseum, XD, Snap,
  New Snap, Pokkén y Conquest.
- **Pokédex regional exacta** por juego usando los `version-group` y `pokedex`
  oficiales de PokeAPI. Ejemplos: Galar + DLC (584 especies), Paldea + DLC
  (664), Lumiose + Hiperspacial (364).
- **Cuentas de usuario** con registro, login, logout y sesiones seguras.
- **Progreso por usuario** en Postgres: cada cuenta tiene sus propios Pokémon
  capturados, checklists y equipo de 6. Nadie más puede modificarlos.
- **Checklist interactiva** por guía con filtros, paginación y marcar páginas.
- **Equipo Pokémon** de 6 guardado en la cuenta.
- **Visor 3D** con Three.js y modelos GLB de Pokémon-3D-api, con fallback a la
  imagen oficial si el modelo no está disponible.
- **Búsqueda global** de Pokémon y guías, con filtros por tipo, generación y
  categoría.
- **PWA offline**: las páginas visitadas se guardan en caché y hay una página
  `/offline`. Los cambios de progreso requieren conexión.
- **Seguridad**: scrypt para contraseñas, tokens de sesión hasheados, cookies
  httpOnly/SameSite, comprobación de origen, rate limiting en Postgres y
  cabeceras CSP/HSTS.
- **SEO**: metadatos, sitemap, robots, manifest y páginas estáticas.
- **Observabilidad**: Vercel Analytics y Speed Insights.
- **Tests**: Vitest + Testing Library y workflow de CI en GitHub Actions.

> Proyecto fan sin afiliación con Nintendo, Game Freak o The Pokémon Company.
> Datos de Pokémon: [PokeAPI](https://pokeapi.co/). Modelos 3D:
> [Pokémon-3D-api](https://github.com/Pokemon-3D-api/assets); los modelos son
> propiedad de Nintendo, Creatures Inc. y GAME FREAK.

## Stack

- Next.js 16 (App Router, Server Components, ISR)
- React 19
- TypeScript
- Tailwind CSS 4
- Neon Postgres + `@neondatabase/serverless`
- Three.js + `@react-three/fiber` + `@react-three/drei`
- PokeAPI
- Vitest + Testing Library
- Vercel

## Desarrollo local

Requisitos: Node.js 20.9+ y npm.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Comandos:

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Vitest
npm run build      # Build de producción
npm run start      # Servir el build
npm run db:migrate # Crear/actualizar tablas en Postgres
```

### Base de datos local

1. Crea una base Postgres gratuita en [Neon](https://neon.tech) o conecta la
   integración de Neon en Vercel.
2. Copia `.env.example` a `.env.local` y rellena `DATABASE_URL`. Si usas Vercel:

   ```bash
   vercel link
   vercel env pull .env.local
   ```

3. Aplica el esquema:

   ```bash
   npm run db:migrate
   ```

Tablas creadas: `users`, `sessions`, `progress` y `rate_limits`.

## Autenticación y datos

- `POST /api/auth/register` — crea una cuenta.
- `POST /api/auth/login` — inicia sesión.
- `POST /api/auth/logout` — cierra la sesión.
- `GET /api/auth/me` — devuelve el usuario actual.
- `GET /api/search?q=...` — búsqueda global de Pokémon y guías para el
  autocompletado del inicio.
- `GET /api/pokemon/[id]` — datos básicos de un Pokémon para añadirlo al equipo.
- `GET /api/pokemon/[id]/moves?versionGroup=...` — movimientos aprendibles en
  un juego concreto.
- `/pokedex/[id]` — ficha completa de cada Pokémon (ISR de 7 días).
- `/equipo` — Team Builder privado global con análisis de tipos.
- `GET /api/account` — devuelve todas las guías y el equipo del usuario.
- `PUT /api/account` — guarda `{ slug, data }` (o `__team__` para el equipo).
- `DELETE /api/account` — borra todo el progreso del usuario.

### Registro privado

Por defecto el registro público se abre **solo si todavía no existe ningún
usuario**. En cuanto se crea la primera cuenta, el registro se cierra
automáticamente. Así puedes crear tu cuenta inicial y dejar la aplicación
privada para el resto.

- `/registro` muestra “Registro cerrado” cuando ya hay usuarios.
- `/api/auth/register` rechaza nuevas cuentas con `403`.
- El botón “Crear cuenta” desaparece de la cabecera y de los paneles.
- Si necesitas abrirlo temporalmente, define `ALLOW_REGISTRATION=true` en
  Vercel y vuelve a desplegar. Para cerrarlo de nuevo, cámbialo a `false` o
  elimina la variable.

También puedes gestionar cuentas desde la terminal contra la base de datos:

```bash
npm run users:list
npm run users:create -- nuevo_usuario contraseña123
npm run users:password -- mi_usuario nueva_contraseña
npm run users:delete -- usuario_a_borrar --yes
```

Detalles de seguridad:

- Contraseñas con **scrypt** (N=16384, r=8, p=1) y salt aleatorio.
- Sesiones de 30 días; en la base de datos solo se guarda el hash SHA-256 del
  token. La cookie es `httpOnly`, `SameSite=Lax` y `Secure` en producción.
- Las mutaciones comprueban `Origin` para reducir CSRF.
- Rate limiting por IP/usuario en Postgres.
- Validación y saneamiento de todos los datos de progreso y equipo.
- El progreso se guarda por `user_id`; no hay estado global compartido.

## Guías y Pokédex

Toda la información de las guías vive en:

- `data/games.ts` — juegos principales.
- `data/spinOffs.ts` — spin-offs.
- `data/versionGroups.ts` — relación slug → `version-group` de PokeAPI.

La Pokédex de cada guía se obtiene de `services/gamePokedex.ts`, que consulta el
Pokédex regional oficial de PokeAPI (incluyendo DLC). Si PokeAPI falla, usa el
rango nacional de `dexRange` como respaldo.

Para añadir una guía:

1. Copia una entrada existente en `data/games.ts` o `data/spinOffs.ts`.
2. Rellena el tipo `GameGuide` (`types/game.ts`).
3. Si es un juego principal, añade su `version-group` en
   `data/versionGroups.ts`.
4. Ejecuta `npm run typecheck`, `npm test` y `npm run build`.

## Filtros avanzados

`public/pokemon-filters.json` contiene tipos, estadísticas base y habilidades de
las 1025 especies. Se genera desde los CSV oficiales de PokeAPI con:

```bash
npm run data:filters
```

El cliente lo descarga solo cuando el usuario activa un filtro de tipo,
habilidad o estadística, y luego lo reutiliza desde memoria.

## Traducciones de PokeAPI

PokeAPI devuelve los nombres de movimientos y versiones en inglés. El proyecto
genera mapas estáticos en español desde sus CSV oficiales:

```bash
npm run data:moves
npm run data:versions
```

- `lib/move-names-es.json` — 937 movimientos traducidos. Lo usan la API de
  movimientos y las evoluciones que requieren conocer un ataque.
- `lib/version-names-es.json` — versiones de los juegos para la sección
  “Dónde encontrarlo”.

## Modelos 3D

- Los modelos se cargan desde Pokémon-3D-api y usan compresión Draco.
- La CSP incluye `'wasm-unsafe-eval'` para permitir el decoder WebAssembly de
  Draco. Sin esa directiva el modelo se queda atascado en la carga.
- El Service Worker cachea los `.glb` en `pokedex-v3-models`: la primera carga
  va a la red y las siguientes salen de caché.
- Las tarjetas precargan el modelo al pasar el ratón o enfocar “Ver ficha”.
- En móvil se reduce el DPR y se desactivan sombras para mejorar el rendimiento.
- Si un modelo no está disponible o tarda demasiado, se puede usar la vista
  Imagen desde el propio visor.

## PWA offline

- `public/sw.js` cachea páginas visitadas, assets estáticos y una página
  `/offline`.
- El service worker solo se registra en producción.
- Las llamadas a `/api/*` nunca se cachean: login y progreso siempre van a la
  red.
- Al cambiar la versión de la app, actualiza `VERSION` en `public/sw.js`.

## Despliegue en Vercel

### Opción A: GitHub (recomendado)

1. Sube el proyecto a GitHub.
2. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
3. Conecta Neon desde **Storage / Integrations** y asegúrate de que
   `DATABASE_URL` esté disponible en Production, Preview y Development.
4. Define `NEXT_PUBLIC_SITE_URL` con tu dominio final (opcional).
5. Despliega.

### Opción B: CLI

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run db:migrate
vercel --prod
```

Después del despliegue:

- Comprueba `/sitemap.xml`, `/robots.txt` y `/manifest.webmanifest`.
- Verifica que el login funciona y que el progreso persiste al recargar.
- Revisa Vercel Analytics y Speed Insights en el dashboard.
- Si cambias de dominio, actualiza `NEXT_PUBLIC_SITE_URL`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión Postgres (Neon). |
| `NEXT_PUBLIC_SITE_URL` | No | URL canónica del sitio. |
| `ALLOW_REGISTRATION` | No | `true` abre el registro público; `false` lo cierra. Sin definir, solo permite crear la primera cuenta. |

En Vercel, Neon inyecta `DATABASE_URL` (y variables `POSTGRES_*`) al conectar
el recurso. El código acepta `DATABASE_URL` o `POSTGRES_URL`.

## Roadmap

- Sustituir el respaldo nacional por listas de obtenibilidad exactas con método
  (ruta, hierba, agua, intercambio, evento, DLC).
- Traducción completa de nombres de Pokémon al español.
- Mapas e imágenes en las guías.
- Cola de sincronización offline con IndexedDB para editar progreso sin
  conexión.
- Sentry u otro proveedor de errores además de Analytics.
- Internacionalización con `next-intl`.
- Más spin-offs: Pokémon GO, UNITE, Detective Pikachu, Rumble, etc.
