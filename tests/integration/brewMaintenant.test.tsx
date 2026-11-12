// Port C (mission brassage-zero) : la carte « Maintenant » de p2c, mots exacts de build.mjs (E1 relevé dû, E3 paire hors cible).
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewMaintenant, zoneDeValeur, type MaintenantMesure, type OptionCorrection, type Zone } from '../../src/ui/BrewMaintenant';
import type { MeasureScale } from '../../src/ui/BrewDayMeasurements';

afterEach(cleanup);

const fmtC = (n: number) => String(n).replace('.', ',');
const echelleMaische: MeasureScale = { min: 61, max: 73, cible: true, bandMin: 66, bandMax: 68, milieu: 67, ticks: [61, 66, 68, 73], fmt: fmtC };
const echelleDensite: MeasureScale = { min: 1.05, max: 1.07, cible: true, bandMin: 1.059, bandMax: 1.063, milieu: 1.061, ticks: [1.05, 1.059, 1.063, 1.07], fmt: (n) => n.toFixed(3).replace('.', ',') };
const sansCible: MeasureScale = { min: 90, max: 102, cible: false, bandMin: 96, bandMax: 96, milieu: 96, ticks: [90, 102], fmt: fmtC };

const ZONES: Zone[] = [
  { borne: 'sous', libelle: 'sous 66', etDonc: '≈ 0,6 L d’eau bouillante par °C, remuer' },
  { borne: 'dans', libelle: '66–68', etDonc: 'rien : l’horloge tourne, pH à 13 h 15' },
  { borne: 'sur', libelle: 'sur 68', etDonc: '≈ 0,4 L d’eau froide par °C, remuer' }
];
const NOTE = '≈ calculé par l’app · pas de relevé ce palier : l’horloge tourne quand même';

const baseMaische = (): Omit<MaintenantMesure, 'valeur' | 'onPose' | 'onEnregistrer'> => ({
  variante: 'mesure', kind: 'temperature', scale: echelleMaische, depart: 67, unite: '°C',
  titre: 'Maische à cœur', sousTitre: 'cible 67 °C · palier lancé à 13 h 05', zones: ZONES, note: NOTE
});

function Banc({ onEnregistrer = () => {}, enregistre, init = null, ...reste }: Partial<MaintenantMesure> & { init?: number | null }) {
  const [v, setV] = useState<number | null>(init);
  return <BrewMaintenant {...baseMaische()} {...reste} valeur={v} onPose={setV} onEnregistrer={onEnregistrer} enregistre={enregistre} />;
}

