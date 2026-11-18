import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, Check, ChevronDown, ChevronLeft, GitMerge, ScanLine, X } from 'lucide-react';
import type { StockItem, Transaction } from '../../types';
import { Sheet } from '../Sheet';
import { montantChf, todayISO } from '../../domain/finance/ledger';
import { vendorKey } from '../../domain/finance/duplicates';
import { usePlusPage } from '../plusPage';
import {
  analyserFournisseurs, apresReunion, RAISONS, reunir, tendance,
  type ArticlePaye, type FicheFournisseur, type TendancePrix
} from '../../domain/fournisseurs';
import { useReglagesFournisseurs } from './useReglagesFournisseurs';
import './fournisseurs.css';

/*
 * Fournisseurs : la liste, puis la fiche « les prix d'abord » (maquette fournisseur/v1, choisie le 16.11, reprise telle quelle).
 * Ordre de la fiche : le nom, les noms à réunir (avec leur preuve), le délai, ce qu'il paie ici (dernier prix, courbe, écart),
 * les factures, les raisons du choix. Le délai reste inconnu : l'app ne note pas la date de commande (jamais 0).
 * Classes préfixées `fo-` (L26) ; jetons de l'app, deux thèmes ; rien sous 14 px.
 */

interface Props {
  transactions: Transaction[];
  stocks: { rawMaterials: StockItem[]; cleaning: StockItem[] };
  /** Revient à la page d'où l'on vient (Plus). */
  onBack: () => void;
  /** Ouvre la saisie d'une facture par photo ou PDF. */
  onScanner: () => void;
}

const chf = (cents: number) => montantChf(cents / 100);
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
/** « kg » se lit « par kg » ; un conditionnement de la ligne de facture (« sac 25 kg ») se lit tel quel. */
const parUnite = (u: string) => (/^[\p{L}µ.]+$/u.test(u) ? `par ${u}` : u);

const Courbe: React.FC<{ points: Array<{ cents: number }>; sens: TendancePrix['sens'] }> = ({ points, sens }) => {
  if (points.length < 2) return <svg width="78" height="34" aria-hidden="true"><circle cx="66" cy="17" r="5" fill="var(--fo-mut)" /></svg>;
  const v = points.map(p => p.cents), mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
  const pts = v.map((y, i) => [6 + i * (60 / (v.length - 1)), 28 - ((y - mn) / r) * 22]);
  const couleur = sens === 'haut' ? 'var(--fo-bad)' : sens === 'bas' ? 'var(--fo-ok)' : 'var(--fo-mut)';
  const fin = pts[pts.length - 1];
  return (
    <svg width="78" height="34" aria-hidden="true">
      <polyline points={pts.map(q => q.join(',')).join(' ')} fill="none" stroke="var(--fo-line2)" strokeWidth="2.5" strokeLinejoin="round" />
      <polyline points={pts.slice(-2).map(q => q.join(',')).join(' ')} fill="none" stroke={couleur} strokeWidth="3" />
      <circle cx={fin[0]} cy={fin[1]} r="5" fill={couleur} />
    </svg>
  );
};

const Ecart: React.FC<{ t: TendancePrix }> = ({ t }) => {
  if (t.sens === 'premier') return <i className="fo-eq">1er prix</i>;
  if (t.sens === 'egal') return <i className="fo-eq">= même</i>;
  return <i className={`fo-num ${t.sens === 'haut' ? 'fo-up' : 'fo-dn'}`}>{t.sens === 'haut' ? '+' : '−'}{chf(t.centimes)} {t.sens === 'haut' ? '↑' : '↓'}</i>;
};

