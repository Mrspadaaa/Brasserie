// Lot 4 du Carnet (LISTE.md, mission 2026-11-23-carnet-en-ligne) : article, Comparer, photos, CSP. L-23 à L-29.
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { lireCarnet, titreDePhrase } from '../../src/domain/carnets/modele';
import { tableau } from '../../src/domain/carnets/comparer';
import { Comparer } from '../../src/ui/carnets/Comparer';
import { Photos } from '../../src/ui/carnets/Photos';
import { PictoObjet, pictoDe } from '../../src/ui/carnets/pictos';
import type { CreativeItem } from '../../src/types';

afterEach(cleanup);

const article = (id: string, extra: Record<string, unknown> = {}) => ({ id, lecture: 'lue', valeurs: {}, ...extra });
const carnet = (articles: unknown[], extra: Record<string, unknown> = {}, statut = 'research') => lireCarnet({
  id: 'ZZ-L4', type: 'carnet', title: 'ZZ TEST — Chambre froide', status: statut,
  carnet: { version: 1, creeLe: '2026-11-21T08:00:00.000Z', phrase: 'chambre froide', criteres: [], facons: [], articles, notes: [], photos: [], ...extra }
} as unknown as CreativeItem)!;

describe('L-23 : la CSP laisse passer les photos des vendeurs, et rien de plus', () => {
  const csp = (() => {
    const fb = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../firebase.json'), 'utf8'));
    const h = fb.hosting.headers.flatMap((x: { headers: { key: string; value: string }[] }) => x.headers).find((x: { key: string }) => x.key === 'Content-Security-Policy');
    return Object.fromEntries(h.value.split(';').map((d: string) => d.trim().split(/\s+/)).map(([k, ...v]: string[]) => [k, v])) as Record<string, string[]>;
  })();
  it('img-src admet une image https d’un vendeur quelconque (cdn.ggmgastro.com)', () => {
    const permis = (url: string) => csp['img-src'].some(s => s === 'https:' || (s.startsWith('https://') && new URL(url).hostname.endsWith(s.replace(/^https:\/\/(\*\.)?/, ''))));
    expect(permis('https://cdn.ggmgastro.com/media/catalog/product/x.jpg')).toBe(true);
    expect(csp['img-src']).not.toContain('http:');
    expect(csp['img-src']).not.toContain('*');
  });
  it('les scripts restent fermés : ni « https: », ni « * », ni « data: » dans script-src ; default-src et object-src inchangés', () => {
    for (const s of ['https:', '*', 'data:', 'http:']) expect(csp['script-src']).not.toContain(s);
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
  });
});

describe('L-25 : les entités des articles lus avant CRP-2 sont décodées à la lecture', () => {
  it('« Tôle d&amp;#039;acier » (encodé deux fois, jamais décodé au serveur) se lit « Tôle d’acier »', () => {
    const c = carnet([article('a1', { nom: 'T&ocirc;le d&amp;#039;acier', valeurs: { 'Mat&amp;eacute;riau :': { valeur: 'T&ocirc;le d&amp;#039;acier galvanis&eacute;e', origine: 'page' } } })]);
    const a = c.carnet.articles[0];
    expect(a.nom).toBe("Tôle d'acier");
    expect(Object.keys(a.valeurs)).toEqual(['Matériau']);
    expect(a.valeurs['Matériau'].valeur).toBe("Tôle d'acier galvanisée");
  });
  it('un texte sans entité reste tel quel, et « &lt;b&gt; » ne devient jamais une balise', () => {
    const c = carnet([article('a1', { nom: 'Cuve 30 L & robinet', valeurs: { note: { valeur: '&lt;b&gt;x', origine: 'page' } } })]);
    expect(c.carnet.articles[0].nom).toBe('Cuve 30 L & robinet');
    expect(c.carnet.articles[0].valeurs.note.valeur).toBe('<b>x');
  });
});

describe('L-29 : le prix retiré du titre ne laisse pas « budget » pendant', () => {
  it.each([
    ['Fermenteur conique inox 30 L, budget 400 CHF', 'Fermenteur conique inox 30 L'],
    ['Fermenteur conique inox 30 L, budget max 400 CHF', 'Fermenteur conique inox 30 L'],
    ['Fermenteur conique inox 30 L, budget maximum de 400 CHF', 'Fermenteur conique inox 30 L'],
    ['Pompe inox max 250 CHF', 'Pompe inox']
  ])('« %s » → « %s »', (phrase, titre) => { expect(titreDePhrase(phrase)).toBe(titre); });
});

