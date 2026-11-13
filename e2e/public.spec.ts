import { expect, test } from '@playwright/test';

test('la portada y la navegación principal cargan', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    /completar todos los Pokémon/i
  );
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' })
  ).toBeVisible();
});

test('los filtros avanzados de la Pokédex nacional se aplican', async ({
  page,
}) => {
  await page.goto(
    '/pokedex?type=fire&strong=grass&species=starter&total=300&adv=1'
  );
  await expect(page.getByText('9 Pokémon encontrados')).toBeVisible();
  await expect(page.locator('#advanced-strong')).toHaveValue('grass');
  await expect(page.locator('#advanced-species')).toHaveValue('starter');
});

test('el modo ruta muestra las especies de una localización', async ({
  page,
}) => {
  await page.goto('/guias/red-blue-green?tab=rutas');
  await expect(
    page.getByRole('heading', { name: '¿Qué puedo capturar aquí?' })
  ).toBeVisible();
  await expect(page.getByText('Bosque Verde')).toBeVisible();
  await expect(page.getByText('Pikachu', { exact: true }).first()).toBeVisible();
});

test('el tracker shiny pide iniciar sesión a los invitados', async ({
  page,
}) => {
  await page.goto('/shiny');
  await expect(
    page.getByText('Inicia sesión para guardar tus cacerías')
  ).toBeVisible();
});

test('el buscador móvil se puede abrir', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir búsqueda' }).click();
  await expect(page.locator('#global-search-mobile')).toBeVisible();
});
