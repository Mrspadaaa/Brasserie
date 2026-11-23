// Les quatre vues de Réglages selon d3p2 : Fiscalité, Brasserie, Accès, Sauvegardes. Données de l'app seulement ; ce que l'app ne sait pas
// calculer (date des copies, bascule d'auteur, quittance…) n'est pas affiché : voir RESULTAT.md, « manque ».
import React, { useState } from 'react';
import { AlertCircle, Check, ChevronRight, FolderTree, RotateCcw, ShieldCheck, Sparkles, Download } from 'lucide-react';
import type { AppConfig, BrewhouseProfile, Batch } from '../../types';
import { Input } from '../../ui/Input';
import { NumberInput } from '../../ui/NumberInput';
import { ChampNombre } from '../../ui/depense/ChampNombre';
import { AdresseChamps, ADRESSE_VIDE } from '../../ui/vente/AdresseChamps';
import { BrewhouseSettings } from '../../ui/BrewhouseSettings';
import { BrewSystemCalibration } from '../../ui/BrewSystemCalibration';
import { BrewSystemSource } from '../../ui/BrewSystemSource';
import { BackupPanel } from '../../ui/BackupPanel';
import { DriveStoragePanel } from '../../ui/DriveStoragePanel';
import { BORNES_FINANCE } from '../../domain/finance/bornesFinance';
import { COMPANY_FALLBACK, adresseBrasserie, uidValide } from '../../domain/companyDefaults';
import { ibanCompact } from '../../domain/finance/iban';
import { nombreFr } from '../../domain/nombreAffiche';
import { applySystemCalibration, systemCalibrationProposals } from '../../domain/brewSystemInsights';
import type { EquipmentItem } from '../../types';
import { diagnosticIban, impotParBouteille, TRANCHES_PLATO, ventilationVente, volumeAvantEbullition, type Bilan, type Etat, type OngletId, ONGLETS } from './regles';
import './reglages.css';

type Brouillon = AppConfig;
type SetBrouillon = React.Dispatch<React.SetStateAction<Brouillon>>;
const pct = (n: number) => Math.round(n * 1000) / 10;

export const NOMS_ONGLETS: Record<OngletId, string> = { fiscal: 'Fiscalité', brewhouse: 'Brasserie', security: 'Accès', backup: 'Sauvegardes' };
export const COULEUR_ONGLET: Record<OngletId, string> = { fiscal: '--area-finances', brewhouse: '--area-production', security: '--water', backup: '--area-stocks' };
const LIBELLE_ETAT: Record<Etat, string> = { ko: 'à corriger', to: 'à saisir', ok: 'bon', na: 'non suivi' };

export const Ligne = ({ label, sub, children, err = false }: { label: React.ReactNode; sub?: string; children?: React.ReactNode; err?: boolean }) => (
  <div className={`rg-r${err ? ' rg-err' : ''}`}><span className="rg-l">{label}{sub && <small>{sub}</small>}</span><span className="rg-ld" />{children}</div>
);

/** Onglets à point de santé + bilan en barre de segments (greffe d2). */
export function EnteteReglages({ actif, onOnglet, bilan, occupe, sauvegardeOccupee, onClose, fermable }: {
  actif: OngletId; onOnglet: (o: OngletId) => void; bilan: Bilan; occupe: boolean; sauvegardeOccupee: boolean; onClose: () => void; fermable: boolean;
}) {
  return (
    <div className="rg-band">
      <div className="rg-hd"><i aria-hidden="true"><ShieldCheck size={16} /></i><h3 id="settings-modal-title">Réglages</h3>
        <button type="button" className="rg-x" aria-label="Fermer" onClick={onClose} disabled={!fermable}>×</button></div>
      <div className="rg-tabs">
        {ONGLETS.map(o => (
          <button key={o} type="button" aria-pressed={actif === o} disabled={o === 'backup' ? occupe || sauvegardeOccupee : sauvegardeOccupee} onClick={() => onOnglet(o)}>
            <i className={`rg-dot rg-${bilan.parOnglet[o]}`} title={LIBELLE_ETAT[bilan.parOnglet[o]]} />{NOMS_ONGLETS[o]}
          </button>
        ))}
      </div>
      <div className="rg-bil" aria-label="Bilan des réglages">
        <u aria-hidden="true">{bilan.segments.map((e, i) => <i key={i} className={`rg-${e}`} />)}</u>
        {(['ko', 'to', 'ok'] as const).map(e => <span key={e}><i className={`rg-dot rg-${e}`} /><b>{bilan[e]}</b>{e === 'ok' && bilan.ok > 1 ? 'bons' : LIBELLE_ETAT[e]}</span>)}
      </div>
    </div>
  );
}

