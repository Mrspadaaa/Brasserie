import React, { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { BrewerChat } from '../BrewerChat';

interface Props {
  view: 'costs' | 'journal' | 'forecast' | 'projects' | 'annual';
  month: string;
  allDates: boolean;
  year: number;
  horizon: number;
  includeEquipmentProjects?: boolean;
}

/** Preparing a question never starts a generation: the brewer edits and sends it. */
export function FinanceAssistant({ view, month, allDates, year, horizon, includeEquipmentProjects = true }: Props) {
  const [question, setQuestion] = useState<string>();
  const period = allDates ? 'tout mon historique disponible' : `la période ${month}`;
  const suggestions = [
    { label: 'Comprendre mes dépenses', question: `Analyse mes dépenses pour ${period}. Explique les principaux postes et les variations utiles pour ma brasserie. Distingue les achats, les paiements et les investissements ; signale les données manquantes.` },
    { label: 'Préparer un achat de matériel', question: 'Aide-moi à préparer un achat de matériel et à prioriser mes projets pour la brasserie : besoin réel, horizon bientôt/ensuite/plus tard, budget TTC avec livraison et installation, devis, achats déjà liés et trésorerie. Appuie-toi sur mes projets enregistrés et distingue ceux inclus dans les prévisions des idées mises de côté. Demande les prix et dates manquants. Compare acheter, réparer ou attendre, sans supposer des ventes futures.' },
    { label: 'Prévoir mes prochains paiements', question: `Explique ma prévision sur ${horizon === 365 ? '12 mois' : `${horizon} jours`}, avec les factures à payer, les prévisions actives et les prochains brassins. Le scénario affiché ${includeEquipmentProjects ? 'inclut' : 'exclut'} les projets de matériel encore à acheter ; leurs factures réelles restent prises en compte. Compare l’impact de ces projets. Sépare engagements connus et estimations. Quels montants ou repères manquent encore ?` },
    { label: 'Vérifier mes opérations', question: 'Vérifie les incohérences de mes opérations enregistrées, y compris les archives utiles : doublons possibles, paiements, classement du matériel et pièces à compléter. Identifie les opérations concernées et propose les corrections à vérifier, sans rien modifier.' },
    { label: `Préparer l’année ${year}`, question: `Aide-moi à préparer le dossier annuel ${year} de ma brasserie indépendante en Suisse selon mon profil enregistré. Explique les amortissements, inventaires, créances et dettes à vérifier. Distingue résultat et trésorerie. Si cette année n’est pas couverte par le contexte, dis-le clairement et demande les chiffres nécessaires.` }
  ];
  const selected = suggestions[view === 'forecast' ? 2 : view === 'annual' ? 4 : view === 'journal' ? 3 : view === 'projects' ? 1 : 0];
  return <>
    <button type="button" className="finance-assistant" onClick={() => setQuestion(selected.question)}>
      <Sparkles size={19} aria-hidden="true" />
      <span><strong>{selected.label}</strong><small>Compagnon brasseur</small></span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
    {question !== undefined && <BrewerChat scope={{ kind: 'app', id: 'finances' }} label="Mes finances" phase="Finances de la brasserie" initialOpen hideLauncher initialQuestion={question} suggestedPrompts={suggestions} onClose={() => setQuestion(undefined)} />}
  </>;
}
