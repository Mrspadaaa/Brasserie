import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import type { AppConfig, Batch } from '../../../types';
import { StorageService } from '../../../services/storage';
import { FinanceService } from '../../../services/financeService';
import { useStorageValue } from '../../../hooks/useLiveData';
import { BAREME_IMPOT_BIERE, BEER_TAX_SOURCE } from '../../../domain/finance/swissBeerTax';
import { montantChf } from '../../../domain/finance/ledger';
import { nombreFr } from '../../../domain/nombreAffiche';
import { inputClass } from '../../FormNav';
import { ImpotBiereSheet } from '../ImpotBiereSheet';
const BatchDetailSheet = React.lazy(() => import('../../BatchDetailSheet').then(m => ({ default: m.BatchDetailSheet })));
const platoFr = (p: number) => p.toFixed(1).replace('.', ',');
import { echeances, lignesImpot, totalAnnee, type LigneImpot } from './calculAnnee';
import './impotAnnee.css';

/**
 * Clients › Impôt bière, l'année entière : la maquette i1a, choisie le 10.11 (« Le total découpé par bande ; chaque brassin sur sa bande ;
 * ta feuille p2b en annexe »). Lecture seule : aucune donnée n'est écrite ici. Les nombres viennent de `calculAnnee` (donc de `beerTaxForVolume`).
 * Classes préfixées `iaa-` (L26).
 */

const TAXAS_URL = 'https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation';
const BANDES = [{ id: 'legere', label: 'légère' }, { id: 'normale', label: 'normale' }, { id: 'forte', label: 'forte' }] as const;
/** Plans et réduction de l'année, lus du stockage : le même chemin que la feuille p2b (une seule source du total d'impôt). */
const lireImpot = () => ({ plans: FinanceService.snapshot().plans, fiscal: StorageService.getConfig().fiscal });

/** La phrase du barème, dérivée de `BAREME_IMPOT_BIERE` (une seule source) : bornes basses à 0,1 °P au-dessus de la borne précédente. */
const PHRASE_BAREME = 'Barème par hectolitre : ' + BAREME_IMPOT_BIERE.map((tranche, i) => {
  const taux = `${montantChf(tranche.chfParHl)} CHF`;
  const debut = i === 0 ? null : nombreFr(BAREME_IMPOT_BIERE[i - 1].jusquaPlato + 0.1, 1);
  return debut === null ? `${taux} jusqu’à ${nombreFr(tranche.jusquaPlato, 1)} °P`
    : Number.isFinite(tranche.jusquaPlato) ? `${taux} de ${debut} à ${nombreFr(tranche.jusquaPlato, 1)} °P` : `${taux} dès ${debut} °P`;
}).join(' ; ') + '.';