/** Une vente de 100 CHF TTC, ce qui reste (HT) et la TVA, pour la bière et les denrées. */
function BarresTva({ f }: { f: AppConfig['fiscal'] }) {
  const lignes: [string, number][] = [['Bière', f.tvaNormalRate], ['Denrées', f.tvaReducedRate]];
  return (
    <>
      <div className="rg-cap">Sur une vente de <b>100,00 CHF</b> TTC, il te reste</div>
      <div className="rg-sale">
        {lignes.map(([nom, taux]) => {
          const v = ventilationVente(100, taux);
          return <React.Fragment key={nom}>
            <span>{nom}<small>{nombreFr(pct(taux), 1)} %</small></span>
            {v ? <div className="rg-bar"><i className="rg-ht">{nombreFr(v.ht, 2)}<small>HT</small></i><i className="rg-tva" style={{ width: `${v.partTvaPct}%` }} /><i className="rg-tvl">{nombreFr(v.tva, 2)}</i></div> : <span>taux à saisir</span>}
          </React.Fragment>;
        })}
      </div>
    </>
  );
}

export function BandeauFiscalite({ f }: { f: AppConfig['fiscal'] }) { return <BarresTva f={f} />; }

const Statut = () => {
  const [ouvert, setOuvert] = useState(false);
  return <>
    <button type="button" className="rg-b2" aria-expanded={ouvert} onClick={() => setOuvert(o => !o)}>Quel statut ?</button>
    {ouvert && <p className="rg-note" style={{ flexBasis: '100%' }}>Reproduis le statut confirmé auprès de l’AFC. Le seuil de chiffre d’affaires ne remplace pas une décision d’assujettissement, notamment volontaire.</p>}
  </>;
};

function LigneIban({ company, onChange, erreur, ibanDeConfig }: { company: AppConfig['company']; onChange: (c: AppConfig['company']) => void; erreur: string; ibanDeConfig: boolean }) {
  const valeur = company.iban || COMPANY_FALLBACK.iban;
  const diag = erreur ? diagnosticIban(valeur) : null;
  /* Le miroir est une seule ligne, comme d3p2 : « CH44 0076 … 4920 1 › » (début et fin) ; les chiffres de contrôle sont surlignés. Le champ entier reste à la saisie. */
  const compact = ibanCompact(valeur) ?? ''; // aucun IBAN (ni saisi ni de gabarit) : la ligne se rend vide, sans planter
  const groupes = compact.match(/.{1,4}/g) ?? [];
  const court = groupes.length > 4 ? [groupes[0], groupes[1], '…', ...groupes.slice(-2)] : groupes;
  const miroir = court.map((g, gi) => {
    const debut = gi * 4;
    const cle = diag?.cle;
    const surligne = (c: string, k: number) => (cle && debut + k >= cle[0] && debut + k < cle[1] && g !== '…' ? <u key={k}>{c}</u> : c);
    return <React.Fragment key={gi}>{gi > 0 ? ' ' : ''}{g === '…' ? g : [...g].map(surligne)}</React.Fragment>;
  });
  return <>
    <Ligne label="IBAN" sub={ibanDeConfig ? 'valeur de l’app' : undefined} err={!!erreur}>
      <span className="rg-ibanw">
        {diag && <span className="rg-mir" aria-hidden="true"><span>{miroir}</span><b>›</b></span>}
        <Input id="settings-company-iban" aria-label="IBAN Brasserie (factures par virement)" type="text" name="settings_company_qr_ref" autoComplete="off" autoCorrect="off" spellCheck={false}
          data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" placeholder="CH00 0000 0000 0000 0000 0"
          value={valeur} aria-invalid={erreur ? true : undefined} aria-describedby={erreur ? 'settings-company-iban-erreur' : undefined}
          onChange={e => onChange({ ...company, iban: e.target.value })} className="rg-in rg-wide" />
      </span>
    </Ligne>
    {erreur && <div className="rg-hint" id="settings-company-iban-erreur" role="alert"><AlertCircle size={15} aria-hidden="true" /><span>{diag?.court ?? 'IBAN à corriger'}</span>
      <button type="button" className="rg-b2" onClick={() => document.getElementById('settings-company-iban')?.focus()}>Corriger</button>
      {/* le message entier, pour les lecteurs d'écran : la ligne visible n'en garde que la cause */}
      <span className="rg-sr">{erreur}</span></div>}
  </>;
}

