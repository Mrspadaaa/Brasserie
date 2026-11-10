import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Beer, ChevronDown, Container, Pencil, Sparkles, Wine } from 'lucide-react';
import type { AppConfig, Batch, PricingItem } from '../../types';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { Sheet } from '../Sheet';
import { TarifSheet, type FormatChoix } from '../TarifSheet';
import { montantChf } from '../../domain/finance/ledger';
import { nombreFr } from '../../domain/nombreAffiche';
import { GraphePrix } from './GraphePrix';
import { brassinEnUnites, formatDuTarif, lirePrix, resteAnnuel, tarifsDuFormat, unitesParAn, type FormatId, type LecturePrix } from './calculPrix';
import { bieresDe, biereDuBrassin, brassinDuCout, formatsDe, impotUnite, lireDonneesPrix, prixReels } from './donneesPrix';
import './prix.css';

const BrewBudgetDialog = React.lazy(() => import('../finance/BrewBudgetDialog').then(m => ({ default: m.BrewBudgetDialog })));
const BrewerChat = React.lazy(() => import('../BrewerChat').then(m => ({ default: m.BrewerChat })));

const chf = (n: number) => montantChf(n);
const ICONES: Record<FormatId, typeof Beer> = { '33cl': Beer, '75cl': Wine, fut: Container };
const unite = (id: FormatId) => (id === 'fut' ? 'fût' : 'bouteille');
const entierFr = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface PrixEcranProps {
  config: AppConfig;
  /** Les tarifs vivants de l'appelant ; sinon ceux du stockage. */
  tarifs?: PricingItem[];
  batches?: Batch[];
  /** Brassin d'où l'on vient (fiche, onglet Argent) : c'est son coût qui est lu. Sans lui : le dernier brassin chiffré de la bière. */
  batchId?: string;
  formatInitial?: FormatId;
  /** Le bouton + de l'app demande un tarif neuf (horodatage). */
  nouveau?: number | null;
  onSuccessMessage?: (message: string) => void;
}

