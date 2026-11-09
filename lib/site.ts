export function getSiteUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicitUrl) return explicitUrl.replace(/\/$/, '');

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionUrl) return `https://${productionUrl}`;

  const previewUrl = process.env.VERCEL_URL;
  if (previewUrl) return `https://${previewUrl}`;

  return 'http://localhost:3000';
}