const Article: React.FC<{ a: ArticlePaye; ouvert: boolean; onToggle: () => void; nomGarde: string }> = ({ a, ouvert, onToggle, nomGarde }) => {
  const t = tendance(a.points), dernier = a.points[a.points.length - 1];
  return (
    <>
      <button type="button" className="fo-art" aria-expanded={ouvert} onClick={onToggle}>
        <span className="fo-an"><b>{a.nom}</b><i>{parUnite(a.unite)} · {dernier.date}</i></span>
        <Courbe points={a.points} sens={t.sens} />
        <span className="fo-ap"><b className="fo-num">{chf(dernier.cents)}</b><Ecart t={t} /></span>
      </button>
      {ouvert && (
        <div className="fo-hist">
          {[...a.points].reverse().map((p, i) => (
            <div key={`${p.iso}-${i}`} className="fo-hr"><span>{p.date}{p.nom && p.nom !== nomGarde ? <em>{p.nom}</em> : null}</span><b className="fo-num">{chf(p.cents)}</b></div>
          ))}
          {a.ailleurs.length > 0 && (
            <div className="fo-ail">Ailleurs : {a.ailleurs.map((x, i) => <React.Fragment key={x.fournisseur}>{i > 0 ? ' · ' : ''}{x.fournisseur} : <b className="fo-num">{chf(x.cents)}</b> le {x.date}</React.Fragment>)}</div>
          )}
        </div>
      )}
    </>
  );
};