export function PrixEcran({ config, tarifs: tarifsProp, batches: batchesProp, batchId, formatInitial, nouveau, onSuccessMessage }: PrixEcranProps) {
  const d = useStorageValue(lireDonneesPrix);
  const tarifs = tarifsProp ?? d.tarifs;
  const batches = batchesProp && batchesProp.length ? batchesProp : d.batches;
  const bieres = useMemo(() => {
    const deTarifs = tarifs.map(t => t.biere).filter((b): b is string => Boolean(b));
    return [...new Set([...bieresDe(batches), ...deTarifs])];
  }, [batches, tarifs]);
  const duBrassin = batchId ? batches.find(b => b.id === batchId) : undefined;
  const [biereChoisie, setBiere] = useState<string | undefined>(duBrassin ? biereDuBrassin(duBrassin) : undefined);
  const biere = biereChoisie && (bieres.includes(biereChoisie) || !bieres.length) ? biereChoisie : bieres[0];
  const [formatId, setFormatId] = useState<FormatId>(formatInitial ?? '33cl');
  const [an, setAn] = useState<boolean>(() => StorageService.getUiState<string>('prix_lecture', 'bouteille') === 'an');
  const [feuille, setFeuille] = useState<PricingItem | null>(null);
  const [coutOuvert, setCoutOuvert] = useState(false);
  const [question, setQuestion] = useState<string | undefined>();
  useEffect(() => { StorageService.setUiState('prix_lecture', an ? 'an' : 'bouteille'); }, [an]);

  const chiffrage = useMemo(() => brassinDuCout(batches, d.plans, d.fiscal, biere, batchId), [batches, d.plans, d.fiscal, biere, batchId]);
  const batch = chiffrage?.batch;
  const formats = formatsDe(batch, d.kegs);
  const actif = formats.find(f => f.format.id === formatId) ?? formats[0];
  const assujetti = config.fiscal.isTvaRegistered;
  const litresAn = typeof d.profile?.annualProductionL === 'number' && d.profile.annualProductionL > 0 ? d.profile.annualProductionL : undefined;

  const lire = (f: { id: string; volumeL: number }, emballageSaisi?: number | null, prixSaisi?: number | null) => {
    const tf = tarifsDuFormat(tarifs, f.id as FormatId, biere);
    const tarif = tf.kind === 'un' || tf.kind === 'sans-prix' ? tf.tarif : null;
    const prix = prixSaisi !== undefined ? prixSaisi : tf.kind === 'un' ? tf.tarif.priceHT : null;
    const emballage = emballageSaisi !== undefined ? emballageSaisi : (tarif?.emballageUnite ?? null);
    const lecture = lirePrix({ litreLiquide: chiffrage?.litre?.liquide ?? null, volumeL: f.volumeL, emballageUnite: emballage, impotUnite: impotUnite(chiffrage, f.volumeL), prixHT: prix });
    return { tf, tarif, prix, lecture, unites: unitesParAn(litresAn, f.volumeL) };
  };

  const cur = lire(actif.format);
  const { lecture, unites, prix } = cur;
  const reste = lecture.reste;
  const resteAn = reste && unites !== null ? resteAnnuel(reste.valeur, unites) : null;
  const lectureAn = an && resteAn !== null;
  const plusDe = reste !== null && reste.valeur < 0;
  const reels = useMemo(() => prixReels(d.transactions, formatId, prix, assujetti), [d.transactions, formatId, prix, assujetti]);
  const base = batch && formats.every(f => f.format.id === formatId || !f.present) ? batch.packaging : undefined;
  const unitesReelles = base ? (formatId === '33cl' ? base.bottles33 : formatId === '75cl' ? base.bottles75 : base.kegIds?.length ?? 0) : null;
  const ligneBrassin = chiffrage?.litre ? brassinEnUnites({ coutBrassin: chiffrage.notions?.total ?? null, prixHT: prix, litresNets: chiffrage.litres, volumeL: actif.format.volumeL, unitesReelles }) : null;

  const completer = tarifs.filter(t => !t.format);
  const choixFormats: FormatChoix[] = formats.map(f => ({ id: f.format.id as FormatId, label: f.format.label, volumeL: f.format.volumeL }));
  const ouvrir = (t?: PricingItem) => setFeuille(t ?? { product: '', biere, format: { id: actif.format.id as FormatId, volumeL: actif.format.volumeL }, priceHT: Number.NaN });
  useEffect(() => { if (nouveau) ouvrir(); }, [nouveau]); // eslint-disable-line react-hooks/exhaustive-deps

  // Une seule voie d'écriture : le libellé est la clé de stockage ; un renommage remplace la ligne éditée. Le journal est écrit ici, sans « marge » (le coût n'est plus saisi).
  const enregistrer = (t: PricingItem, ancien?: string) => {
    const tous = StorageService.getTarifs();
    const cle = ancien ?? t.product;
    const i = tous.findIndex(x => x.product === cle);
    StorageService.saveTarifs(i >= 0 ? tous.map((x, j) => (j === i ? { ...x, ...t } : x)) : [...tous, t]);
    const note = `${chf(t.priceHT)} CHF HT${t.format ? ` · ${t.format.id}` : ''}`;
    StorageService.logAction(i >= 0 ? 'Modification' : 'Création', 'Clients', t.product, ancien && ancien !== t.product ? `Tarif renommé : ${ancien} → ${t.product} · ${note}` : `Tarif ${t.product} : ${note}`);
    onSuccessMessage?.(`Tarif « ${t.product} » enregistré.`);
  };
  const supprimer = (t: PricingItem) => { StorageService.deleteTarif(t.product); onSuccessMessage?.(`Tarif « ${t.product} » supprimé.`); };

  const question1 = () => {
    const f = majuscule(actif.format.label);
    const lignes = [`Mon tarif : ${biere ?? 'ma bière'} ${f}${prix !== null ? ` à ${chf(prix)} CHF HT` : ', pas encore de prix'}.`,
      lecture.cout ? `Coût du ${unite(formatId)} : ${lecture.cout.exact ? '' : 'au moins '}${chf(lecture.cout.affiche)} CHF${lecture.cout.exact ? '' : ' (emballage à compléter)'}.` : 'Coût du format encore inconnu.',
      reste ? `Il me reste ${reste.borne ? 'au plus ' : ''}${chf(reste.valeur)} CHF (${nombreFr(lecture.partPrix, 0)} % du prix).` : '',
      'Quel prix me conseilles-tu, et pourquoi ?'];
    return lignes.filter(Boolean).join(' ');
  };

  const tete = (() => {
    if (prix === null) return <><small>Pas encore de prix</small><b className="prx-m prx-q">?</b></>;
    if (!reste) return <><small>Il te reste</small><b className="prx-m prx-q">?</b><span>coût du litre à compléter</span></>;
    const v = lectureAn ? resteAn! : reste.valeur;
    const mot = plusDe ? 'Il te manque' : lectureAn ? 'Il te resterait' : 'Il te reste';
    return <><small>{mot}{reste.borne && !plusDe ? ' ≤' : ''}</small><b className={`prx-m${plusDe ? ' prx-neg' : ''}${lectureAn ? ' prx-an' : ''}`}>{chf(Math.abs(v))}</b><span>CHF {lectureAn ? 'par an' : `par ${unite(formatId)}`}</span></>;
  })();
  const autre = reste && resteAn !== null ? (lectureAn ? `${chf(reste.valeur)}` : `${chf(resteAn)}`) : null;

  const nbCases = ligneBrassin ? Math.min(ligneBrassin.n, 200) : 0;
  const cases = ligneBrassin ? (ligneBrassin.paient / ligneBrassin.n) * 92 : 0;

  return (
    <div className="prx" data-lecture={lectureAn ? 'an' : 'bouteille'}>
      <div className="prx-col prx-col-graphe">
        <div className="prx-prod">
          <label className="prx-biere">
            <span className="sr-only">Bière</span>
            {bieres.length > 1 ? <><select value={biere ?? ''} onChange={e => setBiere(e.target.value)} aria-label="Bière">{bieres.map(b => <option key={b}>{b}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></> : <b>{biere ?? 'Aucune bière'}</b>}
          </label>
        </div>
        <div className="prx-fmt" role="group" aria-label="Format">
          {formats.map(f => { const Icone = ICONES[f.format.id as FormatId]; return <button key={f.format.id} type="button" aria-pressed={f.format.id === formatId} data-absent={f.present ? undefined : ''} onClick={() => setFormatId(f.format.id as FormatId)}><Icone size={18} aria-hidden="true" />{majuscule(f.format.label)}</button>; })}
        </div>
      </div>
      <div className="prx-col prx-col-tete">
        <div className="prx-ans" data-booster="reste">{tete}{reste && prix !== null && <em className="prx-part">{nombreFr(lecture.partPrix, 0)} % du prix</em>}</div>
        <div className="prx-sous">
          {autre !== null && <button type="button" className="prx-swap" aria-pressed={lectureAn} onClick={() => setAn(!lectureAn)} data-booster="bascule-tete"><span className="prx-m">{autre}</span> {lectureAn ? `par ${unite(formatId)}` : 'par an'}<ArrowLeftRight size={15} aria-hidden="true" /></button>}
          {lectureAn && litresAn !== undefined && <i className="prx-hyp">si {entierFr(litresAn)} L en {actif.format.label}<br />estimé</i>}
          {unites === null && reste && <i className="prx-hyp">volume annuel à renseigner</i>}
        </div>
      </div>
      <div className="prx-col prx-col-graphe prx-col-svg">
        {lecture.cout ? <GraphePrix cout={lecture.cout.affiche} coutExact={lecture.cout.exact} prix={prix} unites={unites} an={lectureAn} reels={reels} libelleUnite={unite(formatId)} />
          : <div className="prx-inconnu" role="status"><b className="prx-m">coût ?</b><span>Le coût du litre n’est pas encore complet : prix d’un stock, litres nets ou densité à noter.</span></div>}
        {lecture.cout && chiffrage?.litre && <button type="button" className="prx-cout" onClick={() => setCoutOuvert(true)}><span className="prx-m">{chf(chiffrage.litre.affiche.complet)} CHF/L</span> ›</button>}
      </div>
      <div className="prx-col prx-col-bas">
        {ligneBrassin ? <div className="prx-br" data-booster="bouteilles-brassin"><span><b className="prx-m">{nombreFr(chiffrage!.litres, 1)} L</b> nets</span>
          <svg viewBox="0 0 92 14" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width={Math.max(0, cases)} height="14" rx="3" fill="#111" /><rect x={cases + 1} y="0" width={Math.max(0, 92 - cases - 1)} height="14" rx="3" fill="#2F8A55" />{nbCases > 10 && Array.from({ length: Math.floor((nbCases - 1) / 10) }, (_, i) => <rect key={i} x={((i + 1) * 10 / nbCases) * 92} y="0" width="1" height="14" fill="#fff" />)}</svg>
          <span><b className="prx-m">{ligneBrassin.paient}</b> paient le brassin</span><span className="prx-v"><b className="prx-m">{ligneBrassin.pourToi}</b> pour toi</span></div>
          : chiffrage && chiffrage.litres === null ? <div className="prx-br"><span><b className="prx-m">? L</b> nets</span></div> : null}
        <div className="prx-fo">
          {formats.filter(f => f.format.id !== formatId).map(f => {
            const o = lire(f.format); const Icone = ICONES[f.format.id as FormatId]; const r = o.lecture.reste;
            const v = r ? (an && o.unites !== null ? resteAnnuel(r.valeur, o.unites) : r.valeur) : null;
            return <button key={f.format.id} type="button" className="prx-tuile" data-absent={f.present ? undefined : ''} onClick={() => setFormatId(f.format.id as FormatId)}>
              <Icone size={18} aria-hidden="true" /><p>{majuscule(f.format.label)}<i className="prx-m">{o.prix !== null ? chf(o.prix) : o.tf.kind === 'plusieurs' ? `${o.tf.tarifs.length} prix` : 'prix ?'}</i></p>
              {v !== null && <b className={`prx-m${r!.valeur < 0 ? ' prx-neg' : ''}`}>{r!.borne ? '≤ ' : ''}{chf(v)}</b>}</button>;
          })}
        </div>
        {completer.length > 0 && <div className="prx-completer" role="group" aria-label="Tarifs à compléter">
          <span>À compléter</span>{completer.map(t => <button key={t.product} type="button" onClick={() => ouvrir(t)}>{t.product} · <span className="prx-m">{Number.isFinite(t.priceHT) ? chf(t.priceHT) : '?'}</span> ›</button>)}
        </div>}
        {!lecture.cout?.exact && prix !== null && lecture.cout && <p className="prx-aide">Emballage de l’unité à compléter dans le tarif : le reste est un maximum.</p>}
        <div className="prx-act">
          <button type="button" className="prx-ia" onClick={() => setQuestion(question1())} data-booster="ia-proposer"><Sparkles size={18} aria-hidden="true" />Proposer</button>
          <button type="button" className="prx-pri" onClick={() => ouvrir(cur.tarif ?? undefined)}><Pencil size={18} aria-hidden="true" />{cur.tarif ? 'Changer le prix' : 'Fixer le prix'}</button>
        </div>
      </div>
      <TarifSheet item={feuille} config={config} existingProducts={tarifs.map(t => t.product)} formats={choixFormats}
        apercu={s => { const f = choixFormats.find(c => c.id === s.formatId) ?? choixFormats.find(c => c.id === formatId)!; return lire(f, s.emballage ?? null, s.prix ?? null).lecture as LecturePrix; }}
        onClose={() => setFeuille(null)} onSave={enregistrer} onDelete={supprimer} />
      {coutOuvert && batch && <React.Suspense fallback={null}><BrewBudgetDialog batch={batch} onClose={() => setCoutOuvert(false)} /></React.Suspense>}
      {question !== undefined && <React.Suspense fallback={null}><BrewerChat scope={{ kind: 'app', id: 'clients-tarifs' }} label="Mes prix" phase="Prix de vente" initialOpen hideLauncher initialQuestion={question} onClose={() => setQuestion(undefined)} /></React.Suspense>}
    </div>
  );
}

/** L'écran Prix dans une feuille : porte des marches ④ ⑤ ⑥ de l'onglet Argent. */
export function PrixFeuille({ config, batch, onClose, formatInitial }: { config: AppConfig; batch: Batch; onClose: () => void; formatInitial?: FormatId }) {
  return <Sheet open onClose={onClose} title="Prix" subtitle={batch.name} className="prx-feuille-ecran md:max-w-4xl md:mx-auto"><PrixEcran config={config} batchId={batch.id} formatInitial={formatInitial} /></Sheet>;
}
