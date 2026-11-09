import { ImageResponse } from 'next/og';

export const alt = 'Pokédex + Guías — Completa todos los juegos Pokémon';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #020617 0%, #7f1d1d 55%, #312e81 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#fca5a5',
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 999, background: '#ef4444' }} />
          Pokédex + Guías
        </div>
        <div
          style={{
            marginTop: 24,
            maxWidth: 900,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.05,
          }}
        >
          Completa todos los juegos Pokémon
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: '#cbd5e1' }}>
          1025 especies · 36 guías · legendarios · shinies · progreso por usuario
        </div>
      </div>
    ),
    size
  );
}