export function Fiscalite({ f, setF, company, setCompany, ibanErreur, ibanDeConfig }: {
  f: AppConfig['fiscal']; setF: (next: AppConfig['fiscal']) => void; company: AppConfig['company']; setCompany: (c: AppConfig['company']) => void; ibanErreur: string; ibanDeConfig: boolean;
}) {
  const [calcul, setCalcul] = useState(false);
  const reduction = f.beerTaxAnnualReductionPct;
  const par33 = impotParBouteille(TRANCHES_PLATO.find(t => t.normale)!.chfParHl, 33, reduction);
  const taux = (id: string, label: string, cle: 'tvaReducedRate' | 'tvaNormalRate', sub: string) => (
    <Ligne label={<label htmlFor={id}>{label.split(' (')[0]}</label>} sub={sub}>
      <ChampNombre id={id} aria-label={label} value={pct(f[cle])} onValue={v => { if (v !== undefined) setF({ ...f, [cle]: v / 100 }); }} max={BORNES_FINANCE.tauxTvaPct.valeur} className="rg-in" /><span className="rg-v">%</span>
    </Ligne>);
  const a = company.adresse ?? ADRESSE_VIDE;
  const adr = adresseBrasserie(company);
  return (
    <div className="rg-two">
      <div className="rg-blk-tva">
        <div className="rg-gt"><span>TVA</span></div>
        <Ligne label={<label htmlFor="settings-tva">Brasserie assujettie à la TVA</label>}>
          <Statut />
          <input id="settings-tva" type="checkbox" role="switch" className="rg-tg" name="settings_tva_registered" autoComplete="off" data-form-type="other" checked={f.isTvaRegistered} onChange={e => setF({ ...f, isTvaRegistered: e.target.checked })} />
        </Ligne>
        {taux('settings-vat-reduced', 'TVA réduite (denrées admissibles)', 'tvaReducedRate', 'denrées admissibles')}
        {taux('settings-vat-normal', 'TVA normale (bière alcoolisée, matériel)', 'tvaNormalRate', 'bière alcoolisée, matériel')}
      </div>
      <div className="rg-blk-impot">
        <div className="rg-gt"><span>Impôt sur la bière</span><span>{nombreFr(par33, 3)} CHF / 33 cl</span></div>
        <Ligne label={<label htmlFor="ofdf-red">Réduction annuelle OFDF</label>}>
          <NumberInput id="ofdf-red" aria-label="Réduction annuelle OFDF (%)" value={reduction} onValue={value => setF({ ...f, beerTaxAnnualReductionPct: value })} min={0} max={40} placeholder="à saisir" className={`rg-in${reduction === undefined ? ' rg-todo' : ''}`} />{reduction !== undefined && <span className="rg-v">%</span>}
        </Ligne>
        <Ligne label={<label htmlFor="ofdf-an">Année confirmée</label>}>
          <NumberInput id="ofdf-an" aria-label="Année confirmée" value={f.beerTaxReductionYear} onValue={value => setF({ ...f, beerTaxReductionYear: value })} min={2000} max={2200} integer placeholder="à saisir" className={`rg-in${f.beerTaxReductionYear === undefined ? ' rg-todo' : ''}`} />
        </Ligne>
        <Ligne label="Périodicité attribuée">
          <span className="rg-chips" role="group" aria-label="Périodicité attribuée" data-set={f.beerTaxPeriod ? 'true' : 'false'}>
            {([['annual', 'Annuelle'], ['quarterly', 'Trimestrielle']] as const).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={f.beerTaxPeriod === v} onClick={() => setF({ ...f, beerTaxPeriod: f.beerTaxPeriod === v ? undefined : v })}>{t}</button>))}
          </span>
        </Ligne>
        {!f.beerTaxPeriod && <p className="rg-note">À confirmer auprès de l’OFDF.</p>}
        <button type="button" className="rg-r" style={{ width: '100%', background: 'none', textAlign: 'left' }} aria-expanded={calcul} onClick={() => setCalcul(c => !c)}>
          <span className="rg-l">Calcul et déclaration</span><span className="rg-ld" /><small className="rg-note">CHF/hl selon Plato</small><ChevronRight size={14} aria-hidden="true" />
        </button>
        <div className="rg-pl3">{TRANCHES_PLATO.map(t => <span key={t.libelle} className={t.normale ? 'rg-on' : ''}><small>{t.libelle}</small><b>{nombreFr(t.chfParHl, 2)}</b></span>)}</div>
        {calcul && <div className="rg-note"><p>Taux pleins selon le degré Plato : 16,88 / 25,32 / 33,76 CHF par hl. Le conditionnement fournit une réserve indicative ; l’impôt naît à la sortie ou à la consommation sur place.</p>
          <p>Sans taux annuel confirmé, aucune réduction n’est supposée. Les paiements et décomptes s’effectuent selon les décisions de l’OFDF, via Taxas.</p>
          <a href="https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Consulter les informations OFDF</a></div>}
      </div>
      <div className="rg-blk-fact">
        <div className="rg-gt"><span>Factures par virement</span></div>
        <LigneIban company={company} onChange={setCompany} erreur={ibanErreur} ibanDeConfig={ibanDeConfig} />
        <details className="rg-r" style={{ display: 'block' }}>
          <summary style={{ minHeight: 32, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Identité de la brasserie{!company.uid?.trim() || !adr ? ' · à compléter' : ''}</summary>
          <label htmlFor="identite-nom" className="rg-note">Nom sur les factures</label>
          <Input id="identite-nom" name="identite_nom_label" autoComplete="off" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} className="rg-in rg-wide" style={{ width: '100%', textAlign: 'left' }} />
          <label htmlFor="identite-uid" className="rg-note">Numéro UID (CHE-123.456.789)</label>
          <Input id="identite-uid" name="identite_uid_label" autoComplete="off" value={company.uid ?? ''} onChange={e => setCompany({ ...company, uid: e.target.value })} aria-invalid={company.uid?.trim() && !uidValide(company.uid) ? true : undefined} className="rg-in rg-wide" style={{ width: '100%', textAlign: 'left' }} />
          {company.uid?.trim() && !uidValide(company.uid) && <p className="rg-note">Le numéro UID a la forme CHE-123.456.789.</p>}
          <AdresseChamps legende="Adresse de la brasserie" value={company.adresse ?? (adr ? { rue: adr.rue, numero: adr.numero, npa: adr.npa, localite: adr.localite, pays: adr.pays } : a)} onChange={adresse => setCompany({ ...company, adresse })} />
        </details>
      </div>
    </div>
  );
}

