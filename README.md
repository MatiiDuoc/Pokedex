# Pokédex + Guías

Aplicación web para consultar el Pokédex Nacional y seguir guías de todos los
juegos principales de Pokémon. Está pensada para usarse mientras se juega:
checklists de progreso, gimnasios, Alto Mando, legendarios, exclusivas de
versión y Pokédex por juego.

## Características

- **Pokédex Nacional** con las 1025 especies, búsqueda por nombre/número y
  filtro por generación.
- **Pokédex destacada** con tipos, estadísticas, altura, peso y equipo de 6
  Pokémon guardado en el navegador.
- **22 guías** de juegos principales desde la Generación I hasta la IX:
  - Rojo/Azul/Verde, Amarillo
  - Oro/Plata, Cristal, HeartGold/SoulSilver
  - Rubí/Zafiro, Esmeralda, Rojo Fuego/Verde Hoja, Rubí Omega/Zafiro Alfa
  - Diamante/Perla, Platino, Diamante Brillante/Perla Reluciente
  - Negro/Blanco, Negro 2/Blanco 2
  - X/Y
  - Sol/Luna, Ultra Sol/Ultra Luna
  - Let's Go, Pikachu!/Eevee!
  - Espada/Escudo
  - Leyendas: Arceus
  - Escarlata/Púrpura
  - Leyendas: Z-A
- **Checklist interactiva** por juego: pasos completados, objetivos y Pokémon
  capturados. El progreso se guarda en `localStorage`.
- **Filtros** por generación, región y plataforma.
- **SEO**: metadatos, `sitemap.xml`, `robots.txt` y páginas estáticas para cada
  guía.
- **Seguridad**: cabeceras CSP, HSTS en producción, `nosniff`, `X-Frame-Options`,
  `Referrer-Policy` y `Permissions-Policy`.

> Proyecto fan sin afiliación con Nintendo, Game Freak o The Pokémon Company.
> Los datos de Pokémon provienen de [PokeAPI](https://pokeapi.co/). Las guías se
> elaboran a partir de información pública de los juegos.

## Stack

- Next.js 16 (App Router, Server Components, ISR)
- React 19
- TypeScript
- Tailwind CSS 4
- PokeAPI
- Vercel (despliegue recomendado)

## Desarrollo local

Requisitos: Node.js 20+ y npm.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Comandos útiles:

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
npm run build      # Build de producción
npm run start      # Servir el build
```

## Estructura

```
app/
  api/pokemon/       API paginada de la Pokédex destacada
  guias/             Listado y páginas de guías
  pokedex/           Pokédex Nacional completa
  layout.tsx         Layout global, cabecera y equipo
  sitemap.ts         Sitemap dinámico
  robots.ts          Robots.txt
components/          UI (tarjetas, checklist, equipo, filtros...)
data/games.ts        Datos curados de las 22 guías
lib/                 Utilidades de tipos, progreso y sitio
services/            Cliente de PokeAPI e índice nacional
types/               Tipos compartidos
```

## Añadir o editar una guía

Toda la información de las guías vive en `data/games.ts`. Cada entrada cumple
el tipo `GameGuide` (`types/game.ts`). Para añadir un juego:

1. Copia una entrada existente de `data/games.ts`.
2. Cambia `slug`, `title`, `generation`, `region`, `platform`, `releaseYear`,
   `versions`, rangos de Pokédex, iniciales, legendarios, exclusivas, gimnasios,
   Alto Mando, campeón, pasos, consejos y checklist.
3. Añade el `slug` a la lista de `games` (ya se genera automáticamente la ruta
   `/guias/[slug]`).
4. Ejecuta `npm run build` para comprobar tipos y generación estática.

El rango `dexRange` se usa para construir la checklist de Pokémon. Para juegos
con Pokédex regional propia (por ejemplo, Lumiose en Leyendas: Z-A), ajusta el
rango y el texto `dexScope`/`dexNote` para reflejarlo.

## Progreso del usuario

El progreso se guarda en el navegador:

- Equipo: `pokedex:team`
- Guía: `pokedex:guide:<slug>`

No hay cuentas ni base de datos. Si el usuario borra los datos del sitio o
cambia de dispositivo, el progreso se pierde. La sincronización con una cuenta
es una mejora futura.

## Despliegue en Vercel

### Opción A: desde GitHub (recomendado)

1. Sube el proyecto a un repositorio de GitHub.
2. Entra en [vercel.com/new](https://vercel.com/new) e importa el repositorio.
3. Vercel detecta Next.js automáticamente. No cambies los comandos:
   - Build Command: `npm run build`
   - Output Directory: `.next` (automático)
4. (Opcional) Define `NEXT_PUBLIC_SITE_URL` con tu dominio final, por ejemplo
   `https://pokedex-guias.vercel.app`.
5. Pulsa **Deploy**.

### Opción B: CLI

```bash
npm install -g vercel
vercel login
vercel          # preview
vercel --prod   # producción
```

### Después del despliegue

- Comprueba `/sitemap.xml` y `/robots.txt`.
- Si usas dominio propio, actualiza `NEXT_PUBLIC_SITE_URL` en
  **Project Settings → Environment Variables** y vuelve a desplegar.
- Las páginas de guías son estáticas (ISR de 7 días); la Pokédex Nacional
  también se regenera cada 7 días. Los datos de PokeAPI se cachean 24 horas.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No | URL pública canónica. Si no se define, se usa la URL de Vercel o `localhost:3000`. |

Copia `.env.example` a `.env.local` si quieres fijarla en desarrollo.

## Mejoras recomendadas (roadmap)

- **Datos por juego exactos**: sustituir los rangos nacionales por listas de
  Pokémon obtenibles en cada juego, incluyendo métodos (ruta, hierba, agua,
  intercambio, evento, DLC).
- **Sincronización de progreso**: cuentas con Auth.js/Clerk + base de datos
  (Postgres/Neon + Prisma o Drizzle) para conservar checklists entre
  dispositivos.
- **Búsqueda global**: índice de búsqueda con Typesense/Meilisearch o full-text
  en Postgres.
- **Modelos 3D**: integrar `@react-three/fiber` con modelos GLB optimizados y
  carga diferida.
- **PWA**: instalación en móvil, caché offline de guías y checklist sin
  conexión (next-pwa o Service Worker propio).
- **Tests**: Vitest + Testing Library para componentes y Playwright para los
  flujos de checklist/progreso.
- **Observabilidad**: Vercel Analytics, Speed Insights y Sentry para errores.
- **Internacionalización**: español/inglés con `next-intl`.
- **Rate limiting**: protección del API route con Upstash Redis o Vercel KV.
- **Contenido**: completar guías de spin-offs (Mystery Dungeon, Ranger,
  Colosseum, XD, Snap, Pokkén...) y añadir mapas/imágenes.
