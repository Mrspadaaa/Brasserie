import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { interpolateColdHopBuFromMass, interpolateColdHopBuReference } from '../../src/domain/hopDecision/coldIbuReference';
import { readAssistedColdContactEvidence } from '../../src/services/hopV55/assistedColdContactEvidence';
import { AssistedColdContactCard } from '../../src/ui/hopV55/AssistedColdContactCard';

afterEach(() => cleanup());

const toolName = 'cold_contact_bitterness_reference';
const runColdTool = (doseGL: number) => runBrewerTool(toolName, { doseGL }, {} as Parameters<typeof runBrewerTool>[2]);
const read = (data: unknown, id = 'E-cold-card') => readAssistedColdContactEvidence({ id, name: toolName, data });

describe('carte de référence BU au contact froid', () => {
  it('présente le BU de référence, le témoin, le contraste, la dose et les preuves exactes', async () => {
    const user = userEvent.setup();
    const evidence = read({ ...runColdTool(3.86).data }) ;
    expect(evidence.status).toBe('ready');
    if (evidence.status !== 'ready') return;
    render(<AssistedColdContactCard evidence={evidence} />);

    const metric = screen.getByLabelText('BU du protocole de référence');
    expect(metric).toHaveTextContent('21 BU');
    expect(metric).not.toHaveTextContent('IBU');
    const card = screen.getByLabelText('Référence BU de contact à froid');
    const values = card.querySelector('.hv-assisted-cold-contact__metrics')!;
    expect(within(values).getByText('3,86 g/L')).toBeInTheDocument();
    expect(within(values).getByText('386 g/hL')).toBeInTheDocument();
    expect(within(values).getByText('17 BU')).toBeInTheDocument();
    expect(within(values).getByText('4 BU')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: evidence.sources[0].title })).toHaveAttribute('href', evidence.sources[0].url);
    for (const fact of evidence.facts) expect(card).toHaveTextContent(fact);
    for (const limit of evidence.limits) expect(card).toHaveTextContent(limit);

    await user.click(screen.getByText(`Snapshot et références exactes`));
    expect(card).toHaveTextContent(evidence.resultReference);
    expect(card).toHaveTextContent(evidence.snapshot.calibrationReference);
  });

  it('distingue une dose inconnue d’une dose hors domaine sans attribuer de BU', () => {
    const missingCases = [
      { label: 'Dose inconnue', evidence: read(interpolateColdHopBuReference({ dose: { value: null, unit: 'g/L' } }), 'E-dose-unknown') },
      { label: 'Dose hors domaine publié', evidence: read(runColdTool(16.0001).data, 'E-dose-outside') },
    ];
    for (const item of missingCases) {
      expect(item.evidence.status).toBe('missing');
      const view = render(<AssistedColdContactCard evidence={item.evidence} />);
      expect(screen.getByText(item.label)).toBeInTheDocument();
      const metric = screen.getByLabelText('BU du protocole de référence');
      expect(metric).toHaveTextContent('Aucune valeur BU disponible');
      expect(metric).not.toHaveTextContent(/\d+\s*BU/);
      const dose = screen.getByLabelText('Référence BU de contact à froid').querySelector('.hv-assisted-cold-contact__metrics')!;
      if (item.label === 'Dose inconnue') expect(within(dose).getByText('Inconnue · g/L')).toBeInTheDocument();
      else expect(within(dose).getByText('16 g/L (16,0001 g/L exacts)')).toBeInTheDocument();
      view.unmount();
    }
  });

  it('#75 · lit les doses calculées depuis les masses selon la règle unique, avec la coordonnée scellée', () => {
    const evidence = read(interpolateColdHopBuFromMass({ massesGrams: [40], volumeL: 30 }));
    expect(evidence.status).toBe('ready');
    if (evidence.status !== 'ready') return;
    render(<AssistedColdContactCard evidence={evidence} />);
    const values = screen.getByLabelText('Référence BU de contact à froid').querySelector('.hv-assisted-cold-contact__metrics')!;
    const value = (term: string) => [...values.querySelectorAll('dt')].find(dt => dt.textContent === term)?.nextElementSibling?.textContent;
    expect.soft(value('Dose saisie · affichage arrondi')).toBe('1,333\u00a0g/L (4/3\u00a0g/L exacts)');
    expect.soft(value('Dose effective')).toBe('133,333\u00a0g/hL (400/3\u00a0g/hL exacts)');
    expect(values.textContent).not.toMatch(/\d,\d{7,}/);
  });

  it('#75 · lit les BU d’une dose non ronde comme la preuve froide de la recette (4 décimales), sans flottant brut', () => {
    const evidence = read(interpolateColdHopBuFromMass({ massesGrams: [30], volumeL: 21 }));
    expect(evidence.status).toBe('ready');
    if (evidence.status !== 'ready') return;
    render(<AssistedColdContactCard evidence={evidence} />);
    const card = screen.getByLabelText('Référence BU de contact à froid');
    const result = screen.getByLabelText('BU du protocole de référence');
    const values = card.querySelector('.hv-assisted-cold-contact__metrics')!;
    const value = (term: string) => [...values.querySelectorAll('dt')].find(dt => dt.textContent === term)?.nextElementSibling?.textContent;
    expect.soft(result.querySelector('strong')?.textContent).toBe('18,7143\u00a0BU');
    expect.soft(value('Contraste au témoin')).toBe('1,7143\u00a0BU');
    expect.soft(value('Témoin publié · 0 g/hL')).toBe('17\u00a0BU');
    expect.soft(value('Domaine de la courbe')).toMatch(/^0–1.600\xa0g\/hL$/u);
    expect.soft(value('Dose effective')).toBe('142,857\u00a0g/hL (1000/7\u00a0g/hL exacts)');
    // The exact values stay available in the facts and the snapshot disclosures.
    expect(`${result.textContent}${values.textContent}`).not.toMatch(/\d,\d{5,}/);
  });

  it('garde visible l’avertissement quand une coordonnée positive s’affiche arrondie à zéro', () => {
    const result = interpolateColdHopBuFromMass({ massesGrams: [Number.MIN_VALUE], volumeL: 1e9 });
    const evidence = read(result);
    expect(evidence.status).toBe('ready');
    if (evidence.status !== 'ready') return;
    render(<AssistedColdContactCard evidence={evidence} />);
    expect(screen.getByText('Dose saisie · affichage arrondi')).toBeInTheDocument();
    expect(screen.getAllByText(evidence.facts.find(fact => fact.includes('La coordonnée exacte conservée'))!)).toHaveLength(2);
    expect(screen.getByText('Interpolation de référence')).toBeInTheDocument();
  });

  it('conserve une version future sans lui inventer de métrique', async () => {
    const user = userEvent.setup();
    const payload = { format: 'cold-hop-bu-reference-result-v2', version: 'cold-hop-bu-reference-v3', hidden: { value: 999 } };
    const evidence = read(payload);
    expect(evidence.status).toBe('unsupportedFormat');
    render(<AssistedColdContactCard evidence={evidence} />);
    expect(screen.getByText('Version de référence non prise en charge')).toBeInTheDocument();
    expect(screen.queryByLabelText('BU du protocole de référence')).not.toBeInTheDocument();
    await user.click(screen.getByText('Format, version et contenu reçus'));
    expect(screen.getByText(/999/)).toBeInTheDocument();
  });

  it('montre les preuves invalides et les outils non applicables sans produire de référence BU', () => {
    const invalid = read({ format: 'cold-hop-bu-reference-result-v1' });
    expect(invalid.status).toBe('invalid');
    render(<AssistedColdContactCard evidence={invalid} />);
    if (invalid.status === 'invalid') expect(screen.getByText(invalid.reason)).toBeInTheDocument();
    expect(screen.queryByLabelText('BU du protocole de référence')).not.toBeInTheDocument();
    cleanup();

    const otherTool = readAssistedColdContactEvidence({ id: 'E-other', name: 'lookup_hop_reference', data: {} });
    render(<AssistedColdContactCard evidence={otherTool} />);
    expect(screen.getByText('Cette preuve ne porte pas une référence de contact à froid')).toBeInTheDocument();
    expect(screen.queryByLabelText('BU du protocole de référence')).not.toBeInTheDocument();
  });
});