function SchemaCuve({ bh }: { bh: BrewhouseProfile }) {
  const e = bh.equipment;
  const avant = volumeAvantEbullition(bh);
  if (!e || avant === null) return <p className="rg-note">Le schéma de la cuve apparaît quand l’installation est renseignée.</p>;
  const K = e.kettleCapacityL, Fc = e.fermenterCapacityL;
  const L = (l: number) => 150 - Math.min(l, K) * (126 / K);
  const F = (l: number) => 150 - Math.min(l, Fc) * (96 / Fc);
  const mousse = Fc * (1 - e.fermenterHeadspacePct / 100);
  /* Les repères de la cuve (haut, limite utile, volume avant ébullition, perte) peuvent tomber à quelques pixels l'un de l'autre (35 L utile, 35,8 L avant ébullition) :
     on les range de haut en bas et on les écarte d'au moins 12 px, avec un petit trait vers le niveau qu'ils désignent. */
  const ECART = 12;
  const etiquettes = ([
    { id: 'haut', valeur: K, unite: 'L', cible: L(K) + 4 },
    { id: 'utile', valeur: e.kettleWorkingL, unite: 'utile', cible: L(e.kettleWorkingL) + 4 },
    { id: 'avant', valeur: avant, unite: 'L', cible: L(avant) + 4 },
    { id: 'perte', valeur: bh.deadSpaceL, unite: 'L perte', cible: L(bh.deadSpaceL) + 2 }
  ] as { id: string; valeur: number; unite: string; cible: number; y: number }[])
    .sort((a, b) => a.cible - b.cible || (a.id === 'utile' ? -1 : 1))
    .map((t, i, tous) => { t.y = t.cible; if (i > 0) t.y = Math.max(t.cible, tous[i - 1].y + ECART); return t; });
  return (
    <>
      <div className="rg-cap">Pour <b>{nombreFr(bh.volumeL, 1)} L</b> en fermenteur, il faut <b>{nombreFr(avant, 1)} L</b> avant ébullition (1 h)</div>
      <svg className="rg-svg" viewBox="0 0 362 172" role="img" aria-label={`Cuve ${nombreFr(K, 1)} L, limite utile ${nombreFr(e.kettleWorkingL, 1)} L ; fermenteur ${nombreFr(Fc, 1)} L`}>
        <path d={`M22 ${L(K)} V144 q0 6 6 6 H128 q6 0 6-6 V${L(K)}`} fill="none" stroke="var(--rg-t0)" strokeWidth="2.2" />
        <rect x="23.5" y={L(avant)} width="109" height={150 - L(avant) - 1.5} rx="4" fill="var(--rg-c)" opacity=".42" />
        <rect x="23.5" y={L(bh.deadSpaceL)} width="109" height={Math.max(0, 150 - L(bh.deadSpaceL) - 1.5)} fill="var(--rg-c)" />
        <line x1="16" x2="140" y1={L(e.kettleWorkingL)} y2={L(e.kettleWorkingL)} stroke="var(--rg-t0)" strokeWidth="1.4" strokeDasharray="4 3" />
        {etiquettes.map(t => <g key={t.id}>
          {Math.abs(t.y - t.cible) > 2 && <path d={`M136 ${t.cible} L140 ${t.y - 3}`} stroke="var(--rg-t2)" strokeWidth="0.8" fill="none" />}
          <text x="142" y={t.y} className={t.id === 'avant' ? 'rg-c' : undefined}><tspan className="rg-n">{nombreFr(t.valeur, 1)}</tspan> {t.unite}</text>
        </g>)}
        <text x="30" y={L(avant) - 12} className="rg-s">{nombreFr(e.boilOffLPerHour, 1)} L/h</text>
        <text x="40" y="168" className="rg-s">Cuve</text>
        <path d="M182 98 h30" stroke="var(--rg-t0)" strokeWidth="1.6" markerEnd="url(#rg-ar)" />
        <defs><marker id="rg-ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="var(--rg-t0)" /></marker></defs>
        <text x="198" y="90" textAnchor="middle" className="rg-c"><tspan className="rg-n" style={{ fontSize: 12 }}>{nombreFr(bh.efficiencyPct, 0)}</tspan> %</text>
        <text x="198" y="114" textAnchor="middle" className="rg-c" style={{ fontSize: 10.5 }}>rendement</text>
        <path d={`M232 ${F(Fc)} V144 q0 6 6 6 H302 q6 0 6-6 V${F(Fc)}`} fill="none" stroke="var(--rg-t0)" strokeWidth="2.2" />
        <rect x="233.5" y={F(bh.volumeL)} width="73" height={Math.max(0, 150 - F(bh.volumeL) - 1.5)} rx="3" fill="var(--rg-c)" opacity=".42" />
        <line x1="228" x2="312" y1={F(mousse)} y2={F(mousse)} stroke="var(--rg-t0)" strokeWidth="1.2" strokeDasharray="3 3" />
        <text x="312" y={F(Fc) + 4}><tspan className="rg-n">{nombreFr(Fc, 1)}</tspan> L</text>
        <text x="312" y={F(bh.volumeL) + 4} className="rg-c"><tspan className="rg-n">{nombreFr(bh.volumeL, 1)}</tspan> L</text>
        <text x="214" y="168" className="rg-s">Fermenteur · mousse {nombreFr(e.fermenterHeadspacePct, 0)} %</text>
      </svg>
    </>
  );
}

