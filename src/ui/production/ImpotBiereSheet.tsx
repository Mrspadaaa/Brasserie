import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { Batch } from '../../types';
import { Sheet } from '../Sheet';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { useStorageValue } from '../../hooks/useLiveData';
import { BAREME_IMPOT_BIERE, BEER_TAX_SOURCE, beerTaxForVolume } from '../../domain/finance/swissBeerTax';
import { litresNets } from '../../domain/finance/chaineLitre';
import type { BrewBudgetSnapshot } from '../../domain/finance/brewBudget';
import { isoDate, montantChf } from '../../domain/finance/ledger';
import { nombreFr } from '../../domain/nombreAffiche';
import './impot-biere.css';

// CP-14 (10.11, « Ça semble pas vraiment fonctionné ?? ») : chaque donnée manquante de la feuille renvoie où la saisir.
const ProfileSheet = React.lazy(() => import('../finance/FinanceForms').then(m => ({ default: m.ProfileSheet })));

/**
 * Impôt bière d'un brassin : la règle des degrés (p2b, choisie). Une feuille en lecture seule : le curseur est une simulation locale,
 * jamais écrite ; la densité se note sur la fiche du brassin (`onNoteDensity`), par son chemin de saisie existant.
 * Le calcul est celui de d1 (`beerTaxForVolume`, `litresNets`) : aucune règle ici.
 */

const TAXAS_URL = 'https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation';
/** La règle de la maquette : 0 à 20 °P. */
const REGLE_MAX_PLATO = 20;
const PLATO_EXEMPLE = 12;
const BANDES = [{ id: 'legere', label: 'légère' }, { id: 'normale', label: 'normale' }, { id: 'forte', label: 'forte' }] as const;

export interface FormatImpot { id: string; label: string; volumeL: number }
/** Les trois formats de la maquette : `PricingItem` n'a pas de volume, ce sont des constantes d'affichage. */
export const FORMATS_IMPOT: readonly FormatImpot[] = [
  { id: '33cl', label: '33 cl', volumeL: 0.33 },
  { id: '75cl', label: '75 cl', volumeL: 0.75 },
  { id: 'fut', label: 'fût 20 L', volumeL: 20 }
];

/** Position du curseur sur la règle, en % de 0 à 100 (bornée) ; null si le °P est inconnu. */
export function positionRegle(plato: number | null | undefined): number | null {
  if (typeof plato !== 'number' || !Number.isFinite(plato)) return null;
  return Math.min(100, Math.max(0, plato / REGLE_MAX_PLATO * 100));
}
/** Valeur du curseur (dixièmes de °P) → °P. */
export const platoDuCurseur = (dixiemes: number): number => Math.round(dixiemes) / 10;

/** Les classes du barème, dérivées de la donnée : bornes basses à 0,1 °P au-dessus de la borne précédente. */
export function classesBareme(): Array<{ label: string; de: number | null; jusqua: number | null; chfParHl: number }> {
  return BAREME_IMPOT_BIERE.map((tranche, i) => ({
    label: BANDES[i].label,
    de: i === 0 ? null : Math.round((BAREME_IMPOT_BIERE[i - 1].jusquaPlato + 0.1) * 10) / 10,
    jusqua: Number.isFinite(tranche.jusquaPlato) ? tranche.jusquaPlato : null,
    chfParHl: tranche.chfParHl
  }));
}

/** Année d'un brassin pour la réduction : conditionnement, sinon brassage, sinon date prévue (JJ.MM.AAAA lue par `isoDate`). */
export function anneeDuBrassin(batch: Batch): number {
  const annee = Number(isoDate(batch.bottlingDate || batch.brewDate || batch.plannedBrewDate)?.slice(0, 4));
  return Number.isFinite(annee) && annee > 0 ? annee : new Date().getFullYear();
}

const lireDonnees = () => {
  const finance = FinanceService.snapshot();
  return { profile: finance.profile, plans: finance.plans, fiscal: StorageService.getConfig().fiscal };
};

/** Le net saisi du dernier instantané du brassin ; un net pris sur le volume à brasser (ou d'un instantané ancien) n'est pas un net. */
function netEnregistre(plans: ReadonlyArray<{ createdAt?: string; brewEstimate?: unknown }>, batchId: string): number | null {
  const dernier = plans
    .filter(plan => (plan.brewEstimate as BrewBudgetSnapshot | undefined)?.batchId === batchId)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))[0];
  const estimate = dernier?.brewEstimate as BrewBudgetSnapshot | undefined;
  return estimate?.netVolumeSource === 'saisi' && estimate.netVolumeL > 0 ? estimate.netVolumeL : null;
}