describe('BrewMaintenant · relevé dû (E1)', () => {
  it('dit les mots de p2c avant la pose : « ? », verdict d’invite, trois bandes, Enregistrer désactivé', () => {
    const { container } = render(<Banc />);
    expect(screen.getByText('Maintenant · relevé dû')).toBeVisible();
    expect(screen.getByText('Maische à cœur')).toBeVisible();
    expect(screen.getByText('cible 67 °C · palier lancé à 13 h 05')).toBeVisible();
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('?°C');
    expect(screen.getByText('Toucher le pouce pose 67,0 · ou la piste, puis ±0,1')).toBeVisible();
    expect(screen.getByText('Et donc, selon ce que tu lis')).toBeVisible();
    expect(screen.getByText('sous 66')).toBeVisible();
    expect(screen.getByText('66–68')).toBeVisible();
    expect(screen.getByText('sur 68')).toBeVisible();
    expect(screen.getByText('≈ 0,6 L d’eau bouillante par °C, remuer')).toBeVisible();
    expect(screen.getByText('rien : l’horloge tourne, pH à 13 h 15')).toBeVisible();
    expect(screen.getByText('≈ 0,4 L d’eau froide par °C, remuer')).toBeVisible();
    expect(screen.getByText(NOTE)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(container.querySelector('[aria-current="true"]')).toBeNull();
    // jamais type="number" (saisie mobile) : un curseur natif, des boutons ±pas
    expect(container.querySelector('input[type="number"]')).toBeNull();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'moins 0,1' })).toHaveTextContent('−0,1');
    expect(screen.getByRole('button', { name: 'plus 0,1' })).toHaveTextContent('+0,1');
  });

  it('un toucher sur le pouce (aucune valeur) pose la cible : 67,0, dans la cible, bande 66–68 allumée', () => {
    const { container } = render(<Banc />);
    fireEvent.pointerUp(screen.getByRole('slider'), { target: { value: '67' } });
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('67,0°C');
    expect(screen.getByText('✓ dans la cible · Enregistrer')).toBeVisible();
    const allumee = container.querySelectorAll('[aria-current="true"]');
    expect(allumee).toHaveLength(1);
    expect(allumee[0].textContent).toContain('66–68');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  it('la piste pose une valeur : sous 66, la bande « sous » s’allume et le verdict dit ▼ hors cible', () => {
    const { container } = render(<Banc />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '65' } });
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('65,0°C');
    expect(screen.getByText('▼ hors cible : voir la bande en couleur')).toBeVisible();
    expect(container.querySelector('[aria-current="true"]')!.textContent).toContain('sous 66');
  });

  it('sur 68 : ▲ et la bande « sur » s’allume', () => {
    const { container } = render(<Banc />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '69.5' } });
    expect(screen.getByText('▲ hors cible : voir la bande en couleur')).toBeVisible();
    expect(container.querySelector('[aria-current="true"]')!.textContent).toContain('sur 68');
  });

  it('±0,1 part de la cible quand rien n’est posé, puis avance au pas sans dérive flottante', () => {
    render(<Banc />);
    fireEvent.click(screen.getByRole('button', { name: 'plus 0,1' }));
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('67,1°C');
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'moins 0,1' }));
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('66,8°C');
  });

  it('±0,1 ne sort pas de l’échelle', () => {
    render(<Banc init={73} />);
    fireEvent.click(screen.getByRole('button', { name: 'plus 0,1' }));
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('73,0°C');
  });

  it('Enregistrer renvoie la valeur posée', () => {
    const onEnregistrer = vi.fn();
    render(<Banc onEnregistrer={onEnregistrer} init={66.4} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onEnregistrer).toHaveBeenCalledWith(66.4);
  });

  it('après l’enregistrement : « ✓ Maische relevée à 13 h 05 », « Enregistré · prochain relevé : pH à 13 h 15 », plus de bouton', () => {
    render(<Banc init={67} enregistre={{ entete: '✓ Maische relevée à 13 h 05', verdict: 'Enregistré · prochain relevé : pH à 13 h 15' }} />);
    expect(screen.getByText('✓ Maische relevée à 13 h 05')).toBeVisible();
    expect(screen.getByText('Enregistré · prochain relevé : pH à 13 h 15')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull();
    expect(screen.queryByText('Maintenant · relevé dû')).toBeNull();
  });

  it('une densité garde son pas de 0,001 et sa décimale', () => {
    render(<Banc kind="densite" scale={echelleDensite} depart={1.061} unite="" titre="Densité à la coupure" sousTitre="cible 1,061" zones={undefined} note={undefined} />);
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('?');
    expect(screen.getByText('Toucher le pouce pose 1,061 · ou la piste, puis ±0,001')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'plus 0,001' }));
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('1,062');
    expect(screen.queryByText(/Et donc/)).toBeNull();
  });

  it('sans cible connue : aucune bande allumée, aucun verdict inventé, la valeur reste posable', () => {
    const { container } = render(<Banc scale={sansCible} depart={96} zones={undefined} note={undefined} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '97' } });
    expect(screen.getByTestId('maintenant-valeur').textContent).toBe('97,0°C');
    expect(container.querySelector('[aria-current="true"]')).toBeNull();
    expect(screen.queryByText(/hors cible/)).toBeNull();
    expect(screen.queryByText(/dans la cible/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  it('la valeur annoncée aux lecteurs d’écran porte nom, valeur et verdict', () => {
    render(<Banc init={65} />);
    expect(screen.getByRole('region', { name: /Maische à cœur/ })).toBeInTheDocument();
    const verdict = screen.getByText('▼ hors cible : voir la bande en couleur');
    expect(verdict.closest('[aria-live="polite"]')).not.toBeNull();
  });
});

