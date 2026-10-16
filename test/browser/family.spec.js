import { test, expect } from '@playwright/test';
import { GAMES } from '../../server/games.js';

test('TV creates a room, two phones join, all registered games start, pause and reconnect work', async ({ browser, page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Oda oluştur' }).click();
  await expect(page.locator('.room-code')).toBeVisible();
  const code = await page.locator('.room-code').textContent();
  const contexts = await Promise.all([browser.newContext({ viewport: { width: 390, height: 844 } }), browser.newContext({ viewport: { width: 390, height: 844 } })]);
  const phones = await Promise.all(contexts.map(c => c.newPage()));
  phones.forEach(phone => phone.on('pageerror', error => errors.push(error.message)));
  for (const [i, phone] of phones.entries()) {
    await phone.goto(`/?room=${code}`);
    await phone.getByLabel('Sana ne diyelim?').fill(['Ada', 'Ege'][i]);
    await phone.getByRole('button', { name: 'Ben de varım!' }).click();
    await expect(phone.getByText('Herkes hazır mı?')).toBeVisible();
  }
  await expect(page.locator('#player-count')).toHaveText('2 / 8 bağlı');
  await phones[0].reload(); await expect(phones[0].getByText('Herkes hazır mı?')).toBeVisible();
  await expect(page.locator('#player-list .player')).toHaveCount(2);
  await expect(page.locator('.game-card')).toHaveCount(GAMES.length);
  for (const { id } of GAMES) {
    await page.locator(`[data-game="${id}"]`).click();
    await page.getByRole('button', { name: 'Oyunu başlat' }).click();
    await expect(page.locator('#board')).toBeVisible();
    await expect(phones[0].locator('#timer')).toBeVisible();
    if (id === 'pool3d' || id === 'race3d') {
      await expect(page.locator('#three-stage')).toHaveAttribute('data-state', 'ready');
      await expect(page.locator('#board')).toHaveAttribute('data-renderer', 'three');
    }
    if (id === 'race' || id === 'race3d') {
      await expect(phones[0].locator('#race-status')).toContainText(id === 'race3d' ? '1/4 etap' : '1/3 tur');
      await phones[0].getByRole('button', { name: 'Fren: kapalı' }).click();
      await expect(phones[0].getByRole('button', { name: 'Fren: açık' })).toHaveAttribute('aria-pressed', 'true');
      await phones[0].getByRole('button', { name: 'Turbo' }).click();
      await expect(phones[0].getByRole('button', { name: 'Turbo:' })).toBeDisabled();
      if (id === 'race3d') {
        await phones[0].getByRole('button', { name: '2 saniye geri git' }).click();
        await phones[0].getByRole('button', { name: 'Son etaba dön' }).click();
      }
      await phones[0].locator('#race-steer').focus(); await phones[0].locator('#race-steer').press('ArrowLeft');
    }
    if (id === 'pool' || id === 'pool3d') {
      await expect(phones[1].getByRole('button', { name: 'Istakayla vur' })).toBeDisabled();
      await phones[0].getByRole('button', { name: 'Istakayla vur' }).click();
      await expect(phones[0].locator('#pool-status')).toContainText('Toplar hareket ediyor');
      await expect(phones[0].getByRole('button', { name: 'Istakayla vur' })).toBeDisabled();
      await expect(phones[0].locator('#pool-status')).not.toContainText('Toplar hareket ediyor', { timeout: 18000 });
    }
    if (id === 'tennis') {
      await expect(phones[0].locator('.team-identity')).toContainText('Mavi takım');
      await expect(phones[1].locator('.team-identity')).toContainText('Mercan takım');
      await phones[0].locator('#tennis-position').focus(); await phones[0].locator('#tennis-position').press('ArrowRight');
      await phones[0].getByRole('button', { name: 'Güçlü vuruş' }).click();
      await expect(phones[0].getByRole('button', { name: 'Güçlü vuruş' })).toBeDisabled();
    }
    if (id === 'laser') {
      await expect(phones[0].locator('#laser-pad')).toBeVisible();
      await phones[0].locator('#laser-pad').click();
      await phones[0].getByRole('button', { name: 'Lazeri ateşle' }).click();
      await expect(phones[0].locator('#laser-status')).toContainText('4/5 enerji');
      await phones[0].getByRole('button', { name: 'Doldur' }).click();
      await expect(phones[0].locator('#laser-status')).toContainText('doluyor');
      await expect(phones[0].locator('#laser-status')).toContainText('5/5 enerji');
    }
    if (id === 'golf') {
      await phones[0].getByRole('button', { name: 'Topa vur' }).click();
      await expect(phones[0].getByRole('button', { name: 'Topa vur' })).toBeDisabled();
      await expect(page.locator('#scores .score').first()).toHaveText('80', { timeout: 10000 });
      await expect(phones[0].locator('#golf-status')).toContainText('Deliğe girdi');
    }
    if (id === 'moles') {
      await expect(phones[0].locator('[data-mole]')).toHaveCount(9);
      await expect(async () => {
        await phones[0].locator('.mole-button.mole:not(:disabled)').first().click({ timeout: 3000 });
        await expect(phones[0].locator('#my-score')).not.toHaveText('0', { timeout: 1000 });
      }).toPass({ timeout: 10000 });
    }
    if (id === 'sling') {
      await page.getByRole('button', { name: 'Duraklat' }).click();
      await expect(phones[0].getByText('Mola zamanı.', { exact: false })).toBeVisible();
      await expect(phones[0].getByRole('button', { name: 'Atış yap' })).toBeDisabled();
      const frozenTime = await page.locator('#timer').textContent();
      await page.waitForTimeout(1200);
      await expect(page.locator('#timer')).toHaveText(frozenTime);
      await page.getByRole('button', { name: 'Devam et' }).click();
      await phones[0].getByRole('button', { name: 'Atış yap' }).click();
      await expect(page.locator('#scores .score').first()).not.toHaveText('0', { timeout: 8000 });
    }
    if (id === 'memory') {
      await expect(phones[0].locator('[data-tile]')).toHaveCount(4);
      await expect(phones[0].locator('[data-tile]').first()).toBeDisabled();
      await expect(phones[0].locator('[data-tile]').first()).toBeEnabled({ timeout: 6000 });
      await phones[0].locator('[data-tile]').first().click();
      await expect(phones[0].locator('#memory-status')).toContainText(/1 \/ 2|Bu kez olmadı/);
    }
    if (id === 'river') {
      await expect(phones[0].locator('#river-hud')).toContainText('kalkan');
      await phones[0].locator('#ship-position').focus();
      await phones[0].locator('#ship-position').press('ArrowRight');
    }
    if (id === 'volley' || id === 'hockey') {
      await expect(phones[0].locator('.team-identity')).toContainText('Mavi takım');
      await expect(phones[1].locator('.team-identity')).toContainText('Mercan takım');
      if (id === 'volley') await phones[0].getByRole('button', { name: 'Zıpla!' }).click();
      else await expect(phones[0].locator('#hockey-pad')).toBeVisible();
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
  expect(errors).toEqual([]);
  await Promise.all(contexts.map(c => c.close()));
});