export function BandeauBrasserie({ bh }: { bh?: BrewhouseProfile }) { return bh ? <SchemaCuve bh={bh} /> : <p className="rg-note">Aucune installation.</p>; }

export function Brasserie({ draft, setDraft, batches, inventaire, setMessage }: {
  draft: Brouillon; setDraft: SetBrouillon; batches: Batch[]; inventaire: EquipmentItem[]; setMessage: (m: string) => void;
}) {
  const [source, setSource] = useState<string>();
  const [voir, setVoir] = useState(false);
  const maj = (next: BrewhouseProfile) => setDraft(d => ({ ...d, brewhouses: d.brewhouses.map(b => (b.id === next.id ? next : b)) }));
  return (
    <div>
      {draft.brewhouses.map(bh => {
        const actif = bh.id === draft.activeBrewhouseId;
        const e = bh.equipment;
        const prop = actif ? systemCalibrationProposals(bh, batches).find(p => p.parameter === 'efficiencyPct' && p.eligible && p.value !== p.previousValue) : undefined;
        return (
          <section key={bh.id} aria-label={bh.name}>
            <Ligne label={actif ? 'Installation active' : bh.name}><span className="rg-v">{actif ? bh.name : ''} · {nombreFr(e?.kettleCapacityL ?? bh.volumeL, 1)} L</span></Ligne>
            <Ligne label="Rendement en fermenteur"><span className="rg-v">{nombreFr(bh.efficiencyPct, 1)} %</span></Ligne>
            {prop && <div className="rg-sug"><Sparkles size={15} aria-hidden="true" /><span>Tes {prop.count} derniers brassins : <b>{nombreFr(prop.value, 1)} %</b></span><span className="rg-sp" />
              <button type="button" className="rg-b2" onClick={() => setVoir(v => !v)}>Voir</button>
              <button type="button" className="rg-b2" onClick={() => { const r = applySystemCalibration(bh, prop, batches); if (r.ok !== false) { maj(r.profile); setMessage('Calibration choisie : enregistre les paramètres pour la conserver.'); } }}>Appliquer</button></div>}
            <Ligne label="Évaporation à chaud"><span className="rg-v">{e ? `${nombreFr(e.boilOffLPerHour, 1)} L/h` : `${nombreFr(bh.boilOffRatePct, 1)} %/h`}</span></Ligne>
            <Ligne label="Pertes en fond de cuve" sub="litres froids"><span className="rg-v">{nombreFr(bh.deadSpaceL, 1)} L</span></Ligne>
            {e && <Ligne label="Absorption du grain · rétraction"><span className="rg-v">{nombreFr(e.grainAbsorptionLPerKg, 2)} L/kg · {nombreFr(e.coolingShrinkagePct, 1)} %</span></Ligne>}
            {e && <Ligne label="Cuve · totale / utile" sub={e.workingVolumeConfirmed ? 'limite utile vérifiée' : 'limite utile à vérifier'}><span className="rg-v">{nombreFr(e.kettleCapacityL, 1)} / {nombreFr(e.kettleWorkingL, 1)} L</span></Ligne>}
            {e && <Ligne label="Fermenteur · habituel / total"><span className="rg-v">{nombreFr(bh.volumeL, 1)} / {nombreFr(e.fermenterCapacityL, 1)} L</span></Ligne>}
            {actif && <>
              <BrewhouseSettings profile={bh} inventory={inventaire} onChange={maj} />
              <BrewSystemCalibration profile={bh} batches={batches} onOpenBatch={setSource} onChange={next => { maj(next); setMessage('Calibration choisie : enregistre les paramètres pour la conserver.'); }} />
              {source && batches.find(b => b.id === source) && <BrewSystemSource batch={batches.find(b => b.id === source)!} onClose={() => setSource(undefined)} />}
            </>}
          </section>
        );
      })}
    </div>
  );
}

