'use client';

// Compatibilidad: el estado del equipo ahora vive en AccountProvider, que
// también gestiona la sesión y el progreso sincronizado.
export { useTeam } from '@/components/AccountProvider';