describe('zoneDeValeur', () => {
  it('sous, dans, sur, null sans valeur ou sans cible ; la borne est dans la cible', () => {
    expect(zoneDeValeur(echelleMaische, 65.9)).toBe('sous');
    expect(zoneDeValeur(echelleMaische, 66)).toBe('dans');
    expect(zoneDeValeur(echelleMaische, 68)).toBe('dans');
    expect(zoneDeValeur(echelleMaische, 68.1)).toBe('sur');
    expect(zoneDeValeur(echelleMaische, null)).toBeNull();
    expect(zoneDeValeur(sansCible, 97)).toBeNull();
    // 1,064 − 1,063 n'est pas un flottant : la tolérance de brewDay.ts s'applique
    expect(zoneDeValeur(echelleDensite, 1.063)).toBe('dans');
  });
});

const OPTIONS: OptionCorrection[] = [
  { id: 'bouillir', titre: 'Bouillir +20 min', detail: '≈ 22 L à 1,061 · fin ~16 h 40', minutesEbullition: 20 },
  { id: 'extrait', titre: 'Extrait sec ≈ 250 g', detail: '≈ 23,4 L à 1,061 · au premier bouillon' },
  { id: 'accepter', titre: 'Accepter', detail: 'OG ≈ 1,057 · ≈ 23,4 L' }
];

describe('BrewMaintenant · paire hors cible (E3)', () => {
  const paire = (extra = {}) => (
    <BrewMaintenant variante="paire" heure="15 h 05" volumeL={27.9} volumeCibleL={28.5} densite={1.048} densiteCible={1.052}
      volumeHors densiteHors options={OPTIONS} choisi={null} onChoix={() => {}}
      note="≈ calculé par l’app · évaporation 4,5 L/h · rendement ≈ 52 %, visé ≈ 57 %" {...extra} />
  );

  it('dit les mots de p2c : les deux valeurs en ocre, leurs cibles, « Et donc, choisis : l’horloge suit » et les trois choix', () => {
    render(paire());
    expect(screen.getByText('Maintenant · relevé à 15 h 05 · hors cible')).toBeVisible();
    expect(screen.getByText('Volume')).toBeVisible();
    expect(screen.getByTestId('maintenant-volume').textContent).toBe('27,9L');
    expect(screen.getByText('cible 28,5 L')).toBeVisible();
    expect(screen.getByText('Densité')).toBeVisible();
    expect(screen.getByTestId('maintenant-densite').textContent).toBe('1,048');
    expect(screen.getByText('cible 1,052')).toBeVisible();
    expect(screen.getByText('Et donc, choisis : l’horloge suit')).toBeVisible();
    for (const o of OPTIONS) {
      const b = screen.getByRole('button', { name: (nom) => nom.startsWith(o.titre) });
      expect(within(b).getByText(o.titre)).toBeVisible();
      expect(within(b).getByText(o.detail)).toBeVisible();
      expect(b).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.getByText(/rendement ≈ 52 %, visé ≈ 57 %/)).toBeVisible();
  });

  it('toucher un choix le remonte (onChoix) et le choix posé est enfoncé', () => {
    const onChoix = vi.fn();
    const { rerender } = render(paire({ onChoix }));
    fireEvent.click(screen.getByRole('button', { name: /Bouillir \+20 min/ }));
    expect(onChoix).toHaveBeenCalledWith('bouillir');
    rerender(paire({ onChoix, choisi: 'bouillir' }));
    expect(screen.getByRole('button', { name: /Bouillir \+20 min/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Accepter/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('une valeur absente reste « ? », jamais 0 ; une cible absente ne s’écrit pas', () => {
    render(paire({ volumeL: null, densite: null, volumeCibleL: null, densiteCible: null, volumeHors: false, densiteHors: false, options: [] }));
    expect(screen.getByTestId('maintenant-volume').textContent).toBe('?L');
    expect(screen.getByTestId('maintenant-densite').textContent).toBe('?');
    expect(screen.queryByText(/cible/)).toBeNull();
    expect(screen.queryByText(/Et donc/)).toBeNull();
    expect(screen.queryByText('Maintenant · relevé à 15 h 05 · hors cible')).toBeNull();
    expect(screen.getByText('Maintenant · relevé à 15 h 05')).toBeVisible();
  });
});
