// 08.11 : « Pourquoi sur la vrai app, j'ai pas EXACTEMENT cette même vue??? » — une app ouverte avant un déploiement gardait l'ancienne version sans le dire.
import { describe, expect, it } from 'vitest';
import { versionDiffere } from '../../src/ui/NouvelleVersion';

const html = (nom: string) => `<!doctype html><head><script type="module" crossorigin src="/assets/${nom}"></script></head>`;

describe('Nouvelle version de l’app', () => {
  it('signale un script principal servi différent de celui de la page', () => {
    expect(versionDiffere(html('index-a5de6b44.js'), '/assets/index-JkZJS3oP.js')).toBe(true);
  });
  it('se tait quand le site sert la même version', () => {
    expect(versionDiffere(html('index-JkZJS3oP.js'), '/assets/index-JkZJS3oP.js')).toBe(false);
  });
  it('se tait quand une des deux versions est inconnue (page d’erreur, mode développement)', () => {
    expect(versionDiffere('<html>Erreur 503</html>', '/assets/index-JkZJS3oP.js')).toBe(false);
    expect(versionDiffere(html('index-JkZJS3oP.js'), '/src/main.tsx')).toBe(false);
    expect(versionDiffere(html('index-JkZJS3oP.js'), null)).toBe(false);
  });
});