export const PageFournisseurs: React.FC<Props> = ({ transactions, stocks, onBack, onScanner }) => {
  const [reglages, regler] = useReglagesFournisseurs();
  const articlesStock = useMemo(() => [...stocks.rawMaterials, ...stocks.cleaning], [stocks.rawMaterials, stocks.cleaning]);
  const analyse = useMemo(() => analyserFournisseurs(transactions, articlesStock, reglages), [transactions, articlesStock, reglages]);

  const [cle, setCle] = useState<string | null>(null);
  const [articleOuvert, setArticleOuvert] = useState<string | null>(null);
  const [facturesOuvertes, setFacturesOuvertes] = useState(false);
  const [feuille, setFeuille] = useState(false);
  const [cochees, setCochees] = useState<string[]>([]);
  const [fait, setFait] = useState<{ texte: string; annuler: () => void } | null>(null);
  const [choix, setChoix] = useState<string[]>([]);
  const [modifie, setModifie] = useState(false);
  const [pour, setPour] = useState('');
  const [ecartes, setEcartes] = useState('');
  const [revoir, setRevoir] = useState('');
  const [nouveau, setNouveau] = useState<{ nom: string; pays: string; site: string } | null>(null);
  const refChoix = useRef<HTMLElement>(null);

  const fiche: FicheFournisseur | undefined = cle ? analyse.fiches.get(cle) : undefined;
  // Une fiche qui n'existe plus (nom réuni ailleurs) renvoie à la liste.
  useEffect(() => { if (cle && !fiche) setCle(null); }, [cle, fiche]);

  /* Le retour du téléphone ferme la page entière : elle partage l'entrée d'historique de Plus (App). La flèche, elle, revient de la fiche à la liste. */
  const ouvrir = useCallback((c: string) => {
    setFait(null); setArticleOuvert(null); setFacturesOuvertes(false); setModifie(false);
    setCle(c);
    window.scrollTo?.(0, 0);
  }, []);
  const retour = useCallback(() => {
    setFait(null);
    if (cle) setCle(null); else onBack();
  }, [cle, onBack]);

  const gardees = cle ? reglages.raisons[cle] : undefined;
  useEffect(() => { setChoix(gardees?.raisons ?? []); setPour(gardees?.pour ?? ''); setEcartes(gardees?.ecartes ?? ''); setRevoir(gardees?.revoir ?? ''); }, [cle, gardees]);

  const ouvrirFeuille = () => { if (!fiche) return; setCochees(fiche.candidats.map(c => c.cle)); setFeuille(true); };
  const reunirNoms = () => {
    if (!fiche) return;
    const avant = reglages;
    const reuni = reunir(reglages, fiche.cle, cochees);
    // Un nom décoché reste séparé : il reprend sa ligne dans la liste (« proche de … »), il n'y disparaît pas.
    regler(cochees.length < fiche.candidats.length ? { ...reuni, plusTard: [...new Set([...reuni.plusTard, fiche.cle])] } : reuni);
    setFeuille(false);
    setFait({ texte: `${cochees.length + 1} noms réunis sous ${fiche.nom}`, annuler: () => { regler(avant); setFait(null); } });
  };
  const pasMaintenant = () => { if (fiche) regler({ ...reglages, plusTard: [...new Set([...reglages.plusTard, fiche.cle])] }); setFeuille(false); };
  const garderRaisons = () => {
    if (!fiche) return;
    const avant = reglages;
    const net = (t: string) => t.trim();
    regler({ ...reglages, raisons: { ...reglages.raisons, [fiche.cle]: {
      raisons: choix, le: todayISO(),
      ...(net(pour) ? { pour: net(pour) } : {}), ...(net(ecartes) ? { ecartes: net(ecartes) } : {}), ...(net(revoir) ? { revoir: net(revoir) } : {})
    } } });
    setModifie(false);
    setFait({ texte: 'Choix gardé sur la fiche', annuler: () => { regler(avant); setFait(null); } });
  };

  /* « Commande passée » : le jour de la commande ; « Reçue » : celui de la livraison. L'écart devient le délai, appris sur les vraies commandes. */
  const commander = () => {
    if (!fiche) return;
    const avant = reglages;
    regler({ ...reglages, commandes: { ...reglages.commandes, [fiche.cle]: [...(reglages.commandes[fiche.cle] ?? []), { le: todayISO() }] } });
    setFait({ texte: 'Commande notée : tu notes sa réception ici', annuler: () => { regler(avant); setFait(null); } });
    window.scrollTo?.(0, 0);
  };
  const recevoir = () => {
    if (!fiche?.commandeOuverte) return;
    const avant = reglages, i = fiche.commandeOuverte.index;
    const liste = (reglages.commandes[fiche.cle] ?? []).map((c, k) => (k === i ? { ...c, recue: todayISO() } : c));
    regler({ ...reglages, commandes: { ...reglages.commandes, [fiche.cle]: liste } });
    setFait({ texte: 'Réception notée', annuler: () => { regler(avant); setFait(null); } });
  };
  const noterChoix = () => {
    setModifie(true);
    window.setTimeout(() => refChoix.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 60);
  };
  const ajouterFournisseur = () => {
    if (!nouveau || !nouveau.nom.trim()) return;
    const nom = nouveau.nom.trim(), k = vendorKey(nom);
    if (!k) return;
    const deja = analyse.fiches.has(k) || reglages.ajoutes.some(a => vendorKey(a.nom) === k);
    if (!deja) regler({ ...reglages, ajoutes: [...reglages.ajoutes, { nom, ...(nouveau.pays.trim() ? { pays: nouveau.pays.trim() } : {}), ...(nouveau.site.trim() ? { site: nouveau.site.trim() } : {}) }] });
    setNouveau(null);
    ouvrir(k);
  };
  /* Le + des onglets, ici : les gestes de cette page (maquette : « Nouveau fournisseur » sur la liste ; sur la fiche « Sur Brouwland »). */
  usePlusPage({
    titre: fiche ? fiche.nom : 'Fournisseurs',
    surOnglets: true,
    actions: fiche
      ? [
        { id: 'pourquoi', label: 'Pourquoi lui', hint: 'tes raisons', genre: 'modifier', lancer: noterChoix },
        { id: 'commande', label: 'Commande passée', genre: 'ajouter', lancer: commander },
        { id: 'facture', label: `Facture de ${fiche.nom}`, genre: 'ajouter', lancer: onScanner }
      ]
      : [{ id: 'nouveau', label: 'Nouveau fournisseur', hint: 'nom, pays, site', genre: 'ajouter', lancer: () => setNouveau({ nom: '', pays: '', site: '' }) }]
  });
  const feuilleNouveau = (
    <Sheet
      open={nouveau !== null}
      onClose={() => setNouveau(null)}
      title="Nouveau fournisseur"
      subtitle="Il arrive avec ses factures ; ici tu le poses d'avance."
      footer={<div className="fo fo-pied"><div className="fo-act">
        <button type="button" className="fo-btn fo-bsec" onClick={() => setNouveau(null)}>Annuler</button>
        <button type="button" className="fo-btn fo-pri" disabled={!nouveau?.nom.trim()} onClick={ajouterFournisseur}>Ajouter</button>
      </div></div>}
    >
      <div className="fo fo-feuille">
        {(['nom', 'pays', 'site'] as const).map(champ => (
          <label key={champ} className="fo-champ"><span>{champ === 'nom' ? 'Nom' : champ === 'pays' ? 'Pays (facultatif)' : 'Site web (facultatif)'}</span>
            <input value={nouveau?.[champ] ?? ''} autoComplete="off" onChange={e => setNouveau(n => (n ? { ...n, [champ]: e.target.value } : n))} />
          </label>
        ))}
      </div>
    </Sheet>
  );

  /* ---------- la liste ---------- */
  if (!fiche) {
    return (
      <section className="fo" aria-label="Fournisseurs">
        <header className="fo-top"><button type="button" className="fo-back" onClick={retour}><ChevronLeft aria-hidden="true" />Plus</button></header>
        <h1 className="fo-lh">Fournisseurs</h1>
        {analyse.liste.length === 0 ? (
          <p className="fo-vide fo-m">Aucun fournisseur encore. Ils arrivent seuls avec la première facture ou le premier article du stock.<button type="button" className="fo-btn fo-pri" onClick={onScanner}><ScanLine aria-hidden="true" />Scanner une facture</button></p>
        ) : analyse.liste.map(l => (
          <button key={l.cle} type="button" className="fo-fo" data-fournisseur={l.cle} onClick={() => ouvrir(l.cle)}>
            <span className="fo-t"><b>{l.nom}</b><i>{l.sansFacture ? 'aucune facture encore' : pluriel(l.factures, 'facture')}{l.procheDe ? ` · proche de ${l.procheDe}` : l.noms > 1 ? ` · ${l.noms} noms` : ''}</i></span>
            {l.delaiJours !== null && <span className="fo-d fo-num" title="Délai de la commande à chez toi, appris de tes commandes reçues">{l.delaiJours} j</span>}
          </button>
        ))}
        {fait && <div className="fo-okb" role="status"><span>{fait.texte}</span></div>}
        {feuilleNouveau}
      </section>
    );
  }

  /* ---------- la fiche ---------- */
  const tard = reglages.plusTard.includes(fiche.cle);
  const nbCandidats = fiche.candidats.length;
  const nbFacturesCandidats = fiche.candidats.reduce((s, c) => s + c.factures, 0);
  const apres = apresReunion(fiche, cochees);
  const enEdition = !gardees || modifie;
  const nbRaisons = choix.length;
  const prix = fiche.articles;

  return (
    <section className="fo" aria-label={`Fournisseur ${fiche.nom}`}>
      <header className="fo-top"><button type="button" className="fo-back" onClick={retour}><ChevronLeft aria-hidden="true" />Fournisseurs</button></header>
      <section className="fo-id">
        <h1>{fiche.nom}</h1>
        <p>{fiche.sansFacture ? (fiche.infos.pays || fiche.infos.site ? 'ajouté à la main' : 'ajouté depuis le stock') : `${pluriel(fiche.factures.length, 'facture')}${fiche.familles.length ? ` · ${fiche.familles.join(', ')}` : ''}`}{[fiche.infos.pays, fiche.infos.site].filter(Boolean).map(x => ` · ${x}`).join('')}</p>
        {fiche.aussiEcrit.length > 0 && <p className="fo-aussi"><Check aria-hidden="true" /><span>aussi écrit {fiche.aussiEcrit.join(', ')}</span></p>}
      </section>

      {nbCandidats > 0 && !tard && (
        <button type="button" className="fo-fus" data-fusion onClick={ouvrirFeuille}>
          <span className="fo-fust"><GitMerge aria-hidden="true" />Écrit de {nbCandidats + 1} façons</span>
          <span className="fo-fusd">{pluriel(nbFacturesCandidats, 'facture')} et leurs prix manquent ici.</span>
          <span className="fo-fusn">{fiche.candidats.map(c => <i key={c.cle}>{c.nom} · {c.factures}</i>)}</span>
          <span className="fo-fusb">Voir et réunir</span>
        </button>
      )}
      {nbCandidats > 0 && tard && (
        <button type="button" className="fo-tard" data-fusion onClick={ouvrirFeuille}><GitMerge aria-hidden="true" />{pluriel(nbCandidats, 'autre')} nom{nbCandidats > 1 ? 's' : ''} à réunir · plus tard</button>
      )}

      {fait && (
        <div className="fo-okb" role="status">
          <Check aria-hidden="true" /><span>{fait.texte}</span>
          <button type="button" onClick={fait.annuler}>Annuler</button>
          <button type="button" aria-label="Fermer le message" onClick={() => setFait(null)}><X aria-hidden="true" /></button>
        </div>
      )}

      {fiche.delaiJours !== null && (
        <section className="fo-sec">
          <div className="fo-delh"><b className="fo-num">{fiche.delaiJours} j</b><span>de la commande à chez toi</span></div>
          <div className="fo-trk"><div className="fo-ax" /><div className="fo-med" style={{ left: `${(Math.min(fiche.delaiJours, 12) / 12) * 100}%` }} />{[0, 3, 6, 9, 12].map(t => <span key={t} className="fo-tk" style={{ left: `${(t / 12) * 100}%` }}>{t}{t === 12 ? ' j' : ''}</span>)}</div>
          <p className="fo-dcap">d’après {pluriel(fiche.delaiSur, 'commande')} reçue{fiche.delaiSur > 1 ? 's' : ''}</p>
        </section>
      )}
      {fiche.commandeOuverte && (
        <div className="fo-cmd"><span>Commande du <b>{fiche.commandeOuverte.date}</b> · pas encore reçue</span><button type="button" className="fo-btn fo-bsec" onClick={recevoir}>Reçue aujourd’hui</button></div>
      )}
      {fiche.delaiJours === null && !fiche.commandeOuverte && (
        <p className="fo-delinc">Délai de livraison : <b>inconnu</b> · il s’apprend avec « Commande passée », dans le +.</p>
      )}

      <section className="fo-sec">
        <h2 className="fo-h2">Ce que tu paies ici<span>CHF, dernier prix</span></h2>
        {fiche.sansFacture
          ? <div className="fo-vide">Rien encore. Les articles et leurs prix arrivent seuls avec la première facture.<button type="button" className="fo-btn fo-pri" onClick={onScanner}><ScanLine aria-hidden="true" />Scanner une facture</button></div>
          : prix.length === 0
            ? <div className="fo-vide">Aucun prix d’article lu sur ses factures.</div>
            : prix.map(a => <Article key={a.cle} a={a} nomGarde={fiche.nom} ouvert={articleOuvert === a.cle} onToggle={() => setArticleOuvert(articleOuvert === a.cle ? null : a.cle)} />)}
        {fiche.articlesCaches > 0 && <div className="fo-plus">+ {pluriel(fiche.articlesCaches, 'article')}, acheté{fiche.articlesCaches > 1 ? 's' : ''} sous un autre nom</div>}
      </section>

      <section className="fo-sec">
        {fiche.sansFacture
          ? <div className="fo-row">Factures<span>aucune</span></div>
          : <>
              <button type="button" className="fo-row" aria-expanded={facturesOuvertes} onClick={() => setFacturesOuvertes(o => !o)}>
                Factures<span className="fo-num">{fiche.factures.length} · {chf(fiche.totalCents)} CHF <ChevronDown aria-hidden="true" /></span>
              </button>
              {facturesOuvertes && <>
                {fiche.factures.slice(0, 6).map(f => <div key={f.id} className="fo-hr"><span>{f.date}{f.nom !== fiche.nom ? <em>{f.nom}</em> : null}</span><b className="fo-num">{chf(f.cents)}</b></div>)}
                {fiche.factures.length > 6 && <div className="fo-hr"><span>et {fiche.factures.length - 6} plus anciennes</span></div>}
              </>}
              <button type="button" className="fo-lien" onClick={onScanner}><ScanLine aria-hidden="true" />Scanner une facture</button>
            </>}
      </section>

      <section className="fo-sec" ref={refChoix}>
        <h2 className="fo-h2">{enEdition ? 'Pourquoi ce fournisseur ?' : 'Tes choix ici'}<span>{enEdition ? 'touche tes raisons' : ''}</span></h2>
        {enEdition ? (
          <>
            <div className="fo-chips" role="group" aria-label="Tes raisons">
              {RAISONS.map(r => <button key={r} type="button" aria-pressed={choix.includes(r)} onClick={() => setChoix(c => c.includes(r) ? c.filter(x => x !== r) : [...c, r])}>{r}</button>)}
            </div>
            <label className="fo-champ"><span>Pour quoi ? (facultatif)</span><input value={pour} placeholder="ex. malts de base" onChange={e => setPour(e.target.value)} /></label>
            <label className="fo-champ"><span>Écartés (facultatif)</span><input value={ecartes} placeholder="ex. Malzmühle Schmitt" onChange={e => setEcartes(e.target.value)} /></label>
            <label className="fo-champ"><span>À revoir si… (facultatif)</span><input value={revoir} placeholder="ex. le port dépasse 60 CHF" onChange={e => setRevoir(e.target.value)} /></label>
            <button type="button" className="fo-btn fo-bsec" disabled={nbRaisons === 0 && !pour.trim() && !ecartes.trim() && !revoir.trim()} onClick={garderRaisons}>Garder {nbRaisons ? pluriel(nbRaisons, 'raison') : 'ces raisons'}</button>
          </>
        ) : (
          <div className="fo-ch">
            <div className="fo-cht"><b>{gardees?.pour ?? 'Tes raisons'}</b><span>{gardees ? new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${gardees.le}T12:00:00`)) : ''}</span></div>
            <div className="fo-chips">{gardees!.raisons.map(r => <i key={r}>{r}</i>)}</div>
            {gardees?.ecartes && <p>écartés : {gardees.ecartes}</p>}
            {gardees?.revoir && <p className="fo-rev"><BellRing aria-hidden="true" />à revoir si {gardees.revoir}</p>}
            <button type="button" className="fo-lien" onClick={() => setModifie(true)}>Modifier</button>
          </div>
        )}
      </section>

      <Sheet
        open={feuille}
        onClose={() => setFeuille(false)}
        bare
        title="Un seul fournisseur ?"
        subtitle={`Ces noms semblent être ${fiche.nom}. Décoche ceux qui n’en sont pas.`}
        footer={
          <div className="fo fo-pied"><div className="fo-act">
            <button type="button" className="fo-btn fo-bsec" onClick={pasMaintenant}>Pas maintenant</button>
            <button type="button" className="fo-btn fo-pri" disabled={cochees.length === 0} onClick={reunirNoms}>Réunir {cochees.length + 1} noms</button>
          </div></div>
        }
      >
        <div className="fo fo-feuille">
          <div className="fo-fh"><h2>Un seul fournisseur ?</h2><button type="button" aria-label="Fermer" onClick={() => setFeuille(false)}><X aria-hidden="true" /></button></div>
          <p className="fo-fsub">Ces noms semblent être {fiche.nom}. Décoche ceux qui n’en sont pas.</p>
          <div className="fo-nm fo-garde" aria-label={`${fiche.nom}, nom gardé`}>
            <span className="fo-box"><Check aria-hidden="true" /></span>
            <span><b>{fiche.nom}</b><i className="fo-num">{pluriel(fiche.factures.length, 'facture')} · {chf(fiche.totalCents)} CHF</i><em>nom gardé</em></span>
          </div>
          {fiche.candidats.map(c => {
            const on = cochees.includes(c.cle);
            return (
              <button key={c.cle} type="button" className="fo-nm" aria-pressed={on} onClick={() => setCochees(s => on ? s.filter(x => x !== c.cle) : [...s, c.cle])}>
                <span className="fo-box">{on && <Check aria-hidden="true" />}</span>
                <span><b>{c.nom}</b><i className="fo-num">{pluriel(c.factures, 'facture')} · {chf(c.cents)} CHF</i><em>{c.preuve}</em></span>
              </button>
            );
          })}
          <div className="fo-ap2">Après<b className="fo-num">1 fiche · {pluriel(apres.factures, 'facture')} · {chf(apres.cents)} CHF</b>et les derniers prix de chaque article</div>
          <p className="fo-note">Les factures gardent leur nom d’origine. Tu pourras annuler.</p>
        </div>
      </Sheet>
      {feuilleNouveau}
    </section>
  );
};