const dateFr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const jour = (iso: string) => dateFr.format(new Date(`${iso}T00:00:00Z`));
/** « 1 026,6 » : la virgule suisse, les milliers par une espace insécable. */
const milliers = (n: number, decimales: number) => nombreFr(n, decimales).replace(/^(-?\d+)/, entier => entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
const litresTexte = (litres: number | null) => litres === null ? 'litres à noter' : `${milliers(litres, 1)} L`;

function sousTitre(ligne: LigneImpot): React.ReactNode {
  const litres = litresTexte(ligne.litres);
  if (ligne.etat === 'note') return <span className="iaa-m">{platoFr(ligne.plato)} °P · {litres}</span>;
  if (ligne.etat === 'visee') return <span className="iaa-m">visée {platoFr(ligne.plato)} °P · {litres}</span>;
  if (ligne.etat === 'exonere') return <>exonéré · ≤ 0,5 % vol. · <span className="iaa-m">{litres}</span></>;
  return <span className="iaa-att">{ligne.densite === 'a-verifier' ? 'densité à vérifier' : 'densité à noter'} · <span className="iaa-m">{litres}</span></span>;
}

function montantLigne(ligne: LigneImpot): React.ReactNode {
  if (ligne.etat === 'inconnue') {
    return ligne.min === null || ligne.max === null
      ? <span className="iaa-mt iaa-m iaa-blanc">—</span>
      : <span className="iaa-mt iaa-m iaa-est">{montantChf(ligne.min)} – {montantChf(ligne.max)}</span>;
  }
  if (ligne.montant === null) return <span className="iaa-mt iaa-m iaa-blanc">—</span>;
  return <span className={`iaa-mt iaa-m${ligne.etat === 'visee' ? ' iaa-est' : ''}`}>{ligne.etat === 'visee' ? '~ ' : ''}{montantChf(ligne.montant)}</span>;
}

export function ImpotAnnee({ batches, config }: { batches: Batch[]; config: AppConfig }) {
  const anneeCourante = new Date().getFullYear();
  const [annee, setAnnee] = useState(anneeCourante);
  const [ouvert, setOuvert] = useState<string | null>(null);
  /** « Noter la densité » de la feuille (annexe de i1a) : la fiche du brassin s'ouvre sur Mesures, sans quitter Clients. */
  const [mesures, setMesures] = useState<string | null>(null);
  const [copie, setCopie] = useState<'idle' | 'ok' | 'failed'>('idle');
  const [reglage, setReglage] = useState<'idle' | 'introuvable'>('idle');
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(minuteur.current), []);

  const donnees = useStorageValue(lireImpot);
  const lignes = useMemo(() => lignesImpot(batches, donnees, annee), [batches, donnees, annee]);
  const total = useMemo(() => totalAnnee(lignes), [lignes]);
  const { fiscal } = donnees;
  const pct = fiscal.beerTaxAnnualReductionPct;
  const reductionConfirmee = typeof pct === 'number' && Number.isFinite(pct) && pct >= 0 && pct <= 40 && fiscal.beerTaxReductionYear === annee;
  const dates = echeances(annee, fiscal.beerTaxPeriod);

  const intervalle = total.bas === null || total.haut === null ? null
    : total.sansLitres > 0 ? `≥ ${montantChf(total.bas)}`
    : total.haut !== total.bas ? `${montantChf(total.bas)} – ${montantChf(total.haut)}`
    : `${total.visees > 0 ? '~ ' : ''}${montantChf(total.bas)}`;
  const libelleReduction = reductionConfirmee ? `Réduction petit brasseur confirmée : ${nombreFr(pct, 1)} %.` : 'Taux plein : réduction à confirmer dans les réglages.';

  const copier = () => {
    /* CP-8 (10.11, « texte inutile ») : le texte copié est ce que Taxas demande, les hectolitres par catégorie, et ce qui manque encore. */
    const NOMS = ['légère', 'normale', 'forte'];
    const parBande = BAREME_IMPOT_BIERE.map((tranche, i) => {
      const prises = lignes.filter(l => l.etat === 'note' && l.bande === i && l.litres !== null && l.montant !== null);
      const bas = i === 0 ? null : nombreFr(BAREME_IMPOT_BIERE[i - 1].jusquaPlato + 0.1, 1);
      const borne = bas === null ? `jusqu’à ${nombreFr(tranche.jusquaPlato, 1)} °P` : Number.isFinite(tranche.jusquaPlato) ? `${bas} à ${nombreFr(tranche.jusquaPlato, 1)} °P` : `dès ${bas} °P`;
      const litres = prises.reduce((n, l) => n + l.litres!, 0), montant = prises.reduce((n, l) => n + l.montant!, 0);
      return prises.length ? `- ${NOMS[i]}, ${borne} : ${nombreFr(litres / 100, 3)} hl × ${montantChf(tranche.chfParHl)} = ${montantChf(montant)} CHF` : null;
    }).filter(Boolean);
    const manques = lignes.filter(l => l.etat === 'visee' || l.etat === 'inconnue' || (l.etat === 'note' && l.litres === null))
      .map(l => `${l.nom} (${l.litres === null ? 'litres' : ''}${l.litres === null && l.etat !== 'note' ? ' et ' : ''}${l.etat === 'visee' ? 'densité visée, à mesurer' : l.etat === 'inconnue' ? 'densité' : ''})`);
    const texte = [`IMPÔT SUR LA BIÈRE — ${annee} · pour Taxas`, config.company.name,
      parBande.length ? 'Hectolitres par catégorie (densité notée) :' : 'Aucun brassin à densité notée : rien à reporter encore.', ...parBande,
      `Total : ${intervalle === null ? '—' : `${intervalle} CHF`}`,
      manques.length ? `À compléter avant de déclarer : ${manques.join(', ')}.` : '',
      libelleReduction].filter(Boolean).join('\n');
    /* TE-8 : le retour est visible dans les deux cas ; une copie refusée par le navigateur le dit au lieu de se taire. */
    void Promise.resolve(navigator.clipboard?.writeText(texte)).then(() => setCopie('ok'), () => setCopie('failed'));
    if (!navigator.clipboard) setCopie('failed');
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setCopie('idle'), 4000);
  };

  // Réglages s'ouvre depuis App : l'écran le demande par l'événement annulable de la feuille p2b ; sans écouteur, il dit où aller.
  const ouvrirReglages = () => {
    const pris = !window.dispatchEvent(new CustomEvent('affinee:ouvrir-reglages', { cancelable: true, detail: { section: 'reserve-impot-biere' } }));
    setReglage(pris ? 'idle' : 'introuvable');
  };

  const largeur = (litres: number) => String(Math.round(litres / total.litres * 1000) / 10) + '%';
  const segments: Array<{ id: string; litres: number; classe: string }> = [
    ...BANDES.map((b, i) => ({ id: b.id, litres: total.bandes[i].litres, classe: `iaa-c${i + 1}` })),
    { id: 'inconnue', litres: total.inconnu?.litres ?? 0, classe: 'iaa-hach' },
    { id: 'exonere', litres: total.exonere?.litres ?? 0, classe: 'iaa-exo' }
  ].filter(s => s.litres > 0);
  const batchOuvert = ouvert ? batches.find(b => b.id === ouvert) ?? null : null;
  const batchMesures = mesures ? batches.find(b => b.id === mesures) ?? null : null;
  const periodeTexte = fiscal.beerTaxPeriod === 'annual' ? 'régime annuel' : fiscal.beerTaxPeriod === 'quarterly' ? 'régime trimestriel' : 'si régime annuel';

  return (
    <section className="iaa" aria-label="Impôt bière de l’année">
      <div className="iaa-tete">
        <h3>{annee === anneeCourante ? 'Cette année, je dois' : `En ${annee}, je devais`}</h3>
        <label className="iaa-an">
          <select aria-label="Année de réserve OFDF" value={annee} onChange={event => { setAnnee(Number(event.target.value)); setOuvert(null); }} className={`${inputClass} iaa-an-select iaa-m`}>
            {Array.from({ length: 6 }, (_, index) => anneeCourante - index).map(year => <option key={year}>{year}</option>)}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
      </div>

      <div className="iaa-rep" data-testid="iaa-reponse">
        <div className="iaa-q">
          <span>{lignes.length > 0 && total.litres > 0 && <><span className="iaa-m">{milliers(total.litres, 1)} L</span> · </>}{lignes.length === 0 ? `Aucun brassin en ${annee}` : `${lignes.length} brassin${lignes.length > 1 ? 's' : ''}`}</span>
          <em data-ton={reductionConfirmee ? 'neutre' : 'attention'}>{reductionConfirmee ? `réduction ${nombreFr(pct, 1)} % confirmée` : 'taux plein'}</em>
        </div>
        <div className="iaa-v" data-testid="iaa-total">
          {intervalle === null ? <span className="iaa-blanc">—</span> : <><span className="iaa-m">{intervalle}</span><small>{' '}CHF</small></>}
        </div>
        {total.sansLitres > 0 && <div className="iaa-s iaa-att">{total.sansLitres} brassin{total.sansLitres > 1 ? 's' : ''} sans litres : le total est un minimum.</div>}
        {total.litres > 0 && <div className="iaa-barre" data-testid="iaa-barre" aria-hidden="true">
          {segments.map(s => <i key={s.id} className={s.classe} data-testid={`iaa-seg-${s.id}`} style={{ width: largeur(s.litres) }} />)}
        </div>}
        {total.litres > 0 && <div className="iaa-leg" data-testid="iaa-legende">
          {BANDES.map((b, i) => total.bandes[i].litres > 0 && (
            <span key={b.id}><i className={`iaa-c${i + 1}`} />{b.label}{' '}<b className="iaa-m">{lignes.some(l => l.etat === 'visee' && l.bande === i) ? '~ ' : ''}{montantChf(total.bandes[i].chf)}</b></span>
          ))}
          {total.inconnu && <span><i className="iaa-hach" />densité à noter{' '}<b className="iaa-m">{montantChf(total.inconnu.bas)} – {montantChf(total.inconnu.haut)}</b></span>}
          {total.exonere && <span><i className="iaa-exo" />exonéré</span>}
        </div>}
      </div>

      {lignes.length > 0 && <>
        <div className="iaa-h2">Par brassin</div>
        <div role="group" aria-label="Impôt par brassin" className="iaa-liste">
          {lignes.map(ligne => {
            const bande = ligne.bande === null ? null : BANDES[ligne.bande];
            const hachure = ligne.etat === 'inconnue';
            return (
              <button key={ligne.id} type="button" className="iaa-l" data-testid="iaa-ligne" data-bande={ligne.etat === 'exonere' ? 'exonere' : bande?.id ?? 'inconnue'} onClick={() => setOuvert(ligne.id)}>
                <i className={`iaa-dot ${hachure ? 'iaa-hach' : ligne.etat === 'exonere' ? 'iaa-exo' : `iaa-c${(ligne.bande ?? 0) + 1}`}`} data-testid="iaa-pastille" data-hachure={hachure ? 'oui' : 'non'} aria-hidden="true" />
                <span className="iaa-x"><b>{ligne.nom}</b><span>{sousTitre(ligne)}</span></span>
                {montantLigne(ligne)}
                <ChevronRight size={14} className="iaa-ch" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </>}
      {batchOuvert && <ImpotBiereSheet batch={batchOuvert} onClose={() => setOuvert(null)} onNoteDensity={() => { setOuvert(null); setMesures(batchOuvert.id); }} />}
      {batchMesures && <React.Suspense fallback={null}><BatchDetailSheet batch={batchMesures} initialSection="measurements" onClose={() => setMesures(null)} /></React.Suspense>}

      <div className="iaa-qa">
        <div data-testid="iaa-quand">
          <span>Quand · {periodeTexte}</span>
          {dates ? <><b>déclarer <span className="iaa-m">{jour(dates.declarer)}</span></b><span>payer <span className="iaa-m">{jour(dates.payer)}</span></span></>
            : <><b>chaque trimestre</b><span>déclarer sous 20 j, payer sous 30 j</span></>}
        </div>
        <div data-testid="iaa-aqui">
          <span>À qui</span><b>OFDF, par Taxas</b>
          <button type="button" className="iaa-red" onClick={ouvrirReglages}>{reductionConfirmee ? `réduction petit brasseur : ${nombreFr(pct, 1)} % confirmée` : 'réduction petit brasseur : à confirmer'} ›</button>
          {reglage === 'introuvable' && <span role="status">Menu ⋮ en haut › Réserve impôt sur la bière.</span>}
        </div>
      </div>

      <details className="iaa-pli">
        <summary><span>Comprendre le barème</span><ChevronDown size={14} aria-hidden="true" /></summary>
        <div className="iaa-corps">
          <p>{PHRASE_BAREME}</p>
          <p>Le taux annuel de réduction est communiqué par l’OFDF. Il ne se déduit pas du seul volume de cette période.</p>
          <p>Selon le régime attribué : déclaration sous 20 jours et paiement sous 30 jours après la fin du trimestre ou de l’année, via Taxas.</p>
          <p>L’impôt est dû à la sortie de cave ; le conditionné n’en est qu’un indicateur. Une densité manquante donne une fourchette, jamais zéro.</p>
          <p>TVA de la bière alcoolisée : {config.fiscal.isTvaRegistered ? 'taux normal de 8,1 %.' : 'brasserie non assujettie, aucune TVA facturée.'}</p>
        </div>
      </details>

      <div className="iaa-pied">
        <span className="iaa-liens">
          <a href={TAXAS_URL} target="_blank" rel="noreferrer" aria-label="Ouvrir Taxas">Taxas</a>
          <a href={BEER_TAX_SOURCE} target="_blank" rel="noreferrer">Directives OFDF</a>
        </span>
        <button type="button" className="iaa-prim" onClick={copier}><Copy size={16} aria-hidden="true" />{copie === 'ok' ? 'Estimation copiée' : 'Copier pour Taxas'}</button>
      </div>
      {copie === 'failed' && <p role="status" className="iaa-note">Copie refusée par le navigateur : l’estimation reste à lire ci-dessus.</p>}
    </section>
  );
}