const PICTOS: Record<string, React.ReactNode> = {
  '33cl': <path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z" />,
  '75cl': <path d="M9 2h6v4l3 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V10l3-4z" />,
  fut: <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M5 9h14M5 15h14" /></>
};

type Depart = { plato: number; mention: 'exemple' | 'visée recette' | '' };

type Donnees = ReturnType<typeof lireDonnees>;

/** Ce que la feuille, le lien du dossier et la liste de Clients doivent savoir d'un brassin, calculé une fois (d1 : `beerTaxForVolume`, `litresNets`). */
export function baseImpot(batch: Batch, { plans, fiscal }: Pick<Donnees, 'plans' | 'fiscal'>) {
  // Litres : la même chaîne que le coût du brassin (conditionné, puis net enregistré ; aucun net « attendu » n'existe).
  const litres = litresNets({ conditionneL: batch.volumePackagedL, netEnregistreL: netEnregistre(plans as never, batch.id), netAttenduL: null });
  const annee = anneeDuBrassin(batch);
  const pctReduction = fiscal.beerTaxAnnualReductionPct;
  const reductionConfirmee = typeof pctReduction === 'number' && Number.isFinite(pctReduction) && pctReduction >= 0 && pctReduction <= 40 && fiscal.beerTaxReductionYear === annee;
  const reductionPct = reductionConfirmee ? pctReduction! : 0;
  // `batch.abv` s'écrit « 5% » sur la fiche : `beerTaxForVolume` lit un nombre (« % » retiré ici, sinon l'exonération sans alcool ne se déclenche jamais).
  const abvBrut = String(batch.abv ?? '').replace('%', '').trim();
  const calcul = (plato: number | null, l: number | null | undefined) => beerTaxForVolume({ og: batch.og, abv: abvBrut, plato, litres: l ?? 0, reductionPct });
  const lu = beerTaxForVolume({ og: batch.og, abv: abvBrut, litres: litres?.litres ?? 0 });
  const ogSaisie = String(batch.og ?? '').trim() !== '';
  const densite: 'notee' | 'a-verifier' | 'inconnue' = lu.plato != null ? 'notee' : ogSaisie ? 'a-verifier' : 'inconnue';
  const visee = batch.recipeSnapshot?.ogTarget != null ? beerTaxForVolume({ og: batch.recipeSnapshot.ogTarget, litres: 1 }).plato : null;
  const depart: Depart = densite === 'notee' ? { plato: lu.plato!, mention: '' }
    : visee != null ? { plato: visee, mention: 'visée recette' } : { plato: PLATO_EXEMPLE, mention: 'exemple' };
  return { litres, annee, reductionConfirmee, reductionPct, calcul, lu, densite, visee, depart };
}

/** « Impôt bière · 6,74 CHF · 0,08 par 33 cl › » : la réponse déjà dans le dossier du brassin (constat 19). Le montant n'est écrit que sur une densité notée ou visée (« ~ » pour la visée) ; jamais sur un °P d'exemple. */
export function ImpotBiereLien({ batch, onOpen, titre = 'Impôt bière', className }: { batch: Batch; onOpen: () => void; titre?: string; className?: string }) {
  const donnees = useStorageValue(lireDonnees);
  const b = baseImpot(batch, donnees);
  const plato = b.densite === 'notee' ? b.lu.plato : b.visee;
  const total = plato != null && b.litres ? b.calcul(plato, b.litres.litres).montant : null;
  const un33 = plato != null ? b.calcul(plato, FORMATS_IMPOT[0].volumeL).montant : null;
  const approx = b.densite === 'notee' ? '' : '~ ';
  const texte = [titre, total !== null ? `${approx}${montantChf(total)} CHF` : null, un33 !== null ? `${approx}${montantChf(un33)} par 33 cl` : (b.densite === 'inconnue' ? 'densité à noter' : 'densité à vérifier')].filter(Boolean).join(' · ');
  return <button type="button" className={className ?? 'min-h-touch rounded-control border border-cave-700 px-2.5 py-0 my-1 text-sm leading-tight text-ebc-straw font-semibold text-left'} onClick={onOpen}>{texte} ›</button>;
}

