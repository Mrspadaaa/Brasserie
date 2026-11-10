import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { AppConfig, Batch } from '../../types';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { useStorageValue } from '../../hooks/useLiveData';
import { estimerBrassinsPlanifies } from '../../domain/finance/brewForecast';
import { todayISO } from '../../domain/finance/ledger';
import { nombreFr } from '../../domain/nombreAffiche';
import { ImpotBiereSheet, classesBareme, positionRegle } from '../production/ImpotBiereSheet';
import { montantChf } from '../../domain/finance/ledger';
import { PrixFeuille } from './PrixEcran';
import { brassinEnUnites, lirePrix, resteAnnuel, seuilsRegle, tarifsDuFormat, unitesParAn, type FormatId } from './calculPrix';
import { biereDuBrassin, brassinDuCout, formatsDe, impotUnite, lireDonneesPrix } from './donneesPrix';
import './prix.css';

const BrewBudgetDialog = React.lazy(() => import('../finance/BrewBudgetDialog').then(m => ({ default: m.BrewBudgetDialog })));
const chf = (n: number) => montantChf(n);

/**
 * L'onglet Argent d'un brassin (e3a) : six marches, du litre au brassin. Chaque marche porte l'image de l'écran choisi et l'ouvre en entier
 * (① c3a, ② p2b, ④ ⑤ ⑥ le Prix). Les nombres viennent du domaine (`chaineLitre`, `baseImpot`, `calculPrix`) ; la maquette ne donne que la forme.
 * Brassin planifié : le coût manque en partie, les marches disent « ≥ », « ≤ » et « ? », jamais 0.
 */
function EncartPrevisions({ batch }: { batch: Batch }) {
  const d = useStorageValue(lireDonneesPrix);
  const texte = useMemo(() => {
    const asOf = todayISO();
    const stocks = StorageService.getStocks();
    const sortie = estimerBrassinsPlanifies({ batches: d.batches, stockItems: [...(stocks?.rawMaterials ?? []), ...(stocks?.cleaning ?? [])], transactions: d.transactions as never, plans: d.plans, profile: d.profile, assets: FinanceService.snapshot().assets, asOf, fin: `${Number(asOf.slice(0, 4)) + 1}${asOf.slice(4)}` });
    const b = sortie.brassins.find(x => x.batchId === batch.id);
    if (!b) return null;
    const sorties = b.items.filter(i => i.direction === 'out');
    if (!sorties.length) return null;
    // Une sortie « partielle » (`partial` : ce qui manque) vaut au moins son montant ; à 0 elle est INCONNUE, jamais « 0,00 » (e3a : « ce qui manque dit ? et compte à part »).
    const somme = (l: typeof sorties) => ({ cents: l.reduce((s, i) => s + i.amountCents, 0), partiel: l.some(i => i.partial?.length) });
    const lAvant = sorties.filter(i => i.date <= b.dateBrassage), avant = lAvant.length ? somme(lAvant) : null;
    const parMois = new Map<string, typeof sorties>();
    for (const i of sorties.filter(x => x.date > b.dateBrassage)) parMois.set(i.date.slice(0, 7), [...(parMois.get(i.date.slice(0, 7)) ?? []), i]);
    return { avant, date: b.dateBrassage, apres: [...parMois.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([mois, l]) => ({ mois: MOIS_ABR[Number(mois.slice(5, 7)) - 1], ...somme(l) })) };
  }, [d, batch.id]);
  if (!texte) return null;
  const valeur = (s: { cents: number; partiel: boolean }) => s.cents <= 0 && s.partiel ? '?' : `${s.partiel ? '≥ ' : ''}${montantChf(s.cents / 100)}`;
  return <div className="arg-prev" data-booster="reflet-previsions"><CheckCircle2 size={16} aria-hidden="true" /><span>Dans Prévisions :{texte.avant && <> <b className="prx-m">{valeur(texte.avant)}</b> avant le {Number(texte.date.slice(8, 10))} {MOIS_ABR[Number(texte.date.slice(5, 7)) - 1]}</>}{texte.apres.map((a, k) => <React.Fragment key={a.mois}>{texte.avant || k > 0 ? ' · ' : ' '}<b className="prx-m">{valeur(a)}</b> en {a.mois}</React.Fragment>)}</span></div>;
}
const MOIS_ABR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const BrewerChat = React.lazy(() => import('../BrewerChat').then(m => ({ default: m.BrewerChat })));

