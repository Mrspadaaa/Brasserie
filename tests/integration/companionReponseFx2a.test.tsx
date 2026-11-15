// @vitest-environment jsdom
// fx2a : règles pures de la réponse (gestes datés, rythme, jalon, thermomètre), du prix et du nom des fournisseurs, de la proposition.
import { describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import {
  Controle,
  Verdict,
  creneauxReleves,
  degreDe,
  echelleThermo,
  gestesDatés,
  jalonDe,
  rythmeDe,
  typoFr,
  verbeFait
} from '../../src/ui/companion/reponse';
import { nomSansPoids, prixAffiche } from '../../src/ui/companion/fournisseurs';
import { BrewerProposalCard, ecartDoseG, estFacultatif, libelleCourt } from '../../src/ui/BrewerProposalCard';

afterEach(cleanup);

describe('gestes datés', () => {
  it('lit « ce soir » et le jalon dans le texte de l’action, sans rien inventer', () => {
    expect(gestesDatés('Purge les pellets du Galaxy ce soir ; pour le Mosaic J+9, 2 jours de contact au lieu de 3.')).toEqual([
      { quand: 'Ce soir', texte: 'Purge les pellets du Galaxy.' },
      { quand: 'J+9', texte: 'Pour le Mosaic, 2 jours de contact au lieu de 3.' }
    ]);
  });
  it('garde le repère dans la phrase quand il est au milieu d’un groupe', () => {
    expect(gestesDatés('Garde 19 °C ; le Citra de J+2 se fait pendant cette activité.')).toEqual([
      { quand: 'À faire', texte: 'Garde 19 °C.' },
      { quand: 'J+2', texte: 'Le Citra de J+2 se fait pendant cette activité.' }
    ]);
  });
  it('sans mot de moment : « À faire » sur la première ligne', () => {
    expect(gestesDatés('Rien à changer : passe au dry hop prévu.')).toEqual([{ quand: 'À faire', texte: 'Rien à changer : passe au dry hop prévu.' }]);
  });
  it('typographie : insécable avant « : » et entre nombre et unité', () => {
    expect(typoFr('La cuve dépasse 24 °C : refroidis')).toBe('La cuve dépasse 24 °C : refroidis');
  });
});

describe('rythme, jalon, thermomètre', () => {
  it('rythme et créneaux d’un suivi régulier', () => {
    expect(rythmeDe('Température et pression toutes les 30 min pendant 2 h.')).toEqual({ intervalleMin: 30, dureeMin: 120 });
    expect(rythmeDe('Surveille la densité')).toBeNull();
    expect(creneauxReleves({ intervalleMin: 30, dureeMin: 120 })).toEqual(['maintenant', '+30 min', '+1 h', '+1,5 h']);
  });
  it('jalon d’un contrôle : « J+10 » sort du texte quand il se détache', () => {
    expect(jalonDe('Goût à J+10, avant la garde : l’herbacé doit reculer.')).toEqual({ jalon: 'J+10', texte: 'Goût avant la garde : l’herbacé doit reculer.' });
    expect(jalonDe('Surveille la pression').jalon).toBeNull();
  });
  it('degré lu dans le titre ; échelle : la visée à 25 %, la mesure aux deux tiers', () => {
    expect(degreDe('La cuve dépasse 24 °C : refroidis maintenant.')).toBe(24);
    expect(degreDe('Rien de chiffré')).toBeNull();
    expect(echelleThermo(24, 19).pos(19)).toBeCloseTo(25);
    expect(echelleThermo(24, 19).pos(24)).toBeCloseTo(66.7, 0);
    expect(echelleThermo(24).pos(24)).toBeCloseTo(66.7, 0);
  });
  it('le verbe du bouton suit l’action', () => {
    expect(verbeFait('Ouvre la circulation de glycol')).toBe('C’est ouvert');
    expect(verbeFait('Baisse la consigne')).toBe('C’est fait');
  });
});

describe('rendu', () => {
  it('urgent : dalle, thermomètre, geste, rappel local ; contrôle en créneaux sans « Au journal » masqué par le code', () => {
    render(
      <>
        <Verdict
          advice={{ level: 'urgent', summary: 'La cuve dépasse 24 °C : refroidis maintenant.', action: 'Ouvre la circulation de glycol et contrôle la température toutes les 30 min.' }}
          viseeC={19}
        />
        <Controle watch="Température et pression toutes les 30 min pendant 2 h." />
      </>
    );
    expect(screen.getByRole('img', { name: /Au-dessus de 24 °C ; visée 19 °C/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /C’est ouvert · rappel dans 30\s*min/ })).toBeTruthy();
    expect(screen.getByLabelText('Relevés à prévoir').textContent).toContain('maintenant');
    expect(screen.queryByText('À surveiller')).toBeNull();
  });
  it('contrôle d’une réponse normale : la pastille J+10 et la phrase', () => {
    render(<Controle watch="Goût à J+10, avant la garde : l’herbacé doit reculer." />);
    expect(screen.getByText('J+10')).toBeTruthy();
    expect(screen.queryByText('À surveiller')).toBeNull();
  });
});

describe('fournisseurs', () => {
  it('prix à la française, nom sans poids en double', () => {
    expect(prixAffiche('CHF 9.50')).toEqual({ n: '9,50', u: 'CHF' });
    expect(prixAffiche('11.2 CHF')).toEqual({ n: '11,20', u: 'CHF' });
    expect(prixAffiche('sur demande')).toEqual({ brut: 'sur demande' });
    expect(nomSansPoids('Citra T90 pellets 100 g', '100 g')).toBe('Citra T90 pellets');
    expect(nomSansPoids('Citra T90 pellets', '100 g')).toBe('Citra T90 pellets');
  });
});

describe('proposition', () => {
  const changes = [
    { id: 'a', path: 'hops.7.dayOffset', label: 'Mosaic · contact J+9', before: 3, value: 2, unit: 'j', reason: 'Un jour de moins.' },
    { id: 'b', path: 'dryHop.tempC', label: 'Température du dry hop', before: 19, value: 17, unit: '°C', reason: 'Plus froid.' },
    { id: 'c', path: 'hops.7.weightG', label: 'Mosaic · J+9', before: 43, value: 35, unit: 'g', reason: 'Facultatif : dose totale 9,0 → 8,6 g/L si cochée.' }
  ];
  it('libellés courts, ligne facultative, écart de dose', () => {
    expect(libelleCourt('Mosaic · contact J+9')).toBe('Contact Mosaic J+9');
    expect(libelleCourt('Température du dry hop')).toBe('Temp. dry hop');
    expect(libelleCourt('Mosaic · J+9')).toBe('Mosaic J+9');
    expect(estFacultatif(changes[2])).toBe(true);
    expect(estFacultatif(changes[0])).toBe(false);
    // fx3 : ligne facultative décochée → ecartG 0 (cochées) mais ecartToutG −8 (« si cochée »).
    expect(ecartDoseG(changes, ['a', 'b'])).toEqual({ existe: true, ecartG: 0, ecartToutG: -8 });
    expect(ecartDoseG(changes, ['a', 'b', 'c'])).toEqual({ existe: true, ecartG: -8, ecartToutG: -8 });
  });
  it('la ligne facultative démarre décochée : 2 modifications, puis la dose totale se recalcule', () => {
    render(<BrewerProposalCard proposal={{ target: 'recipe', title: 'Raccourcir', changes }} disabled={false} draft={false} dosesTotalesG={171} volumeL={19} onDecide={async () => {}} />);
    expect(screen.getByRole('button', { name: 'Valider 2 modifications' })).toBeTruthy();
    expect(screen.getByText('facultatif')).toBeTruthy();
    expect(screen.getByText('Dose totale')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mosaic J+9' }));
    expect(screen.getByRole('button', { name: 'Valider 3 modifications' })).toBeTruthy();
  });
});