export function BandeauAcces({ email, drive }: { email?: string | null; drive: boolean }) {
  return (
    <>
      <div className="rg-cap">Qui entre dans la brasserie, et par où</div>
      <div className="rg-who">
        <div className="rg-node"><i>{(email ?? '?').slice(0, 1).toUpperCase()}</i>{email ?? 'Personne'}<small>{email ? 'connecté' : 'non connecté'}</small></div><span className="rg-link" />
        <div className="rg-node"><i><ShieldCheck size={22} aria-hidden="true" /></i>Compte Google<small>authentification Firebase</small></div><span className="rg-link" />
        <div className="rg-node"><i style={{ background: 'var(--rg-t0)' }}><FolderTree size={20} aria-hidden="true" /></i>Drive<small>{drive ? 'justificatifs' : 'à connecter'}</small></div>
      </div>
    </>
  );
}

export function Acces({ email, modifs14j, onOuvrirJournal, onExporter }: { email?: string | null; modifs14j: number; onOuvrirJournal: () => void; onExporter: () => void }) {
  return (
    <div>
      <Ligne label="Compte Google" sub="authentification Firebase"><span className={`rg-st${email ? ' rg-bon' : ''}`}>{email ? <><Check size={14} aria-hidden="true" /> connecté</> : <><i aria-hidden="true" /> non connecté</>}</span></Ligne>
      <Ligne label="Journal des modifications" sub="qui a fait quoi, quand"><span className="rg-v">{modifs14j} en 14 j</span><button type="button" className="rg-b2" onClick={onOuvrirJournal}>Ouvrir</button></Ligne>
      <Ligne label="Arborescence Google Drive" sub="liste classée des justificatifs"><button type="button" className="rg-b2" onClick={onExporter}><Download size={14} aria-hidden="true" />Exporter</button></Ligne>
    </div>
  );
}

