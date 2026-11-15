import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { it, expect, vi, afterEach, describe } from 'vitest';
import type { BrewerProduct } from '../../functions/src/companionTypes';

vi.mock('../../src/ui/BrewerBudget', () => ({
  BrewerBudgetCapView: ({ onLimits }: { onLimits(): void }) => <button onClick={onLimits}>Régler toutes les limites</button>
}));

import { Verdict, Controle, Pourquoi } from '../../src/ui/companion/reponse';
import { Accueil, Modes, Zero, PiedSaisie } from '../../src/ui/companion/accueil';
import { Attente, Echec, HorsLigne } from '../../src/ui/companion/attente';
import { Fournisseurs, produitsAffiches, statutStock, dateControle } from '../../src/ui/companion/fournisseurs';
import { BrewerProposalCard } from '../../src/ui/BrewerProposalCard';

afterEach(cleanup);

describe('réponse', () => {
  it('le feu allume une seule lampe selon le niveau, et « À faire » tient en une ligne', () => {
    const { container, rerender } = render(<Verdict advice={{ level: 'info', summary: 'Laisse monter.', action: 'Garde 19 °C.' }} />);
    expect(container.querySelectorAll('.cmp-feu i.cmp-on-v')).toHaveLength(1);
    expect(container.querySelectorAll('.cmp-feu i.cmp-on-a, .cmp-feu i.cmp-on-r')).toHaveLength(0);
    expect(screen.getByText('À faire')).toBeTruthy();
    rerender(<Verdict advice={{ level: 'attention', summary: 'Écourte.', action: 'Purge.' }} />);
    expect(container.querySelectorAll('.cmp-feu i.cmp-on-a')).toHaveLength(1);
    rerender(<Verdict advice={{ level: 'urgent', summary: 'Refroidis.', action: 'Ouvre le glycol.' }} />);
    expect(screen.getByRole('alert').textContent).toContain('Refroidis.');
    expect(screen.getByText('Ouvre le glycol.')).toBeTruthy();
  });

  it('« Au journal » appelle onKeep une fois puis se désactive quand gardée', () => {
    const keep = vi.fn();
    const { rerender } = render(<Controle watch="Goûte à J+10." onKeep={keep} />);
    fireEvent.click(screen.getByRole('button', { name: 'Au journal' }));
    expect(keep).toHaveBeenCalledTimes(1);
    rerender(<Controle watch="Goûte à J+10." onKeep={keep} gardee />);
    expect((screen.getByRole('button', { name: 'Ajouté au journal' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('Pourquoi montre la relecture sans nom de modèle et seulement les liens https', () => {
    render(
      <Pourquoi
        turn={{
          advice: { level: 'info', summary: 's', action: 'a', why: 'Parce que.', watch: '', question: '', evidenceIds: [] },
          evidence: [
            { id: 'e1', name: 'n', label: 'Calcul IBU', facts: ['IBU 40'], limits: [], data: {}, sources: [{ title: 'Sûr', url: 'https://exemple.ch/a' }, { title: 'Pas sûr', url: 'http://exemple.ch/b' }], model: 'gemini-secret' }
          ],
          reviewed: true,
          reviewModel: 'gemini-secret-pro',
          reviewReason: 'requested',
          contextLabel: 'Brouillon actuel',
          mode: 'deep'
        }}
      />
    );
    expect(screen.getByText('relu deux fois')).toBeTruthy();
    expect(screen.getByText('calculs refaits')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/gemini|secret/i);
    expect(screen.getByRole('link', { name: /Sûr/ }).getAttribute('href')).toBe('https://exemple.ch/a');
    expect(screen.queryByRole('link', { name: /Pas sûr/ })).toBeNull();
  });
});

describe('proposition', () => {
  const proposal = {
    target: 'journal' as const,
    title: 'Dry hop',
    changes: [
      { id: 'a', path: 'a', label: 'Contact Mosaic', before: 3, value: 2, reason: 'Moins d’herbe.', unit: 'j' },
      { id: 'b', path: 'b', label: 'Température', before: 19, value: 17, reason: '', unit: '°C' },
      { id: 'c', path: 'c', label: 'Nom', before: 'Ancien', value: 'Nouveau', reason: '' }
    ]
  };
  it('une case par changement, barres pour les nombres, valider suit la sélection', async () => {
    const decide = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<BrewerProposalCard proposal={proposal} draft={false} disabled={false} onDecide={decide} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(container.querySelector('.cmp-jours')).toBeTruthy();
    expect(container.querySelector('.cmp-ech')).toBeTruthy();
    expect(screen.getByText('Ancien')).toBeTruthy();
    expect(screen.getByText('Nouveau')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Nom' }));
    expect((screen.getByRole('checkbox', { name: 'Nom' }) as HTMLElement).getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Valider 2 modifications' }));
    await vi.waitFor(() => expect(decide).toHaveBeenCalledWith(['a', 'b'], 'apply'));
  });
  it('écarter n’envoie aucun identifiant ; décidée, la carte dit seulement le résultat', async () => {
    const decide = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<BrewerProposalCard proposal={proposal} draft disabled={false} onDecide={decide} />);
    fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
    await vi.waitFor(() => expect(decide).toHaveBeenCalledWith([], 'dismiss'));
    rerender(<BrewerProposalCard proposal={{ ...proposal, status: 'applied' }} draft disabled={false} onDecide={decide} />);
    expect(screen.getByText('Champs appliqués au brouillon')).toBeTruthy();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});

describe('accueil, modes, pied, zéro', () => {
  it('une tuile a pour nom sa question seule et fixe le mode conseillé', () => {
    const choisir = vi.fn();
    render(
      <Accueil
        titre="On regarde ça ensemble."
        tuiles={[{ question: 'Préparer un achat de matériel' }, { question: 'La pression monte : je purge ?' }]}
        onChoisir={choisir}
        sources={['Recette', 'Matériel']}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Préparer un achat de matériel' }));
    expect(choisir).toHaveBeenCalledWith('Préparer un achat de matériel', 'deep');
    fireEvent.click(screen.getByRole('button', { name: 'La pression monte : je purge ?' }));
    expect(choisir).toHaveBeenLastCalledWith('La pression monte : je purge ?', 'fast');
    expect(screen.getByText('Je lis à chaque question')).toBeTruthy();
  });
  it('les limites inconnues ne dessinent aucune piste', () => {
    const { container } = render(
      <Accueil tuiles={[]} onChoisir={() => {}} sources={[]} limites={{ appels: '4/120', mois: '2,10/15 CHF', partAppels: null, partMois: 14 }} />
    );
    expect(container.querySelectorAll('.cmp-piste')).toHaveLength(1);
  });
  it('Modes : trois radios, le mode choisi coché, la note du mode conseillé', () => {
    const changer = vi.fn();
    render(<Modes mode="auto" onMode={changer} conseille="deep" />);
    expect(screen.getByRole('radio', { name: 'Auto' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Approfondi' }));
    expect(changer).toHaveBeenCalledWith('deep');
    expect(screen.getByText(/Approfondi conseillé pour cette question/)).toBeTruthy();
  });
  it('PiedSaisie : le bouton ne s’active que si l’on peut envoyer', () => {
    const { rerender } = render(<form><PiedSaisie id="q" valeur="" onValeur={() => {}} peutEnvoyer={false} /></form>);
    expect((screen.getByRole('button', { name: 'Envoyer la question' }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<form><PiedSaisie id="q" valeur="Bonjour" onValeur={() => {}} peutEnvoyer /></form>);
    expect((screen.getByRole('button', { name: 'Envoyer la question' }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByLabelText('Question au compagnon brasseur')).toBeTruthy();
  });
  it('Zéro : le groupe de confirmation, ce qui reste selon la portée', () => {
    const confirmer = vi.fn();
    render(<Zero portee="finances" onConfirmer={confirmer} onAnnuler={() => {}} />);
    const groupe = screen.getByRole('group', { name: 'Confirmer la remise à zéro' });
    expect(within(groupe).getByText('Tes opérations, paiements et budgets')).toBeTruthy();
    expect(within(groupe).queryByText('La réponse en cours')).toBeNull();
    fireEvent.click(within(groupe).getByRole('button', { name: 'Effacer les échanges' }));
    expect(confirmer).toHaveBeenCalledTimes(1);
  });
});

describe('attente et échecs', () => {
  it('Attente : chrono, étapes, file sans bouton de retrait ; l’avancement ne recule pas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
    const debut = Date.now() - 149_000;
    const { container, rerender } = render(
      <Attente mode="deep" debut={debut} stage="research" file={[{ id: 'j2', question: 'Et la garde ?' }]} onFermer={() => {}} />
    );
    expect(screen.getByText('2:29')).toBeTruthy();
    expect(container.querySelectorAll('.cmp-etapes > .cmp-f')).toHaveLength(2);
    expect(container.querySelector('.cmp-etapes > .cmp-e')?.textContent).toBe('Sources');
    expect(screen.getByText('En file · partira après la réponse')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /retirer|annuler/i })).toBeNull();
    rerender(<Attente mode="deep" debut={debut} stage="retry" onFermer={() => {}} />);
    expect(container.querySelector('.cmp-etapes > .cmp-e')?.textContent).toBe('Sources');
    expect(screen.getByRole('button', { name: /Fermer · me notifier/ })).toBeTruthy();
    vi.useRealTimers();
  });
  it('Echec : alerte, étape rompue, deux gestes', () => {
    const relancer = vi.fn(), reformuler = vi.fn();
    const { container } = render(<Echec message="Réponse trop longue." etape={1} onRelancer={relancer} onReformuler={reformuler} />);
    expect(screen.getByRole('alert').textContent).toBe('Réponse trop longue.');
    expect(container.querySelectorAll('.cmp-etapes-mini .cmp-x')).toHaveLength(1);
    expect(screen.getByText('À l’étape Calculer')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Relancer l’analyse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reformuler' }));
    expect(relancer).toHaveBeenCalledTimes(1);
    expect(reformuler).toHaveBeenCalledTimes(1);
  });
  it('Echec sans étape connue ne dit rien de ce qui a été fait', () => {
    render(<Echec message="Interrompu." />);
    expect(screen.queryByText(/À l’étape/)).toBeNull();
  });
  it('HorsLigne : la question est gardée, l’envoi attend la confirmation, le budget inconnu n’est pas écrit', () => {
    const envoyer = vi.fn();
    render(<HorsLigne question="La pression monte ?" onEnvoyer={envoyer} />);
    expect(screen.getByText('Gardée sur ce téléphone')).toBeTruthy();
    expect(screen.queryByText(/rien de compté/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer au retour du réseau' }));
    expect(envoyer).toHaveBeenCalledTimes(1);
  });
});

describe('fournisseurs', () => {
  const maintenant = Date.parse('2026-11-15T12:00:00Z');
  const produit = (p: Partial<BrewerProduct> & { url: string }): BrewerProduct => ({
    name: 'Houblon', supplier: 'A', availability: 'in_stock', availabilityText: '', checkedAt: maintenant - 3600_000, ...p
  });
  it('un contrôle ancien ou sans preuve de stock se dit à revérifier / non confirmé, jamais « en stock »', () => {
    expect(statutStock(produit({ url: 'https://a.ch/1' }), maintenant).texte).toBe('Annoncé en stock');
    expect(statutStock(produit({ url: 'https://a.ch/1', checkedAt: maintenant - 2 * 86400000 }), maintenant).texte).toBe('Stock à revérifier');
    expect(statutStock(produit({ url: 'https://a.ch/1', checkedAt: 0 }), maintenant).texte).toBe('Stock à revérifier');
    expect(statutStock(produit({ url: 'https://a.ch/1', verifiedBy: 'product-page', stockEvidence: 'none' }), maintenant).texte).toBe('Stock non confirmé');
    expect(statutStock(produit({ url: 'https://a.ch/1', availability: 'out_of_stock' }), maintenant).texte).toBe('Indisponible');
  });
  it('un lien par URL, https seulement, six au plus, un vendeur différent d’abord', () => {
    const liste = [
      produit({ url: 'https://a.ch/1', supplier: 'A', name: 'A1' }),
      produit({ url: 'https://a.ch/1', supplier: 'A', name: 'A1 doublon' }),
      produit({ url: 'http://a.ch/2', supplier: 'A', name: 'non https' }),
      produit({ url: 'https://u:p@a.ch/3', supplier: 'A', name: 'identifiants' }),
      produit({ url: 'https://a.ch/4', supplier: 'A', name: 'A4' }),
      produit({ url: 'https://b.ch/1', supplier: 'B', name: 'B1' })
    ];
    const noms = produitsAffiches(liste).map((p) => p.name);
    expect(noms).toHaveLength(3);
    expect(noms).not.toContain('non https');
    expect(noms).not.toContain('identifiants');
    expect(new Set(produitsAffiches(liste).slice(0, 2).map((p) => p.supplier)).size).toBe(2);
    const beaucoup = Array.from({ length: 9 }, (_, i) => produit({ url: `https://a.ch/p${i}`, supplier: `V${i}` }));
    expect(produitsAffiches(beaucoup)).toHaveLength(6);
  });
  it('date de contrôle : la plus récente des cartes datées, sinon inconnue', () => {
    expect(dateControle([produit({ url: 'https://a.ch/1', checkedAt: 0 })], maintenant)).toBeNull();
    render(<Fournisseurs products={[produit({ url: 'https://a.ch/1', name: 'Maris Otter', packageLabel: '25 kg', priceText: '48 CHF' })]} maintenant={maintenant} />);
    expect(screen.getByRole('link', { name: /Maris Otter/ })).toBeTruthy();
    expect(screen.getByText('Annoncé en stock')).toBeTruthy();
    expect(screen.queryByText('Lien produit vérifié')).toBeNull();
    expect(screen.getByText(/L’app n’achète rien/)).toBeTruthy();
  });
});