describe('L-28 : pictos, jamais une lettre seule, jamais le picto du carnet sur un autre objet', () => {
  const planning = ['Sol, murs & évacuation (béton, revêtement, peinture food-safe)', 'Rangement / étagères inox & déménagement', 'Robinetterie & tuyaux raccords (fait par soi-même)',
    'Achat & installation évier principal + douchette', 'Refaire évier — bloqué (attendre vis pieds)', 'Sol — matières premières + outils (peut faire en 2x)',
    'Achat brasserie : moulin à malt + bac etc.', 'Frigo + congel', 'Armoire de rangement malte', 'Conformité — dossiers SAAV + SEn + assurances', 'Hotte recyclage',
    'Armoire de rangement extérieur', 'Armoire de rangement toxique', 'Extincteur', 'Installation électrique 27A (2027)', 'Embouteillage — station complète (2027)',
    '2ème évier (2027)', 'Jalon — Peut brasser au local (sans autorisation vente)', 'Jalon — Conformité complète — Peut vendre officiellement'];
  it('les carnets du Planning ont chacun un dessin', () => {
    expect(planning.filter(t => pictoDe(t) === 'objet')).toEqual([]);
  });
  it('les deux jalons ont le picto du jalon (pas seulement leur titre pour se distinguer d’un objet)', () => {
    expect(planning.filter(t => /^Jalon/.test(t)).map(t => pictoDe(t))).toEqual(['jalon', 'jalon']);
  });
  it('un lien de levure dans un carnet « Pompe » ne prend pas le picto de la pompe', () => {
    expect(pictoDe('Brewferm brewing yeast Lager 6 g', undefined, 'ZZ TEST — Pompe de transfert')).not.toBe('pompe');
  });
  it('l’objet sans dessin porte un dessin neutre, aucune lettre', () => {
    const { container } = render(<PictoObjet nom="objet" lettre="M" />);
    expect(container.querySelector('text')).toBeNull();
    expect(container.textContent).toBe('');
  });
});

describe('L-27 : Comparer d’un carnet Choisi montre l’article choisi', () => {
  it('un article lu et deux liens non lus : l’article lu est dans le tableau, pas « le tableau naît au 2e article »', () => {
    const c = carnet([article('a1', { nom: 'Fermenteur 30 L choisi', prixCentimes: 40000, devise: 'CHF' }), article('a2', { url: 'https://x.ch/a', domaine: 'x.ch', lecture: 'illisible' }), article('a3', { url: 'https://y.ch/b', domaine: 'y.ch', lecture: 'illisible' })],
      { choix: { articleId: 'a1', pourquoi: 'le seul lu', ecartes: [], le: '2026-11-22T08:00:00.000Z', remplaces: [] } }, 'validated');
    const { container } = render(<Comparer titre={c.title} statut="validated" tableau={tableau(c)} onRetour={() => {}} />);
    expect(screen.queryByText(/naît au 2e article/)).toBeNull();
    expect(within(container.querySelector<HTMLElement>('table.cn-tableau-comparer')!).getByText('Fermenteur 30 L choisi')).toBeTruthy();
  });
});

describe('L-23 / L-26 : Comparer montre la photo de l’article et ne réserve pas une case vide', () => {
  it('la photo lue d’un article (tableau) s’affiche dans l’en-tête de sa colonne, sans passer par `photos`', () => {
    const c = carnet([article('a1', { nom: 'A', photo: 'https://cdn.vendeur.ch/a.jpg' }), article('a2', { nom: 'B' })]);
    const { container } = render(<Comparer titre={c.title} statut="research" tableau={tableau(c)} onRetour={() => {}} />);
    expect([...container.querySelectorAll('thead img')].map(i => i.getAttribute('src'))).toEqual(['https://cdn.vendeur.ch/a.jpg']);
    expect(container.querySelector('thead img')!.getAttribute('referrerpolicy')).toBe('no-referrer');
  });
  it('sans photo ni picto dans aucune colonne, aucune case vide n’est réservée au-dessus des noms', () => {
    const c = carnet([article('a1', { nom: 'A' }), article('a2', { nom: 'B' })]);
    const { container } = render(<Comparer titre={c.title} statut="research" tableau={tableau(c)} onRetour={() => {}} />);
    expect(container.querySelector('.cn-cmp-vignette-place')).toBeNull();
  });
});

describe('L-24 : une photo jointe n’est plus une vignette inerte', () => {
  it('toucher la vignette l’ouvre en grand et dit qu’elle n’est pas lue', () => {
    render(<Photos photos={[{ id: 'p1', jpeg: 'data:image/jpeg;base64,AAAA', le: '2026-11-23T09:00:00.000Z' } as never]} />);
    fireEvent.click(screen.getByRole('button', { name: /Photo.*non lue/ }));
    const d = screen.getByRole('dialog');
    expect(d.querySelector('img')!.getAttribute('src')).toBe('data:image/jpeg;base64,AAAA');
    expect(within(d).getByText(/pas lue/i)).toBeTruthy();
    fireEvent.click(within(d).getByRole('button', { name: /Fermer/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('le modèle garde `lue: true` d’une photo lue', () => {
    const c = carnet([], { photos: [{ id: 'p1', jpeg: 'data:x', lue: true }] });
    expect((c.carnet.photos[0] as { lue?: boolean }).lue).toBe(true);
  });
});
