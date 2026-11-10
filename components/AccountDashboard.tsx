'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { useAccount } from '@/components/AccountProvider';

export default function AccountDashboard() {
  const {
    user,
    authLoading,
    dataLoading,
    registrationOpen,
    guides,
    team,
    logout,
    resetAll,
  } = useAccount();
  const [message, setMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <Lock className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-3 text-2xl font-black text-gray-900">
            Necesitas iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Cada usuario tiene su propio progreso y equipo. Inicia sesión para
            verlos.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login?next=/cuenta"
              className="rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Iniciar sesión
            </Link>
            {registrationOpen && (
              <Link
                href="/registro"
                className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const guideCount = Object.keys(guides).length;
  const caughtCount = new Set(
    Object.values(guides).flatMap((progress) => progress.caught)
  ).size;
  const checklistCount = Object.values(guides).reduce(
    (total, progress) => total + progress.checklist.length,
    0
  );

  const handleReset = async () => {
    const confirmed = window.confirm(
      '¿Borrar todo tu progreso, checklists y equipo? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    setResetting(true);
    const result = await resetAll();
    setResetting(false);
    setMessage(result.ok ? 'Todo tu progreso ha sido borrado.' : result.error ?? 'No se pudo borrar.');
  };

  const handlePasswordChange = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setPasswordError(data.error ?? 'No se pudo cambiar la contraseña.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage(
        'Contraseña actualizada. Se cerraron las sesiones de otros dispositivos.'
      );
    } catch {
      setPasswordError('No se pudo conectar con el servidor.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">
          Mi cuenta
        </p>
        <h1 className="mt-1 text-3xl font-black">{user.displayName}</h1>
        <p className="mt-1 text-sm text-white/90">
          Tu progreso está guardado en tu cuenta y separado del de cualquier otra
          persona.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Guías con progreso" value={guideCount} loading={dataLoading} />
        <Stat label="Pokémon marcados" value={caughtCount} loading={dataLoading} />
        <Stat label="Marcas completadas" value={checklistCount} loading={dataLoading} />
      </div>

      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Equipo actual</h2>
        {team.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">
            Todavía no has capturado ningún Pokémon para tu equipo.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {team.map((pokemon) => (
              <span
                key={pokemon.id}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-800"
              >
                #{pokemon.id.toString().padStart(4, '0')} {pokemon.name}
              </span>
            ))}
          </div>
        )}
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-bold text-red-600 hover:text-red-700"
        >
          Ir a la Pokédex para editar el equipo →
        </Link>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <KeyRound className="h-5 w-5 text-red-600" />
          Cambiar contraseña
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Al cambiarla se cerrarán las sesiones abiertas en otros dispositivos.
        </p>

        <form
          onSubmit={(event) => void handlePasswordChange(event)}
          className="mt-4 grid gap-3 sm:grid-cols-3"
        >
          <div>
            <label
              htmlFor="current-password"
              className="block text-xs font-bold text-gray-700"
            >
              Contraseña actual
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-bold text-gray-700"
            >
              Nueva contraseña
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-xs font-bold text-gray-700"
            >
              Repite la nueva
            </label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          <div className="sm:col-span-3">
            {passwordError && (
              <p
                role="alert"
                className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
              >
                {passwordError}
              </p>
            )}
            {passwordMessage && (
              <p
                role="status"
                className="mb-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700"
              >
                {passwordMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? 'Cambiando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-lg font-bold text-red-900">Zona de peligro</h2>
        <p className="mt-1 text-sm text-red-900/90">
          Borrar tus datos elimina el progreso de todas las guías y tu equipo. No
          se puede deshacer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resetting ? 'Borrando...' : 'Borrar todo mi progreso'}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-100"
          >
            Cerrar sesión
          </button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm font-semibold text-red-900">
            {message}
          </p>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Privacidad</h2>
        <p className="mt-1 text-sm text-gray-600">
          Las contraseñas se guardan cifradas con scrypt y las sesiones usan
          cookies httpOnly. Nadie más puede ver ni modificar tu progreso sin
          iniciar sesión con tu cuenta.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-gray-900">
        {loading ? '—' : value}
      </p>
    </div>
  );
}
