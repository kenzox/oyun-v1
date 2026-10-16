import { test, expect } from '@playwright/test';

test('TV creates a room, two phones join, all six games start and reconnect works', async ({ browser, page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Oda oluştur' }).click();
  await expect(page.locator('.room-code')).toBeVisible();
  const code = await page.locator('.room-code').textContent();
  const contexts = await Promise.all([browser.newContext({ viewport: { width: 390, height: 844 } }), browser.newContext({ viewport: { width: 390, height: 844 } })]);
  const phones = await Promise.all(contexts.map(c => c.newPage()));
  for (const [i, phone] of phones.entries()) {
    await phone.goto(`/?room=${code}`);
    await phone.getByLabel('Sana ne diyelim?').fill(['Ada', 'Ege'][i]);
    await phone.getByRole('button', { name: 'Ben de varım!' }).click();
    await expect(phone.getByText('Herkes hazır mı?')).toBeVisible();
  }
  await expect(page.locator('#player-count')).toHaveText('2 / 8 bağlı');
  await phones[0].reload(); await expect(phones[0].getByText('Herkes hazır mı?')).toBeVisible();
  await expect(page.locator('#player-list .player')).toHaveCount(2);
  for (const id of ['sling', 'archery', 'snake', 'pong', 'draw', 'balance']) {
    await page.locator(`[data-game="${id}"]`).click();
    await page.getByRole('button', { name: 'Oyunu başlat' }).click();
    await expect(page.locator('#board')).toBeVisible();
    await expect(phones[0].locator('#timer')).toBeVisible();
    if (id === 'sling') {
      await phones[0].getByRole('button', { name: '45° orta güçte atış yap' }).click();
      await expect(page.locator('#scores .score').first()).not.toHaveText('0', { timeout: 8000 });
    }
    if (id === 'draw') {
      const word = phones[0].locator('#secret-word'); await expect(word).not.toHaveText('Görev geliyor…');
      await expect(phones[1].locator('#secret-word')).toHaveCount(0);
      await phones[1].getByLabel('Sence bu ne?').fill(await word.textContent());
      await phones[1].getByRole('button', { name: 'Tahmin et' }).click();
      await expect(page.locator('#scores .score').nth(1)).toHaveText('30');
    }
    await page.getByRole('button', { name: 'Oyundan çık' }).click();
    await page.getByRole('button', { name: 'Oyun rafına dön' }).click();
    await expect(page.locator('.cards')).toBeVisible();
  }
  await Promise.all(contexts.map(c => c.close()));
});