/** `proposer` : un compteur que la fiche monte quand le brasseur touche « ✦ Proposer » (e3a : l'action primaire de l'onglet) ; l'IA ne s'ouvre qu'à ce toucher. */
export function ChaineArgent({ batch, config, onNoteDensity, proposer }: { batch: Batch; config: AppConfig; onNoteDensity?: () => void; proposer?: number }) {
  const d = useStorageValue(lireDonneesPrix);
  const [question, setQuestion] = useState<string | undefined>();
  const demande = React.useRef<() => string>(() => '');
  const [ouvert, setOuvert] = useState<null | 'cout' | 'impot' | 'prix'>(null);
  const [formatId, setFormatId] = useState<FormatId>('33cl');
  const [an, setAn] = useState<boolean>(() => StorageService.getUiState<string>('prix_lecture', 'bouteille') === 'an');
  const planifie = batch.status === 'planifie';
  const c = useMemo(() => brassinDuCout([batch], d.plans, d.fiscal, undefined, batch.id), [batch, d.plans, d.fiscal])!;
  const formats = formatsDe(batch, d.kegs);
  const f = (formats.find(x => x.format.id === formatId) ?? formats[0]).format;
  const tf = tarifsDuFormat(d.tarifs, f.id as FormatId, biereDuBrassin(batch));
  const tarif = tf.kind === 'un' || tf.kind === 'sans-prix' ? tf.tarif : null;
  const prix = tf.kind === 'un' ? tf.tarif.priceHT : null;
  const lecture = lirePrix({ litreLiquide: c.litre?.liquide ?? null, volumeL: f.volumeL, emballageUnite: tarif?.emballageUnite ?? null, impotUnite: impotUnite(c, f.volumeL), prixHT: prix });
  const litresAn = typeof d.profile?.annualProductionL === 'number' && d.profile.annualProductionL > 0 ? d.profile.annualProductionL : undefined;
  const unites = unitesParAn(litresAn, f.volumeL);
  const reste = lecture.reste;
  const resteAn = reste && unites !== null ? resteAnnuel(reste.valeur, unites) : null;
  const n = c.notions;
  const borne = planifie || !c.litre ? '≥ ' : '';
  const lien = c.litre ? c.litre.affiche.complet : n && c.litres ? Math.round(n.total / c.litres * 100) / 100 : null;
  const ligne = c.litre ? brassinEnUnites({ coutBrassin: n?.total ?? null, prixHT: prix, litresNets: c.litres, volumeL: f.volumeL }) : null;
  const bareme = classesBareme();
  const pos = positionRegle(c.plato);
  const unitImpot = impotUnite(c, f.volumeL);
  const seuils = lecture.cout ? seuilsRegle(lecture.cout.affiche) : null;
  const xMax = seuils ? Math.max(prix ?? 0, seuils.mince) * 1.4 : 1;
  const part = lecture.cout && c.litre?.liquide != null ? { biere: c.litre.liquide * f.volumeL, emb: tarif?.emballageUnite ?? 0, imp: unitImpot ?? 0 } : null;
  demande.current = () => {
    const nomFormat = f.label;
    const lignes = [`Mon brassin « ${batch.name} »${planifie ? ' (planifié)' : ''} : ${c.litre ? `coût du litre ${chf(c.litre.affiche.complet)} CHF` : 'coût du litre encore inconnu'}${c.litres !== null ? `, ${nombreFr(c.litres, 1)} L nets` : ', litres nets à noter'}.`,
      `Format ${nomFormat} : ${prix !== null ? `vendu ${chf(prix)} CHF HT` : 'pas encore de prix'}${lecture.cout ? `, coût ${lecture.cout.exact ? '' : 'd’au moins '}${chf(lecture.cout.affiche)} CHF` : ''}.`,
      reste ? `Il me reste ${reste.borne ? 'au plus ' : ''}${chf(reste.valeur)} CHF par ${nomFormat} (${nombreFr(lecture.partPrix, 0)} % du prix).` : '',
      'Quel prix me conseilles-tu, et pourquoi ?'];
    return lignes.filter(Boolean).join(' ');
  };
  const dernier = React.useRef(proposer ?? 0);
  React.useEffect(() => { if (proposer !== undefined && proposer !== dernier.current) { dernier.current = proposer; setQuestion(demande.current()); } }, [proposer]);
  const basculer = () => { const v = !an; setAn(v); StorageService.setUiState('prix_lecture', v ? 'an' : 'bouteille'); };

  const marche = (num: number, corps: React.ReactNode, opts: { ouvre?: typeof ouvert; reste?: boolean; label: string }) => <>
    <div className="arg-ax"><i>{num}</i></div>
    {opts.ouvre ? <button type="button" className="arg-st" data-reste={opts.reste ? '' : undefined} aria-label={opts.label} onClick={() => setOuvert(opts.ouvre!)}>{corps}</button>
      : <div className="arg-st" data-reste={opts.reste ? '' : undefined} role="group" aria-label={opts.label}>{corps}</div>}
  </>;

  return (
    <div className="arg" aria-label="Argent du brassin">
      {planifie && <EncartPrevisions batch={batch} />}
      <div className="arg-ch" data-booster="chaine-verticale">
        {marche(1, <>
          <div className="arg-l1"><span>Litre{planifie || !c.litre ? <> · <span className="arg-q">{c.litre ? 'estimé' : 'prix ou litres ?'}</span></> : null}</span><b className="prx-m">{lien === null ? '?' : `${borne}${chf(lien)}`} <small>CHF/L</small></b></div>
          {n && <div className="arg-barre" data-booster="litre-trois-notions"><i style={{ flex: Math.max(n.dejaPaye, 0.001), background: '#5B8C3A' }} /><i style={{ flex: Math.max(n.aPayer, 0.001), background: '#111' }} /><i style={{ flex: Math.max(n.annee, 0.001), background: '#8E5BC9' }} /></div>}
          {n && c.litres ? <div className="arg-l2"><span>payé <b className="prx-m">{chf(n.dejaPaye / c.litres)}</b> · à payer <b className="prx-m">{chf(n.aPayer / c.litres)}</b> · année <b className="prx-m">{chf(n.annee / c.litres)}</b></span></div> : <div className="arg-l2"><span>payé <b className="prx-m">?</b> · à payer <b className="prx-m">?</b> · année <b className="prx-m">?</b></span></div>}
          {!n && <div className="arg-barre arg-hach" data-inconnu="" data-booster="litre-trois-notions" aria-hidden="true" />}
        </>, { ouvre: 'cout', label: 'Coût du litre', })}
        {marche(2, <>
          <div className="arg-l1"><span>Impôt, <span className="prx-m">{c.plato !== null ? `${nombreFr(c.plato, 1)} °P` : '? °P'}</span>{c.base.densite !== 'notee' ? ' ex.' : ''}</span><b className="prx-m">{unitImpot !== null ? chf(unitImpot) : '?'} <small>/ {f.label}</small></b></div>
          <div className="arg-regle" data-booster="regle-impot"><span style={{ flex: 10, background: '#F3E2B4', color: '#4A3B0C' }}>{nombreFr(bareme[0].chfParHl, 2)}</span><span style={{ flex: 4, background: '#E0B86C', color: '#3E2B04' }}>{nombreFr(bareme[1].chfParHl, 2)}</span><span style={{ flex: 6, background: '#C98A3A', color: '#2A1606' }}>{nombreFr(bareme[2].chfParHl, 2)}</span>{pos !== null && <i className="arg-curs" style={{ left: `${pos}%` }} />}</div>
          <div className="arg-l2"><span>le brassin <b className="prx-m">{c.plato !== null && c.litres ? chf(c.base.calcul(c.plato, c.litres).montant ?? 0) : '?'}</b>{planifie ? ' · sortie de cave' : ''}</span></div>
        </>, { ouvre: 'impot', label: 'Impôt sur la bière' })}
        {marche(3, <>
          <div className="arg-l1"><span className="prx-seg" role="group" aria-label="Format" data-booster="format" style={{ gap: 4 }}>{formats.map(x => <button key={x.format.id} type="button" aria-pressed={x.format.id === f.id} style={{ minHeight: 28, padding: '0 8px', fontSize: 12 }} onClick={() => setFormatId(x.format.id as FormatId)}>{x.format.label}</button>)}</span>
            <b className="prx-m">{lecture.cout ? `${lecture.cout.exact && !planifie ? '' : '≥ '}${chf(lecture.cout.affiche)}` : '?'} <small>coûte</small></b></div>
          {part && <div className="arg-barre"><i style={{ flex: part.biere, background: '#9E5518' }} />{part.emb > 0 && <i style={{ flex: part.emb, background: '#9AA3AD' }} />}<i style={{ flex: Math.max(part.imp, 0.01), minWidth: 3, background: '#C98A3A' }} /></div>}
          {part ? <div className="arg-l2"><span>bière <b className="prx-m">{chf(part.biere)}</b>{part.emb > 0 ? <> · emballage <b className="prx-m">{chf(part.emb)}</b></> : <> · emballage <span className="arg-q">à compléter</span></>} · impôt <b className="prx-m">{chf(part.imp)}</b></span></div> : <><div className="arg-barre arg-hach" data-inconnu="" aria-hidden="true" /><div className="arg-l2"><span>bière <b className="prx-m">?</b> · emballage <span className="arg-q">à compléter</span> · impôt <b className="prx-m">{unitImpot !== null ? chf(unitImpot) : '?'}</b></span></div></>}
        </>, { label: 'Coût du format' })}
        {marche(4, <>
          <div className="arg-l1"><span>Vendue{prix === null ? '' : ''}</span><b className="prx-m">{prix === null ? 'prix ?' : chf(prix)} <small>CHF</small></b></div>
          {!seuils && <div className="arg-regle arg-hach" data-inconnu="" data-booster="regle-prix" aria-hidden="true"><span style={{ flex: '0 0 auto', margin: 'auto', padding: '0 8px', borderRadius: 8, background: 'rgb(var(--cave-850))', color: '#6A6A6A' }}>à perte · mince · il te reste</span></div>}
          {seuils && <div className="arg-regle" data-booster="regle-prix"><span style={{ flex: seuils.perte, background: '#F8DCDA', color: '#8E2A24' }}>à perte</span><span style={{ flex: Math.max(seuils.mince - seuils.perte, 0.01), background: '#F8EBCD', color: '#6B4C0C' }}>mince</span><span style={{ flex: Math.max(xMax - seuils.mince, 0.01), background: '#E3F2E8', color: '#256B42' }}>il te reste</span>{prix !== null && <i className="arg-curs" style={{ left: `${Math.min(100, prix / xMax * 100)}%` }} />}</div>}
        </>, { ouvre: 'prix', label: 'Prix de vente' })}
        {marche(5, <>
          <div className="arg-l1"><span>Il te reste</span><b className="prx-m" style={{ color: 'rgb(var(--ok-texte, 37 107 66))' }}>{reste ? `${reste.borne || planifie ? '≤ ' : ''}${chf(reste.valeur)}` : '?'} <small>/ {f.label}</small></b></div>
          <div className="arg-l2"><button type="button" className="prx-swap" aria-pressed={an} onClick={e => { e.stopPropagation(); basculer(); }} data-booster="bascule-tete">{an ? `an · ${resteAn !== null ? `${reste?.borne ? '≤ ' : ''}${chf(resteAn)}` : 'volume annuel ?'}` : 'bouteille'}</button><b className="prx-m">{reste && lecture.partPrix !== null ? `${nombreFr(lecture.partPrix, 0)} %` : ''}</b></div>
        </>, { reste: true, label: 'Il te reste' })}
        {marche(6, <>
          <div className="arg-l1"><span>Brassin, {c.litres !== null ? `${nombreFr(c.litres, 0)} L${planifie ? ' prévus' : ''}` : <>? L nets{batch.volumeL > 0 ? <small className="arg-q"> · {nombreFr(batch.volumeL, 0)} L visés</small> : null}</>}</span><b className="prx-m" style={{ color: 'rgb(var(--ok-texte, 37 107 66))' }}>{ligne ? `${planifie ? '≤ ' : ''}${chf(ligne.resteBrassin)}` : '?'} <small>CHF</small></b></div>
          {ligne && <svg viewBox="0 0 320 12" preserveAspectRatio="none" style={{ width: '100%', height: 12, display: 'block' }} aria-hidden="true">{Array.from({ length: Math.min(ligne.n, 200) }, (_, i) => <rect key={i} x={i * 320 / Math.min(ligne.n, 200)} y="0" width={320 / Math.min(ligne.n, 200) - 1} height="12" rx="1" fill={i < (ligne.paient / ligne.n) * Math.min(ligne.n, 200) ? '#111' : '#7DC79A'} />)}</svg>}
          {!ligne && <div className="arg-barre arg-hach" data-inconnu="" aria-hidden="true" style={{ height: 12 }} />}
          <div className="arg-l2"><span>{ligne ? <><b className="prx-m">{ligne.paient}</b> paient {n ? <b className="prx-m">{chf(n.total)}</b> : null}</> : <><b className="prx-m">?</b> paient <b className="prx-m">?</b></>}</span>{ligne ? <span>vendu <b className="prx-m">{chf(ligne.vendu)}</b></span> : <span>vendu <b className="prx-m">?</b></span>}</div>
        </>, { ouvre: 'prix', reste: true, label: 'Brassin' })}
      </div>
      {ouvert === 'cout' && <React.Suspense fallback={null}><BrewBudgetDialog batch={batch} onClose={() => setOuvert(null)} onNoteDensity={onNoteDensity} /></React.Suspense>}
      {ouvert === 'impot' && <ImpotBiereSheet batch={batch} onClose={() => setOuvert(null)} onNoteDensity={onNoteDensity ? () => { setOuvert(null); onNoteDensity(); } : undefined} />}
      {question !== undefined && <React.Suspense fallback={null}><BrewerChat scope={{ kind: 'batch', id: batch.id }} label={batch.name} phase="Prix de vente" initialOpen hideLauncher initialQuestion={question} onClose={() => setQuestion(undefined)} /></React.Suspense>}
      {ouvert === 'prix' && <PrixFeuille config={config} batch={batch} formatInitial={formatId} onClose={() => setOuvert(null)} />}
    </div>
  );
}
