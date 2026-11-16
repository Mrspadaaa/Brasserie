// @vitest-environment jsdom
// fx3 : règles corrigées après le second passage (DEFAUTS-PORT2) — dose cochée (« 0 g si coché » faux), geste chiffré du verdict,
// visée de la recette, tuiles de fermentation, « Au journal » sans carte vide. Fixtures : le brassin NEIPA de la maquette p2a
// (Citra 85 g J+2, Galaxy 43 g J+6, Mosaic 43 g J+9 sur 19 L : 171 g, 9,0 g/L).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewerProposalCard, doseGParLitre, ecartDoseG } from '../../src/ui/BrewerProposalCard';
import { Controle, Verdict, gesteChiffre } from '../../src/ui/companion/reponse';
import { contexteBrassin, doseTotale, questionsFermentation, viseeDeRecette } from '../../src/ui/companion/contexte';

afterEach(cleanup);

const changes = [
  { id: 'a', path: 'hops.7.dayOffset', label: 'Mosaic · contact J+9', before: 3, value: 2, unit: 'j', reason: 'Un jour de moins.' },
  { id: 'b', path: 'dryHop.tempC', label: 'Température du dry hop', before: 19, value: 17, unit: '°C', reason: 'Plus froid.' },
  { id: 'c', path: 'hops.7.weightG', label: 'Mosaic · J+9', before: 43, value: 35, unit: 'g', reason: 'Facultatif : dose totale 9,0 → 8,6 g/L si cochée.' }
];
const recette = {
  name: 'New England IPA',
  volumeL: 19,
  hops: [
    { name: 'Citra', stage: 'dryHop', weightG: 85, dayOffset: 2 },
    { name: 'Galaxy', stage: 'dryHop', weightG: 43, dayOffset: 6 },
    { name: 'Mosaic', stage: 'dryHop', weightG: 43, dayOffset: 9 },
    { name: 'Magnum', stage: 'boil', weightG: 20 }
  ],
  fermentation: [
    { kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 },
    { kind: 'garde', name: 'Garde', tempC: 2, days: 7 }
  ]
};

