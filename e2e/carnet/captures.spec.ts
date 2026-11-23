// Captures de référence du Carnet (toHaveScreenshot) sur la fixture, jour et horloge figés, thème clair, aux trois tailles : elles ne disent
// pas « c'est beau », elles disent « ça n'a pas bougé sans qu'on le veuille ». Seuil : maxDiffPixelRatio de playwright.config.ts.
// Une évolution voulue : `npx playwright test e2e/carnet/captures --update-snapshots`, puis REGARDER les nouvelles captures avant de les garder.
import { test, expect } from '@playwright/test';
import { poserFixtureCarnet } from '../outils/carnet';
import { ECRANS } from '../outils/ecransCarnet';

const RETENUS = ['liste', 'carnet-frigo', 'chambre-froide', 'ventilation', 'comparer', 'fiche-article', 'menu-plus'];

test.describe('Carnet : captures de référence', () => {
  for (const ecran of ECRANS.filter((e) => RETENUS.includes(e.id))) {
    test(`capture ${ecran.id}`, async ({ page }) => {
      await poserFixtureCarnet(page);
      await ecran.aller(page);
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`carnet-${ecran.id}.png`, { animations: 'disabled', caret: 'hide' });
    });
  }
});
