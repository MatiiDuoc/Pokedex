'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAccount } from '@/components/AccountProvider';
import PokeballMark from '@/components/PokeballMark';

interface AuthFormProps {
  mode: 'login' | 'register';
  nextPath: string;
  variant?: 'default' | 'cinematic';
}

export default function AuthForm({
  mode,
  nextPath,
  variant = 'default',
}: AuthFormProps) {
  const router = useRouter();
  const { user, login, register, authLoading, registrationOpen } = useAccount();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const cinematic = variant === 'cinematic';

  const cardClass = cinematic
    ? 'relative isolate w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 text-white shadow-[0_35px_120px_-30px_rgba(239,68,68,0.6)] backdrop-blur-2xl sm:p-8'
    : 'w-full max-w-md rounded-2xl bg-white p-8 shadow-xl';
  const primaryLinkClass = cinematic
    ? 'rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:brightness-110'
    : 'rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700';
  const secondaryLinkClass = cinematic
    ? 'rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10'
    : 'rounded-lg bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200';
  const labelClass = cinematic
    ? 'block text-sm font-bold text-white/80'
    : 'block text-sm font-bold text-gray-700';
  const inputClass = cinematic
    ? 'w-full rounded-xl border border-white/10 bg-white/[0.045] py-3 pr-3 text-white placeholder-white/25 outline-none transition focus:border-red-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/20'
    : 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200';
  const helperClass = cinematic
    ? 'mt-1 text-xs text-white/40'
    : 'mt-1 text-xs text-gray-500';
  const linkClass = cinematic
    ? 'font-bold text-red-300 transition hover:text-red-200'
    : 'font-bold text-red-600 transition hover:text-red-700';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);

    const result = isRegister
      ? await register(username, password)
      : await login(username, password);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? 'No se pudo completar la operación.');
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  if (authLoading) {
    return (
      <div className={cardClass}>
        {cinematic && <CardDecorations />}
        <div
          className={`h-6 w-40 animate-pulse rounded ${
            cinematic ? 'bg-white/10' : 'bg-gray-100'
          }`}
        />
        <div
          className={`mt-4 h-10 animate-pulse rounded ${
            cinematic ? 'bg-white/5' : 'bg-gray-50'
          }`}
        />
        <div
          className={`mt-2 h-10 animate-pulse rounded ${
            cinematic ? 'bg-white/5' : 'bg-gray-50'
          }`}
        />
      </div>
    );
  }

  if (user) {
    return (
      <div className={`${cardClass} text-center`}>
        {cinematic && <CardDecorations />}
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            cinematic
              ? 'border border-emerald-400/25 bg-emerald-400/10'
              : 'bg-green-100'
          }`}
        >
          <CheckCircle2
            className={`h-7 w-7 ${
              cinematic ? 'text-emerald-300' : 'text-green-600'
            }`}
          />
        </div>
        <h1
          className={`mt-4 text-2xl font-black ${
            cinematic ? 'text-white' : 'text-gray-900'
          }`}
        >
          Ya has iniciado sesión
        </h1>
        <p
          className={`mt-1 text-sm ${
            cinematic ? 'text-white/60' : 'text-gray-600'
          }`}
        >
          Estás como <strong>{user.displayName}</strong>. Tu progreso se guarda
          en tu cuenta.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/guias" className={primaryLinkClass}>
            Ir a las guías
          </Link>
          <Link href="/" className={secondaryLinkClass}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (isRegister && !registrationOpen) {
    return (
      <div className={`${cardClass} text-center`}>
        {cinematic && <CardDecorations />}
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            cinematic
              ? 'border border-amber-400/25 bg-amber-400/10'
              : 'bg-amber-100'
          }`}
        >
          <Lock
            className={`h-7 w-7 ${
              cinematic ? 'text-amber-300' : 'text-amber-700'
            }`}
          />
        </div>
        <h1
          className={`mt-4 text-2xl font-black ${
            cinematic ? 'text-white' : 'text-gray-900'
          }`}
        >
          Registro cerrado
        </h1>
        <p
          className={`mt-2 text-sm ${
            cinematic ? 'text-white/60' : 'text-gray-600'
          }`}
        >
          Este Pokédex es privado y no acepta cuentas nuevas. Si ya tienes
          acceso, inicia sesión con tu usuario y contraseña.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/login" className={primaryLinkClass}>
            Iniciar sesión
          </Link>
          <Link href="/" className={secondaryLinkClass}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      {cinematic && <CardDecorations />}

      {cinematic ? (
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/15 bg-white/5 shadow-[0_0_35px_-5px_rgba(239,68,68,0.8)]">
            <PokeballMark className="h-9 w-9" />
            <span
              aria-hidden="true"
              className="login-pulse-ring absolute inset-0 rounded-full border border-red-400/20"
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300/90">
              {isRegister ? 'Nuevo entrenador' : 'Acceso entrenador'}
            </p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </h1>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">
            {isRegister ? 'Nueva cuenta' : 'Bienvenido de nuevo'}
          </p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
        </>
      )}

      <p
        className={`${cinematic ? 'mt-4 text-white/55' : 'mt-2 text-gray-600'} text-sm`}
      >
        {isRegister
          ? 'Tu equipo y tu progreso quedarán guardados en tu cuenta, separados de los de cualquier otra persona.'
          : 'Accede para sincronizar tu equipo, tus checklists y tu Pokédex.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className={labelClass}>
            Usuario
          </label>
          <div className="relative mt-1">
            {cinematic && (
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            )}
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="tu_usuario"
              className={`${inputClass} ${cinematic ? 'pl-10' : ''}`}
            />
          </div>
          <p className={helperClass}>
            3-20 caracteres: letras, números o guion bajo.
          </p>
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Contraseña
          </label>
          <div className="mt-1 flex gap-2">
            <div className="relative flex-1">
              {cinematic && (
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              )}
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClass} ${cinematic ? 'pl-10' : ''}`}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className={
                cinematic
                  ? 'rounded-xl border border-white/10 bg-white/5 px-3 text-white/60 transition hover:bg-white/10 hover:text-white'
                  : 'rounded-lg bg-gray-100 px-3 text-gray-700 transition hover:bg-gray-200'
              }
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className={helperClass}>Mínimo 8 caracteres.</p>
        </div>

        {isRegister && (
          <div>
            <label
              htmlFor="confirm-password"
              className={labelClass}
            >
              Repite la contraseña
            </label>
            <div className="relative mt-1">
              {cinematic && (
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              )}
              <input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={`${inputClass} ${cinematic ? 'pl-10' : ''}`}
              />
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              cinematic
                ? 'border-red-400/30 bg-red-500/10 text-red-200'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={
            cinematic
              ? 'group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-orange-500 px-4 py-3.5 font-black text-white shadow-[0_14px_45px_-14px_rgba(239,68,68,0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
              : 'w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-bold text-white shadow-md transition hover:from-red-600 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-60'
          }
        >
          {cinematic && (
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
          )}
          <span className="relative inline-flex items-center justify-center gap-2">
            {submitting
              ? 'Procesando...'
              : isRegister
                ? 'Crear mi cuenta'
                : 'Entrar'}
            {cinematic && !submitting && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </span>
        </button>
      </form>

      <p
        className={`mt-5 text-center text-sm ${
          cinematic ? 'text-white/50' : 'text-gray-600'
        }`}
      >
        {isRegister ? (
          <>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className={linkClass}>
              Inicia sesión
            </Link>
          </>
        ) : registrationOpen ? (
          <>
            ¿Todavía no tienes cuenta?{' '}
            <Link href="/registro" className={linkClass}>
              Crea una gratis
            </Link>
          </>
        ) : (
          <span
            className={`text-xs font-semibold ${
              cinematic ? 'text-white/35' : 'text-gray-400'
            }`}
          >
            El registro público está cerrado.
          </span>
        )}
      </p>

      <p
        className={`mt-4 flex items-center justify-center gap-1.5 text-center text-xs ${
          cinematic ? 'text-white/30' : 'text-gray-400'
        }`}
      >
        <ShieldCheck className="h-3.5 w-3.5 flex-none" />
        La contraseña se guarda cifrada con scrypt. No compartas tu cuenta.
      </p>
    </div>
  );
}

function CardDecorations() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-red-400/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl"
      />
    </>
  );
}
