import { CheckCircle2 } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import PokeballMark from '@/components/PokeballMark';
import { getArtworkUrl } from '@/services/pokeapi';

interface LoginExperienceProps {
  nextPath: string;
  totalPokemon: number;
  totalGuides: number;
}

const starters = [
  {
    id: 1,
    name: 'Bulbasaur',
    type: 'Planta',
    ring: 'border-emerald-400/40',
    glow: 'bg-emerald-500/30',
    chip: 'bg-emerald-400/10 text-emerald-200',
  },
  {
    id: 4,
    name: 'Charmander',
    type: 'Fuego',
    ring: 'border-orange-400/40',
    glow: 'bg-orange-500/30',
    chip: 'bg-orange-400/10 text-orange-200',
  },
  {
    id: 7,
    name: 'Squirtle',
    type: 'Agua',
    ring: 'border-sky-400/40',
    glow: 'bg-sky-500/30',
    chip: 'bg-sky-400/10 text-sky-200',
  },
];

const ambientPokemon = [
  {
    id: 6,
    name: 'Charizard',
    left: '1%',
    top: '8%',
    width: 230,
    glow: 'bg-red-500/25',
    duration: 15,
    delay: -3,
    reverse: false,
    className: 'hidden xl:block',
  },
  {
    id: 94,
    name: 'Gengar',
    left: '80%',
    top: '6%',
    width: 200,
    glow: 'bg-violet-500/25',
    duration: 17,
    delay: -8,
    reverse: true,
    className: 'hidden lg:block',
  },
  {
    id: 448,
    name: 'Lucario',
    left: '3%',
    top: '60%',
    width: 190,
    glow: 'bg-sky-500/25',
    duration: 16,
    delay: -6,
    reverse: true,
    className: 'hidden 2xl:block',
  },
  {
    id: 282,
    name: 'Gardevoir',
    left: '83%',
    top: '54%',
    width: 210,
    glow: 'bg-pink-500/25',
    duration: 18,
    delay: -10,
    reverse: false,
    className: 'hidden lg:block',
  },
  {
    id: 658,
    name: 'Greninja',
    left: '70%',
    top: '76%',
    width: 170,
    glow: 'bg-cyan-500/25',
    duration: 14,
    delay: -2,
    reverse: true,
    className: 'hidden md:block',
  },
  {
    id: 887,
    name: 'Dragapult',
    left: '18%',
    top: '80%',
    width: 180,
    glow: 'bg-indigo-500/25',
    duration: 19,
    delay: -12,
    reverse: false,
    className: 'hidden 2xl:block',
  },
];

const particleColors = [
  '#f87171',
  '#fbbf24',
  '#38bdf8',
  '#34d399',
  '#a78bfa',
  '#f472b6',
];

const particles = Array.from({ length: 30 }, (_, index) => ({
  left: (index * 37 + 7) % 100,
  top: (index * 53 + 13) % 100,
  size: 2 + (index % 4),
  duration: 8 + (index % 6) * 1.7,
  delay: -((index * 1.3) % 14),
  color: particleColors[index % particleColors.length],
}));