export function ImpotBiereSheet({ batch, onClose, onNoteDensity }: { batch: Batch; onClose: () => void; onNoteDensity?: () => void }) {
  const donnees = useStorageValue(lireDonnees);
  const { profile, fiscal } = donnees;
  const [dixiemes, setDixiemes] = useState<number | null>(null);
  const [copie, setCopie] = useState<'idle' | 'ok' | 'failed'>('idle');
  const [reglage, setReglage] = useState<'idle' | 'introuvable'>('idle');
  const [profilOuvert, setProfilOuvert] = useState(false);
  const { litres, annee, reductionConfirmee, reductionPct, calcul, lu, densite, depart } = baseImpot(batch, donnees);
  const plato = dixiemes === null ? depart.plato : platoDuCurseur(dixiemes);
  const mention = dixiemes === null ? depart.mention
    : densite === 'notee' ? (plato === lu.plato ? '' : 'simulation') : 'exemple';
  const exonere = lu.exonere;

  const brassin = calcul(plato, litres?.litres);
  const formats = FORMATS_IMPOT.map(format => ({ format, impot: calcul(plato, format.volumeL).montant }));
  const litresAn = typeof profile?.annualProductionL === 'number' && profile.annualProductionL > 0 ? profile.annualProductionL : null;
  const impotAn = litresAn === null ? null : calcul(plato, litresAn).montant;
  const position = positionRegle(plato)!;
  const chf = (n: number | null) => n === null ? '—' : montantChf(n);
  const platoTexte = `${nombreFr(plato, 1)} °P`;
  const hachure = densite !== 'notee';
  const ogTexte = String(batch.og ?? '').trim().replace('.', ',');

  // « conditionnés » seulement quand le brassin l'est (constat 17) : un brassin en cuve n'a rien de conditionné, ses litres sont ceux de l'estimation enregistrée.
  const sortieNeutre = batch.status === 'conditionne' || batch.status === 'termine';
  const motLitres = litres === null ? null : litres.source === 'conditionne' && sortieNeutre ? 'conditionnés' : 'attendus (estimé)';
  const puce = exonere ? 'exonéré · ≤ 0,5 % vol.'
    : densite === 'notee' ? `densité notée ${ogTexte} · ${nombreFr(lu.plato, 1)} °P`
    : densite === 'a-verifier' ? 'densité à vérifier' : 'densité à noter';
  const periode = fiscal.beerTaxPeriod === 'quarterly' ? 'trimestre' : fiscal.beerTaxPeriod === 'annual' ? 'année' : 'trimestre ou année selon le régime attribué';
  const exemplePlato = beerTaxForVolume({ og: 1.048, litres: 1 }).plato;

  // Réglages s'ouvre depuis App : la feuille le demande par un événement annulable ; sans écouteur, elle dit où aller (le texte d'avant).
  const ouvrirReglages = () => {
    const pris = !window.dispatchEvent(new CustomEvent('affinee:ouvrir-reglages', { cancelable: true, detail: { section: 'reserve-impot-biere' } }));
    if (pris) onClose(); else setReglage('introuvable');
  };

  const copier = () => {
    const lignes = [
      `IMPÔT SUR LA BIÈRE — ${batch.name} (${batch.id})`,
      densite === 'notee' ? `Densité initiale : ${ogTexte} (${nombreFr(lu.plato, 1)} °P)` : `Densité initiale : non notée — ${mention || 'exemple'} à ${platoTexte}`,
      litres ? `Litres : ${nombreFr(litres.litres, 1)} L ${motLitres}` : 'Litres : à noter',
      `À ${platoTexte}${mention ? ` (${mention})` : ''} : ${brassin.chfParHl != null ? `${montantChf(brassin.chfParHl)} CHF/hl` : 'taux inconnu'}`,
      `Impôt du brassin : ${chf(brassin.montant)}${brassin.montant === null ? '' : ' CHF'}`,
      formats.map(({ format, impot }) => `${format.label} ${chf(impot)}`).join(' · '),
      reductionConfirmee ? `Réduction petit brasseur ${nombreFr(reductionPct, 1)} % confirmée pour ${annee}` : `Réduction non confirmée pour ${annee} : taux plein`,
      'Estimation indicative : l’impôt est dû à la sortie de cave (déclaration via Taxas).'
    ];
    const ecrire = navigator.clipboard?.writeText(lignes.join('\n'));
    if (!ecrire) { setCopie('failed'); return; }
    ecrire.then(() => setCopie('ok'), () => setCopie('failed'));
  };

  const pied = (
    <div className="ibr-pied">
      <span className="ibr-liens">
        <a href={TAXAS_URL} target="_blank" rel="noreferrer">Taxas</a>
        <a href={BEER_TAX_SOURCE} target="_blank" rel="noreferrer">Directives OFDF</a>
        <button type="button" onClick={copier}>Copier</button>
      </span>
      {onNoteDensity && <button type="button" className="ibr-prim" onClick={onNoteDensity}><Plus size={16} aria-hidden="true" />{!litres ? 'Noter les litres' : densite === 'notee' ? 'Corriger la densité' : 'Noter la densité'}</button>}
    </div>
  );

  return (
    <Sheet open onClose={onClose} title="Impôt bière" subtitle={batch.name} className="md:max-w-xl md:mx-auto" footer={pied}>
      <div className="ibr">
        <div className="ibr-tete"><h3>Combien par bière</h3><span>CHF par hl, selon le °Plato</span></div>

        <section className="ibr-regle" data-testid="ibr-regle" data-hachure={hachure ? 'oui' : 'non'}>
          <div className="ibr-q">
            <span data-testid="ibr-litres">ce brassin · {litres ? <><b className="ibr-m">{nombreFr(litres.litres, 1)} L</b> {motLitres}</> : onNoteDensity ? <button type="button" className="ibr-inc ibr-inc-btn" onClick={onNoteDensity}>litres à noter ›</button> : <span className="ibr-inc">litres à noter</span>}</span>
            {onNoteDensity && densite !== 'notee' && !exonere
              ? <button type="button" className="ibr-puce-btn" onClick={onNoteDensity}><em data-testid="ibr-puce" data-ton="attention">{puce} ›</em></button>
              : <em data-testid="ibr-puce" data-ton={densite === 'notee' && !exonere ? 'neutre' : 'attention'}>{puce}</em>}
          </div>
          <div className="ibr-bandes">
            {classesBareme().map((classe, i) => {
              const actif = brassin.chfParHl === classe.chfParHl;
              return <div key={classe.label} className={`ibr-bd ibr-b${i + 1}`} data-testid={`ibr-bande-${BANDES[i].id}`} aria-current={actif ? 'true' : undefined}>
                <b className="ibr-m">{montantChf(classe.chfParHl)}</b><small>{classe.label}</small>
              </div>;
            })}
            {hachure && <div className="ibr-hach" aria-hidden="true" />}
            {[0, 10, 14, 20].map(degre => <span key={degre} className="ibr-tick" style={{ left: `${positionRegle(degre)}%` }}>{degre === 20 ? '20 °P' : degre}</span>)}
            <div className="ibr-cur" data-testid="ibr-curseur" style={{ left: `${position}%` }} data-bord={position > 60 ? 'gauche' : undefined}>
              <i>{platoTexte}{mention ? ` · ${mention}` : ''}</i>
            </div>
          </div>
          <input className="ibr-slider" type="range" min={0} max={REGLE_MAX_PLATO * 10} step={1} value={Math.round(Math.min(REGLE_MAX_PLATO, plato) * 10)}
            aria-label="Degrés Plato du brassin" aria-valuetext={`${nombreFr(plato, 1)} degrés Plato${mention ? `, ${mention}` : ''}`}
            onChange={event => setDixiemes(Number(event.target.value))} />
          <div className="ibr-res">
            <span>à <span className="ibr-m">{platoTexte}</span>, ce brassin doit</span>
            <b className={`ibr-m${brassin.montant === null ? ' ibr-blanc' : ''}`} data-testid="ibr-resultat">{chf(brassin.montant)}{brassin.montant === null ? '' : <> <small>CHF</small></>}</b>
          </div>
          {reductionConfirmee && reductionPct > 0 && <p className="ibr-note">réduction petit brasseur {nombreFr(reductionPct, 1)} % comprise</p>}
        </section>

        <div className="ibr-h2">Par format vendu <span>à <span className="ibr-m">{platoTexte}</span>{mention ? `, ${mention}` : ''}</span></div>
        <div className="ibr-fmt">
          {formats.map(({ format, impot }) => (
            <div key={format.id} data-testid={`ibr-fmt-${format.id}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{PICTOS[format.id]}</svg>
              <span>{format.label}</span>{' '}
              <b className="ibr-m">{chf(impot)}{impot === null ? '' : <> <small>CHF</small></>}</b>
            </div>
          ))}
        </div>

        <div className="ibr-l" data-testid="ibr-annee">
          <i className="ibr-dot" aria-hidden="true" />
          <div className="ibr-x">
            <b>{litresAn === null ? 'Sur l’année' : <>Sur l’année, si {nombreFr(litresAn, 1).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} L à <span className="ibr-m">{platoTexte}</span></>}</b>
            <span>{litresAn === null ? (profile ? <button type="button" className="ibr-lien" onClick={() => setProfilOuvert(true)}>production annuelle à indiquer ›</button> : 'production annuelle à indiquer (Finances, profil)') : `estimé${mention ? ' · ' + mention : ''} · ${annee}`}</span>
          </div>
          <span className={`ibr-mt ibr-m${impotAn === null ? ' ibr-blanc' : ''}`}>{impotAn === null ? '—' : `~ ${chf(impotAn)}`}</span>
        </div>

        <div className="ibr-qa">
          <div><span>Quand</span><b>à la sortie de cave</b><span className="ibr-sortie" data-testid="ibr-sortie" data-ton={sortieNeutre ? 'neutre' : 'attention'}>{sortieNeutre ? 'aucune sortie rattachée' : 'aucune sortie notée'}</span></div>
          <div><span>À qui</span><b>OFDF, par Taxas</b><span>déclarer sous 20 j, payer sous 30</span></div>
        </div>

        <details className="ibr-pli" data-testid="ibr-reduction">
          <summary><span className="ibr-x"><b>Réduction petit brasseur</b>
            <span>{reductionConfirmee ? `${nombreFr(reductionPct, 1)} % confirmée` : 'non confirmée · taux plein'}</span></span>
            <ChevronDown size={14} aria-hidden="true" /></summary>
          <div className="ibr-corps"><p>Le taux de réduction est communiqué chaque année par l’OFDF ; il ne se déduit pas du volume. L’app n’applique aucune réduction tant qu’elle n’est pas confirmée pour l’année du brassin.</p>
            <p><button type="button" className="ibr-reglage" onClick={ouvrirReglages}>Régler dans Réglages ›</button>{reglage === 'introuvable' && <span role="status"> Menu ⋮ en haut › Réserve impôt sur la bière.</span>}</p></div>
        </details>

        <details className="ibr-pli">
          <summary><span className="ibr-x"><b>Comprendre le barème</b><span>classes OFDF, °Plato et densité</span></span><ChevronDown size={14} aria-hidden="true" /></summary>
          <div className="ibr-corps">
            <p>Le taux dépend du °Plato du moût : {classesBareme().map(c => `${c.label} ${c.de === null ? `jusqu’à ${nombreFr(c.jusqua, 1)} °P` : c.jusqua === null ? `dès ${nombreFr(c.de, 1)} °P` : `de ${nombreFr(c.de, 1)} à ${nombreFr(c.jusqua, 1)} °P`} (${montantChf(c.chfParHl)} CHF/hl)`).join(' ; ')}.</p>
            <p>Le °Plato se lit sur la densité initiale : {nombreFr(1.048, 3)} correspond à {nombreFr(exemplePlato, 1)} °P.</p>
            <p>L’impôt est dû à la sortie de la brasserie, pas à la mise en bouteille : le conditionné n’est qu’un indicateur.</p>
            <p>Déclaration sous 20 jours et paiement sous 30 jours après la fin de la période ({periode}), via Taxas.</p>
            <p>Bière à 0,5 % vol. ou moins : comptée exonérée dans ce calcul, <a href={BEER_TAX_SOURCE} target="_blank" rel="noreferrer">seuil à confirmer auprès de l’OFDF</a>.</p>
            <p>TVA de la bière alcoolisée : {StorageService.getConfig().fiscal.isTvaRegistered ? 'taux normal de 8,1 %.' : 'brasserie non assujettie, aucune TVA facturée.'}</p>
          </div>
        </details>
        {copie !== 'idle' && <p role="status" className="ibr-note">{copie === 'ok' ? 'Copié dans le presse-papiers.' : 'Copie refusée par le navigateur : le texte reste à lire ci-dessus.'}</p>}
      </div>
      {profilOuvert && profile && <React.Suspense fallback={null}><ProfileSheet profile={profile} parametres onClose={() => setProfilOuvert(false)} /></React.Suspense>}
    </Sheet>
  );
}