describe('dose totale de la proposition (règle de calcul)', () => {
  it('ligne facultative décochée : 0 g sur les cochées, −8 g si toute la proposition est cochée', () => {
    expect(ecartDoseG(changes, ['a', 'b'])).toEqual({ existe: true, ecartG: 0, ecartToutG: -8 });
  });
  it('plusieurs lignes de dose : seules les cochées comptent dans ecartG, toutes dans ecartToutG', () => {
    const deux = [
      ...changes,
      { id: 'd', path: 'hops.6.weightG', label: 'Galaxy · J+6', before: 43, value: 50, unit: 'g', reason: '' }
    ];
    expect(ecartDoseG(deux, ['d'])).toEqual({ existe: true, ecartG: 7, ecartToutG: -1 });
    expect(ecartDoseG(deux, ['a', 'b', 'c', 'd'])).toEqual({ existe: true, ecartG: -1, ecartToutG: -1 });
  });
  it('aucune dose qui change : existe est faux (rien à dire)', () => {
    expect(ecartDoseG(changes.slice(0, 2), ['a', 'b']).existe).toBe(false);
    expect(ecartDoseG([{ id: 'x', path: 'hops.1.weightG', label: 'x', before: 10, value: 'beaucoup', unit: 'g', reason: '' } as never], ['x']).existe).toBe(false);
  });
  it('g/L : 171 g sur 19 L → 9,0 ; 163 g → 8,6 ; l’inconnu n’est jamais 0', () => {
    expect(doseGParLitre(171, 19)).toBe('9,0');
    expect(doseGParLitre(171 - 8, 19)).toBe('8,6');
    expect(doseGParLitre(undefined, 19)).toBeNull();
    expect(doseGParLitre(171, undefined)).toBeNull();
    expect(doseGParLitre(171, 0)).toBeNull();
  });
  it('la carte dit « 9,0 g/L inchangée · 8,6 g/L si cochée » ligne facultative décochée', () => {
    render(<BrewerProposalCard proposal={{ target: 'recipe', title: 'Raccourcir', changes }} disabled={false} draft={false} dosesTotalesG={171} volumeL={19} onDecide={async () => {}} />);
    const total = document.querySelector('.cmp-total') as HTMLElement;
    expect(total.textContent?.replace(/\s/g, ' ')).toMatch(/Dose totale\s*9,0\s*g\/L inchangée · 8,6\s*g\/L si cochée/);
  });
  it('une fois la ligne facultative cochée, les deux valeurs se rejoignent : une seule, « avec ta sélection »', () => {
    render(<BrewerProposalCard proposal={{ target: 'recipe', title: 'Raccourcir', changes }} disabled={false} draft={false} dosesTotalesG={171} volumeL={19} onDecide={async () => {}} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mosaic J+9' }));
    const total = document.querySelector('.cmp-total') as HTMLElement;
    expect(total.textContent?.replace(/\s/g, ' ')).toMatch(/8,6\s*g\/L avec ta sélection/);
    expect(total.textContent).not.toMatch(/inchangée/);
  });
  it('sans total ni volume : l’écart en grammes, « inchangé · −8 g si coché », sans g/L inventé', () => {
    render(<BrewerProposalCard proposal={{ target: 'recipe', title: 'Raccourcir', changes }} disabled={false} draft={false} onDecide={async () => {}} />);
    const total = document.querySelector('.cmp-total') as HTMLElement;
    expect(total.textContent?.replace(/\s/g, ' ')).toMatch(/Écart de dose\s*inchangé · −8\s*g si coché/);
    expect(total.textContent).not.toMatch(/g\/L/);
  });
});

describe('geste chiffré du verdict', () => {
  it('« J+9 » + changement de contact → Mosaic : 3 → 2 jours de contact', () => {
    expect(gesteChiffre('J+9', changes)).toEqual({ houblon: 'Mosaic', avant: 3, apres: 2, suite: 'jours de contact' });
    expect(gesteChiffre('J+8', changes)).toBeNull();
    expect(gesteChiffre('Ce soir', changes)).toBeNull();
    expect(gesteChiffre('J+9', undefined)).toBeNull();
    expect(gesteChiffre('J+9', [{ ...changes[0], unit: '°C' }])).toBeNull();
  });
  it('le verdict barre l’ancienne valeur et dit la nouvelle', () => {
    render(
      <Verdict
        advice={{ level: 'attention', summary: 'Herbacé : écourte le contact du dry hop.', action: 'Purge les pellets du Galaxy ce soir ; pour le Mosaic J+9, 2 jours de contact au lieu de 3.' }}
        changes={changes}
      />
    );
    const gestes = document.querySelectorAll('.cmp-geste');
    expect(gestes).toHaveLength(2);
    expect(gestes[1].querySelector('s')?.textContent).toBe('3');
    expect(gestes[1].textContent).toMatch(/J\+9\s*Mosaic\s*:\s*3\s*→\s*2 jours de contact\./);
    expect(gestes[0].textContent).toMatch(/Ce soir\s*Purge les pellets du Galaxy\./);
  });
  it('sans changement correspondant, le texte de la réponse reste tel quel', () => {
    render(<Verdict advice={{ level: 'attention', summary: 'S', action: 'Pour le Mosaic J+9, 2 jours de contact au lieu de 3.' }} />);
    expect(document.querySelector('.cmp-geste s')).toBeNull();
    expect(document.querySelector('.cmp-geste')?.textContent).toMatch(/2\sjours de contact au lieu de 3\./);
  });
});

describe('« Au journal » seul', () => {
  it('sans contrôle à surveiller : le bouton sans carte autour ; avec : dans la carte', () => {
    const { container, rerender } = render(<Controle watch="" onKeep={() => {}} />);
    expect(container.querySelector('.cmp-carte')).toBeNull();
    expect(screen.getByRole('button', { name: 'Au journal' })).toBeTruthy();
    rerender(<Controle watch="Goût à J+10, avant la garde : l’herbacé doit reculer." onKeep={() => {}} />);
    expect(container.querySelector('.cmp-carte .cmp-btn')).not.toBeNull();
  });
});

describe('contexte du brassin (visée, tuiles, jour)', () => {
  it('la visée est le palier primaire de la recette, jamais une moyenne inventée', () => {
    expect(viseeDeRecette(recette)).toBe(19);
    expect(viseeDeRecette({ fermentation: [{ kind: 'garde', tempC: 2, days: 7 }] })).toBeUndefined();
    expect(viseeDeRecette({ fermentation: [{ kind: 'reposDiacetyle', tempC: 21, days: 2 }] })).toBe(21);
    expect(viseeDeRecette({})).toBeUndefined();
  });
  it('contexte : numéro, jour du brassage, volume, jalons, visée ; sans levurage, le jour vient de la date de brassage', () => {
    const maintenant = new Date(2026, 10, 9, 12).getTime(); // 9 nov. 2026
    const c = contexteBrassin({ kind: 'batch', id: 'LOT-031' }, { brewDate: '2026-11-01' }, recette, undefined, maintenant);
    expect(c.numero).toBe('31');
    expect(c.jour).toBe(8);
    expect(c.volumeL).toBe(19);
    expect(c.viseeC).toBe(19);
    expect(c.jalons.map((j) => `${j.nom} J+${j.jour} ${j.g} g`)).toEqual(['Citra J+2 85 g', 'Galaxy J+6 43 g', 'Mosaic J+9 43 g']);
    expect(doseTotale(c.jalons)).toBe(171);
  });
  it('tuiles en fermentation : pression, densité, prochain dry hop avec sa dose, garde', () => {
    const maintenant = new Date(2026, 10, 9, 12).getTime();
    const c = contexteBrassin({ kind: 'batch', id: 'LOT-031' }, { brewDate: '2026-11-04' }, recette, undefined, maintenant); // J+5 : Galaxy J+6
    expect(questionsFermentation(c)).toEqual([
      { question: 'La pression monte : je purge ?', icone: 'pression' },
      { question: 'Densité : je mesure quand ?', icone: 'goutte' },
      { question: 'Galaxy : je garde 43 g ?', icone: 'feuille' },
      { question: 'Combien de jours de garde ?', icone: 'calendrier' }
    ]);
  });
  it('sans dry hop à venir, pas de tuile de houblon inventée', () => {
    const maintenant = new Date(2026, 10, 20, 12).getTime(); // J+19 : tous passés
    const c = contexteBrassin({ kind: 'batch', id: 'LOT-031' }, { brewDate: '2026-11-01' }, recette, undefined, maintenant);
    expect(questionsFermentation(c).map((q) => q.icone)).toEqual(['pression', 'goutte', 'calendrier']);
  });
});