export default function LoginExperience({
  nextPath,
  totalPokemon,
  totalGuides,
}: LoginExperienceProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#050716] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(239,68,68,0.2),transparent_52%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.18),transparent_54%)]" />

        <div className="login-aurora absolute -left-40 top-[-12%] h-[36rem] w-[36rem] rounded-full bg-red-600/20 blur-[130px]" />
        <div
          className="login-aurora absolute -right-40 top-[18%] h-[32rem] w-[32rem] rounded-full bg-indigo-600/25 blur-[120px]"
          style={{ animationDelay: '-7s', animationDuration: '26s' }}
        />
        <div
          className="login-aurora absolute bottom-[-18%] left-[28%] h-[30rem] w-[30rem] rounded-full bg-amber-500/15 blur-[120px]"
          style={{ animationDelay: '-12s', animationDuration: '24s' }}
        />
        <div
          className="login-aurora absolute bottom-[8%] right-[10%] h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/15 blur-[110px]"
          style={{ animationDelay: '-3s', animationDuration: '20s' }}
        />

        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="login-grid absolute inset-x-0 bottom-0 h-[55%] opacity-25" />

        <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[34rem] w-[34rem] rounded-full border border-white/[0.06] sm:h-[46rem] sm:w-[46rem]">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.06]" />
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
            <div className="login-spin-slow absolute -inset-5 rounded-full border border-dashed border-red-400/10" />
          </div>
        </div>

        {ambientPokemon.map((pokemon) => (
          <div
            key={pokemon.id}
            className={`pointer-events-none absolute ${pokemon.className}`}
            style={{
              left: pokemon.left,
              top: pokemon.top,
              width: pokemon.width,
            }}
          >
            <div
              className={`absolute inset-[18%] rounded-full blur-3xl ${pokemon.glow}`}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getArtworkUrl(pokemon.id)}
              alt=""
              loading="lazy"
              className={`relative w-full select-none object-contain opacity-[0.22] ${
                pokemon.reverse ? 'login-float-reverse' : 'login-float'
              }`}
              style={{
                animationDuration: `${pokemon.duration}s`,
                animationDelay: `${pokemon.delay}s`,
              }}
            />
          </div>
        ))}

        {particles.map((particle, index) => (
          <span
            key={index}
            className="login-particle absolute rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 4}px ${particle.color}`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-b from-[#050716]/20 via-transparent to-[#050716]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="hidden lg:block">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-white/60 backdrop-blur">
            <PokeballMark className="h-4 w-4" />
            Acceso entrenador
          </p>

          <h2 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight xl:text-6xl">
            Tu próxima aventura
            <span className="mt-1 block bg-gradient-to-r from-red-300 via-amber-200 to-sky-300 bg-clip-text text-transparent">
              empieza aquí.
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
            Entra para sincronizar tu Pokédex, tus equipos por juego y todas tus
            guías. Marca vistos y capturados, prepara tu equipo y sigue tu
            progreso desde cualquier dispositivo.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Stat value={totalPokemon} label="Especies" />
            <Stat value={totalGuides} label="Guías" />
            <Stat value="3D" label="Modelos" />
          </div>

          <div className="mt-10">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
              Elige tu compañero
            </p>
            <div className="mt-4 flex gap-4">
              {starters.map((starter, index) => (
                <div
                  key={starter.id}
                  className="group relative flex w-28 flex-col items-center"
                >
                  <div
                    className={`relative flex h-24 w-24 items-center justify-center rounded-full border bg-white/[0.04] ${starter.ring} shadow-[0_0_40px_-15px_rgba(255,255,255,0.35)] backdrop-blur transition duration-300 group-hover:-translate-y-1 group-hover:bg-white/[0.08]`}
                  >
                    <div
                      className={`absolute inset-3 rounded-full blur-xl ${starter.glow}`}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getArtworkUrl(starter.id)}
                      alt={starter.name}
                      loading="lazy"
                      className={`relative h-20 w-20 object-contain transition duration-300 group-hover:scale-110 ${
                        index % 2 === 0 ? 'login-float' : 'login-float-reverse'
                      }`}
                      style={{
                        animationDuration: `${8 + index * 1.5}s`,
                        animationDelay: `${-index * 2}s`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-black text-white/85">
                    {starter.name}
                  </p>
                  <span
                    className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${starter.chip}`}
                  >
                    {starter.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ul className="mt-10 grid gap-3 text-sm text-white/60">
            <Feature>Progreso sincronizado entre dispositivos</Feature>
            <Feature>Equipos y análisis por juego</Feature>
            <Feature>Checklists, shiny tracker y guías</Feature>
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
            <PokeballMark className="h-11 w-11" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-red-300/80">
                Pokédex + Guías
              </p>
              <p className="text-lg font-black text-white">Acceso entrenador</p>
            </div>
          </div>

          <AuthForm mode="login" nextPath={nextPath} variant="cinematic" />

          <p className="mt-4 text-center text-[11px] font-semibold text-white/25">
            Tus datos se guardan de forma segura y privada.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 backdrop-blur">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      {children}
    </li>
  );
}
