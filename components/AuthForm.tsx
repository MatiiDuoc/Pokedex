'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAccount } from '@/components/AccountProvider';

interface AuthFormProps {
  mode: 'login' | 'register';
  nextPath: string;
}

export default function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const { user, login, register, authLoading, registrationOpen } = useAccount();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

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
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-10 animate-pulse rounded bg-gray-50" />
        <div className="mt-2 h-10 animate-pulse rounded bg-gray-50" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-black text-gray-900">
          Ya has iniciado sesión
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Estás como <strong>{user.displayName}</strong>. Tu progreso se guarda
          en tu cuenta.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/guias"
            className="rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Ir a las guías
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (isRegister && !registrationOpen) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          🔒
        </div>
        <h1 className="mt-4 text-2xl font-black text-gray-900">
          Registro cerrado
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Este Pokédex es privado y no acepta cuentas nuevas. Si ya tienes
          acceso, inicia sesión con tu usuario y contraseña.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-widest text-red-600">
        {isRegister ? 'Nueva cuenta' : 'Bienvenido de nuevo'}
      </p>
      <h1 className="mt-1 text-3xl font-black text-gray-900">
        {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {isRegister
          ? 'Tu equipo y tu progreso quedarán guardados en tu cuenta, separados de los de cualquier otra persona.'
          : 'Accede para sincronizar tu equipo, tus checklists y tu Pokédex.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-bold text-gray-700">
            Usuario
          </label>
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
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          <p className="mt-1 text-xs text-gray-500">
            3-20 caracteres: letras, números o guion bajo.
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-bold text-gray-700">
            Contraseña
          </label>
          <div className="mt-1 flex gap-2">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="rounded-lg bg-gray-100 px-3 text-xs font-bold text-gray-700 hover:bg-gray-200"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres.</p>
        </div>

        {isRegister && (
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-bold text-gray-700"
            >
              Repite la contraseña
            </label>
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-bold text-white shadow-md transition hover:from-red-600 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? 'Procesando...'
            : isRegister
              ? 'Crear mi cuenta'
              : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        {isRegister ? (
          <>
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-bold text-red-600 hover:text-red-700"
            >
              Inicia sesión
            </Link>
          </>
        ) : registrationOpen ? (
          <>
            ¿Todavía no tienes cuenta?{' '}
            <Link
              href="/registro"
              className="font-bold text-red-600 hover:text-red-700"
            >
              Crea una gratis
            </Link>
          </>
        ) : (
          <span className="text-xs font-semibold text-gray-400">
            El registro público está cerrado.
          </span>
        )}
      </p>

      <p className="mt-4 text-center text-xs text-gray-400">
        La contraseña se guarda cifrada con scrypt. No compartas tu cuenta.
      </p>
    </div>
  );
}