export function BandeauSauvegardes({ brassins, ecritures }: { brassins: number; ecritures: number }) {
  return <div className="rg-cap">Ce que contient une copie : <b>{brassins}</b> brassins · <b>{ecritures}</b> écritures · la date de la dernière copie n’est pas suivie par l’app</div>;
}

export function Sauvegardes({ visible, setBackupBusy, setMigrationBusy, backupRunning, migrationBusy, busy, onReset }: {
  visible: boolean; setBackupBusy: (b: boolean) => void; setMigrationBusy: (b: boolean) => void; backupRunning: boolean; migrationBusy: boolean; busy: boolean; onReset: () => void;
}) {
  return (
    <div hidden={!visible} className="rg-flat">
      {/* L'ordre de d3p2 (Garder, Restaurer, Justificatifs, Cet appareil) : les deux panneaux gardent leur code, la mise en page les range. */}
      <DriveStoragePanel onBusyChange={setMigrationBusy} disabled={backupRunning} />
      <BackupPanel onBusyChange={setBackupBusy} disabled={migrationBusy} />
      <div className="rg-gt rg-dernier"><span>Cet appareil</span></div>
      <button type="button" onClick={onReset} disabled={busy || backupRunning || migrationBusy} className="rg-r rg-dernier" style={{ width: '100%', color: 'var(--rg-alt)', background: 'none', textAlign: 'left' }}>
        <span className="rg-l" style={{ color: 'var(--rg-alt)' }}>Réinitialiser l’affichage de cet appareil</span><span className="rg-ld" /><RotateCcw size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

const ibanAbsent = (c: AppConfig['company']) => !ibanCompact(c.iban || COMPANY_FALLBACK.iban);
