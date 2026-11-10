import React from 'react';
import { nombreFr } from '../../../domain/nombreAffiche';
import { Beer, Car, Check, Copy, Download, House, Loader2, Lock, Plus, Smartphone, Zap, type LucideIcon } from 'lucide-react';
import { Cadre, Etoile } from './Etapes';
import { baseProposee, justificatifs, materielPret, ticketFortune, ticketRevenu, TUILES_PRIVEES } from './calculs';
import { TAX_REVIEWS } from '../../../domain/finance/fribourgTax';
import { montant } from '../previsions/format';
import { DriveConnection } from '../DriveConnection';
import { MoneyInput, idFor } from '../FinanceForms';
import type { Ctx } from './ctx';

/* ---------- 6 · Parts privées ---------- */
const ICONES_TUILES: Record<string, LucideIcon> = { biere: Beer, electricite: Zap, local: House, telephone: Smartphone, vehicule: Car };
export function Etape6({ c }: { c: Ctx }) {
  // Au repos, g6-6 pose déjà la première charge reconnue (l'électricité) avec son curseur : la part n'est pas connue, le curseur le dit (pouce en pointillé).
  const [tuile, setTuile] = React.useState<string | null>(() => TUILES_PRIVEES.find(t => baseProposee(c.transactions, c.year, t.mots))?.id ?? null);
  const [pct, setPct] = React.useState<number | null>(null), [saisie, setSaisie] = React.useState<number | undefined>();
  const privees = c.tax.corrections.filter(x => x.kind === 'private-use');
  const courante = TUILES_PRIVEES.find(t => t.id === tuile), base = courante ? baseProposee(c.transactions, c.year, courante.mots) : null;
  const montantPart = base ? (pct === null ? undefined : Math.round(base.cents * pct / 100)) : saisie;
  const ajouter = () => {
    if (!courante || montantPart == null || montantPart <= 0) return;
    c.act.ecrire(t => { t.corrections = [...t.corrections, { id: idFor('FISC'), kind: 'private-use', label: courante.libelle, amountCents: montantPart, treatment: 'add', note: base ? `Part privée estimée par le brasseur : ${nombreFr(pct, 0)} % de ${montant(base.cents)} (${base.pieces.join(', ')}).` : 'Montant estimé par le brasseur.' }]; });
    setTuile(null); setSaisie(undefined); setPct(null);
  };
  return <Cadre n={6} c={c} question="Qu’as-tu pris pour toi ?" terme="parts privées"
    bas={<button type="button" className="ann-pri" disabled={c.gele} onClick={() => { c.act.ecrire(t => { t.reviews = { ...t.reviews, privateUse: true }; }); c.act.aller(7); }}>Valider</button>}>
    <div className="ann-tiles">{TUILES_PRIVEES.map(t => { const x = privees.find(p => p.label === t.libelle), Icone = ICONES_TUILES[t.id]; return <button type="button" key={t.id} aria-pressed={tuile === t.id} disabled={c.gele} className={`ann-ti${x ? ' fait' : ' ann-hach'}`} onClick={() => { setTuile(t.id); setPct(null); setSaisie(undefined); }}><Icone size={20} aria-hidden="true" className={`ann-ti-i ${t.id}`}/><b>{t.libelle}</b><span className="ann-m">{x ? montant(x.amountCents) : `? ${t.id === 'biere' ? 'L' : '%'}`}</span></button>; })}
      <button type="button" className="ann-ti dash" disabled={c.gele} onClick={() => c.act.feuille('corrections')}><Plus size={20} aria-hidden="true" className="ann-ti-i plus"/><b>Autre</b><small>ajouter</small></button></div>
    {courante && <div className="ann-sl"><div className="lab"><span>{courante.libelle}{base && <> <span className="ann-m">{montant(base.cents)}</span> : part pour toi</>}</span><span className="ann-pa at">à confirmer</span></div>
      {base ? <><input type="range" min={0} max={100} step={5} value={pct ?? 0} data-inconnu={pct === null ? '' : undefined} aria-label={`Part privée de ${courante.libelle} en pourcentage${pct === null ? ' (pas encore fixée)' : ''}`} onChange={e => setPct(Number(e.target.value))}/><div className="ends"><span className="ann-m">0 %</span>{pct !== null && <span className="ann-m">{nombreFr(pct, 0)} % = {montant(montantPart ?? 0)}</span>}<span className="ann-m">100 %</span></div><p className="ann-terme">d’après : {base.pieces.join(', ')} (à vérifier)</p></>
        : <><MoneyInput label={`Montant à toi, estimé (CHF)`} value={saisie} onChange={setSaisie}/><p className="ann-terme">Aucune charge reconnue : tu saisis le montant, sans valeur par défaut.</p></>}
      {montantPart != null && <button type="button" className="ann-btn" onClick={ajouter} disabled={montantPart <= 0}>Ajouter cette part</button>}</div>}
    <div className="ann-choix"><button type="button" className="ann-ch" disabled={c.gele} onClick={() => { c.act.ecrire(t => { t.reviews = { ...t.reviews, privateUse: true }; }); c.act.aller(7); }}><b>Rien pris pour moi</b><span>tout reste pro</span></button><button type="button" className="ann-ch" onClick={() => setTuile(TUILES_PRIVEES[1].id)}><b>J’ai pris quelque chose</b><span>toucher une tuile</span></button></div>
  </Cadre>;
}

/* ---------- 7 · Vérifications ---------- */
export function Etape7({ c }: { c: Ctx }) {
  const n = TAX_REVIEWS.filter(r => c.tax.reviews[r.key]).length, circ = 2 * Math.PI * 26;
  const stockPret = c.etapes[2].prete, matPret = materielPret({ report: c.report, tax: c.tax, closing: c.closing, profile: c.profile, assets: c.assets });
  const carte = (key: string) => {
    const faite = !!c.tax.reviews[key as keyof typeof c.tax.reviews];
    switch (key) {
      case 'journal': return { etape: 1, etat: faite ? 'f' : 'a', texte: faite ? 'vu' : 'étape 1 à faire' };
      case 'privateUse': return { etape: 6, etat: faite ? 'f' : 'a', texte: faite ? 'vu' : 'étape 6 à faire' };
      case 'assets': return { etape: 3, etat: faite ? 'f' : (matPret || stockPret) ? 'h' : 'a', texte: faite ? 'vu' : matPret ? 'matériel vu, stock ?' : stockPret ? 'stock vu, matériel ?' : 'étape 3 et 4 à faire' };
      case 'balance': return { etape: 5, etat: faite ? 'f' : 'a', texte: faite ? 'vu' : 'étape 5 à faire' };
      case 'social': return { etape: 0, etat: faite ? 'f' : 'g', texte: faite ? 'vu' : 'à comparer au décompte' };
      default: return { etape: 0, etat: faite ? 'f' : 'g', texte: faite ? 'vu' : 'pertes passées, personnel…' };
    }
  };
  return <Cadre n={7} c={c} question="Six questions avant d’envoyer" terme="vérifications de l’année"
    bas={<button type="button" className="ann-pri" disabled={c.gele} onClick={() => c.act.feuille('checks')}>Cocher ce que j’ai vu</button>}>
    <div className="ann-vh"><svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${n} vérifications sur 6`}><circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" opacity=".15" strokeWidth="8"/><circle cx="32" cy="32" r="26" fill="none" stroke="#2F6B22" strokeWidth="8" strokeDasharray={`${circ * n / 6} ${circ}`} transform="rotate(-90 32 32)"/><text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor" className="ann-m">{n}/6</text></svg>
      <span className="ann-t2">{n === 6 ? 'Tout est vu.' : 'Chaque question se règle dans son étape, ou se coche ici.'}</span></div>
    <div className="ann-vg">{TAX_REVIEWS.map(r => { const k = carte(r.key); return <button type="button" key={r.key} className={`ann-v ${k.etat}`} onClick={() => k.etape ? c.act.aller(k.etape) : c.act.feuille('checks')}><b>{r.label}</b><span className="st"><i/>{k.texte}</span></button>; })}</div>
    <div className="ann-act"><span>Ta brasserie, c’est ton activité</span>
      <span className="ann-seg" role="group" aria-label="Activité de la brasserie"><button type="button" aria-pressed={c.tax.activity === 'main'} className={c.tax.activity === 'main' ? 'on' : ''} disabled={c.gele} onClick={() => c.act.ecrire(t => { t.activity = 'main'; })}>principale</button><button type="button" aria-pressed={c.tax.activity === 'secondary'} className={c.tax.activity === 'secondary' ? 'on' : ''} disabled={c.gele} onClick={() => c.act.ecrire(t => { t.activity = 'secondary'; })}>accessoire</button></span></div>
  </Cadre>;
}

/* ---------- 8 · Montants à reporter ---------- */
export function Etape8({ c }: { c: Ctx }) {
  const rev = ticketRevenu(c.report, c.tax), fo = ticketFortune(c.report, c.tax);
  const champ = (id: string) => c.tax.fields.find(f => f.id === id);
  // Le domaine écrit « Justificatif manquant : <identifiant> — <description>. » : l'identifiant technique ne s'affiche pas, la pièce se reconnaît à sa description.
  const lisible = (m: string) => { const r = /^Justificatif manquant : \S+ — (.*?)\.?$/.exec(m); return r ? `${r[1]} : justificatif manquant` : m; };
  const manques = c.tax.missing.slice(0, 3).map(lisible), autres = Math.max(0, c.tax.missing.length - 3);
  const enCours = c.report.generatedAt.slice(0, 10) <= `${c.year}-12-31`;
  const copier = (id: string, label: string, cents: number | null, pret: boolean) => <button type="button" className="ann-cpy" disabled={!pret || cents == null} aria-label={`Copier ${label}`} onClick={() => void c.dossier.copy(id, cents)}>{c.dossier.copied === id ? <Check size={14}/> : <Copy size={14}/>}Copier</button>;
  return <Cadre n={8} c={c} question="Ce que tu recopies dans ta déclaration" terme="montants à reporter · Fribourg"
    bas={<><Etoile onClick={() => c.act.assistant('Explique-moi, pas à pas, comment reporter le revenu et la fortune de ma brasserie ' + c.year + ' dans ma déclaration fribourgeoise, et ce qui manque encore. Rien ne doit être modifié.')}>Expliquer</Etoile><button type="button" className="ann-pri" onClick={() => c.act.aller(9)}>Préparer le dossier</button></>}>
    {!c.tax.mappingVerified && <p className="ann-gele">Les instructions vérifiées concernent {c.tax.sourceYear} : les codes {c.year} sont à confirmer avant le report.</p>}
    <div className="ann-cp"><h4>{champ('income')?.label ?? 'Revenu de la brasserie'}</h4>
      {rev.aReporterCents != null ? <span className="ann-m big">{montant(rev.aReporterCents)}</span> : <><span className="ann-m big ann-prov-n">{montant(rev.avantStockCents)}</span><small>avant stock : ce n’est pas encore le montant à reporter</small></>}
      <small>ventes <span className="ann-m">{montant(c.report.revenueCents)}</span> − dépensé <span className="ann-m">{montant(c.report.operatingExpensesCents)}</span> − usure <span className="ann-m">{montant(c.report.depreciationCents)}</span> ± stock <span className="ann-m">{c.report.inventoryChangeCents == null ? '?' : montant(c.report.inventoryChangeCents)}</span>{c.tax.correctionCents !== 0 && <> ± corrections <span className="ann-m">{montant(c.tax.correctionCents)}</span></>}</small>
      <span className="cod"><span className={`ann-pa ${rev.pret ? 'ok' : 'at'}`}>{rev.pret ? 'prêt' : 'provisoire'}</span><span className="ann-pa no">{rev.code ? `code ${c.tax.sourceYear} : ${rev.code}` : 'code : choisis principale ou accessoire (étape 7)'}</span></span>
      {copier('income', champ('income')?.label ?? 'Revenu', rev.aReporterCents, rev.pret)}</div>
    <div className="ann-cp"><h4>{champ('wealth')?.label ?? 'Fortune de la brasserie'}</h4>
      {fo.aReporterCents != null ? <span className="ann-m big">{montant(fo.aReporterCents)}</span> : <><span className="ann-m big ann-prov-n">À confirmer</span><small>annexe 05 des instructions</small></>}
      <small>aide, pas le montant à reporter : caisse <span className="ann-m">{fo.aideCaisseCents == null ? '?' : montant(fo.aideCaisseCents)}</span> + cuve <span className="ann-m">{montant(fo.aideMaterielCents)}</span> − dettes <span className="ann-m">{montant(fo.aideDettesCents)}</span>{fo.aideNetteCents == null ? ' = ? (stock à compter)' : <> = <span className="ann-m">{montant(fo.aideNetteCents)}</span></>}</small>
      <span className="cod"><span className={`ann-pa ${fo.pret ? 'ok' : 'at'}`}>{fo.pret ? 'prêt' : 'provisoire'}</span><span className="ann-pa no">{fo.code ? `code ${c.tax.sourceYear} : ${fo.code}` : 'code à vérifier'}</span></span>
      {copier('wealth', champ('wealth')?.label ?? 'Fortune', fo.aReporterCents, fo.pret)}
      <button type="button" className="ann-link" onClick={() => c.act.feuille('wealth')}>Confirmer le report de fortune</button></div>
    {enCours && <p className="ann-terme">L’exercice court encore : le report n’est prêt qu’après le 31 déc.</p>}
    {manques.length > 0 && <ul className="ann-manque">{manques.map(m => <li key={m}>{m}</li>)}{autres > 0 && <li>+ {autres} autre{autres > 1 ? 's' : ''}</li>}</ul>}
    <p className="ann-terme">La déclaration personnelle reste à compléter : autres revenus, prévoyance, famille. <a href={c.tax.sourceUrl} target="_blank" rel="noreferrer">Instructions officielles Fribourg {c.tax.sourceYear}</a></p>
  </Cadre>;
}

/* ---------- 9 · Dossier ---------- */
export function Etape9({ c, nouvelleVersion }: { c: Ctx; nouvelleVersion: () => void }) {
  const d = c.dossier, j = justificatifs(c.report.documents ?? []), arch = d.archive;
  const inventaires = c.closing?.inventoriesConfirmed;
  const matPret = c.etapes[3].prete, rapPret = c.tax.ready;
  const peutFiger = !!c.closing && !c.closing.report;
  return <Cadre n={9} c={c} question={`Ton dossier ${c.year}`} terme="pour l’impôt, la fiduciaire ou tes archives"
    bas={<><button type="button" className="ann-pri" aria-label="Télécharger le dossier avec justificatifs" disabled={d.busy} onClick={() => void d.download('zip')}>{d.busy ? <Loader2 size={18} className="animate-spin"/> : <Download size={18}/>}Télécharger le dossier</button></>}>
    <div className="ann-dos"><span className="tt">{c.year}, {c.closing?.report ? 'figé' : 'provisoire'}</span>
      <div className="ann-docs">
        <button type="button" className="ann-doc" disabled={d.busy} onClick={() => void d.download('pdf')}><b>Comptes</b><span className="ann-pa no">PDF</span></button>
        <button type="button" className="ann-doc" disabled={d.busy} onClick={() => void d.download('xlsx')}><b>Opérations</b><span className="ann-pa no">Excel</span></button>
        <button type="button" className={`ann-doc${j.avec < j.requis ? ' miss ann-hachA' : ''}`} onClick={() => c.act.onOperations({ scope: 'all', year: String(c.year), allDates: true, filter: 'proof' })}><b>Justificatifs</b><span className="ann-m">{j.avec} / {j.requis}</span></button>
        <button type="button" className={`ann-doc${inventaires ? '' : ' miss ann-hachA'}`} onClick={() => c.act.aller(3)}><b>Inventaires</b>{inventaires ? <span className="ann-pa ok">confirmés</span> : <span className="ann-m">?</span>}</button>
        <button type="button" className="ann-doc" onClick={() => c.act.aller(4)}><b>Matériel</b><span className={`ann-pa ${matPret ? 'ok' : 'at'}`}>{matPret ? 'prêt' : 'à compléter'}</span></button>
        <button type="button" className="ann-doc" onClick={() => c.act.aller(8)}><b>Montants à reporter</b><span className={`ann-pa ${rapPret ? 'ok' : 'at'}`}>{rapPret ? 'prêts' : 'provisoire'}</span></button>
      </div></div>
    {d.notice && <p className="ann-gele" role="status">{d.notice}</p>}
    {d.driveAuthError && <DriveConnection always onConnected={() => { d.setDriveAuthError(false); d.setNotice('Drive connecté. Tu peux reprendre le téléchargement ou figer la version.'); }}/>}
    {d.busy && <p className="ann-terme" role="status">{d.progress || 'Enregistrement de la version…'}</p>}
    {arch?.result.nextIndex != null && <button type="button" className="ann-btn" disabled={d.busy} onClick={() => void d.download('zip', true)}>Télécharger la suite · volume {arch.volume + 1}</button>}
    {arch && arch.missingCount > 0 && <div className="ann-gele"><strong>{arch.missingCount} pièce(s) non jointe(s) dans les volumes téléchargés</strong><p>Le détail se trouve dans chaque index. Remplace les fichiers indisponibles ou ajoute les originaux des liens externes, puis télécharge à nouveau.</p>{arch.result.entries.filter(e => e.required && e.status !== 'included').slice(0, 5).map(e => <p key={e.id}>{e.label} : {e.status === 'external' ? 'lien externe, original à joindre' : e.detail}</p>)}</div>}
    <button type="button" className="ann-row" onClick={() => c.act.feuille('attachments')}><span className="ann-t">Pièces complémentaires<small>relevés bancaires, AVS, annexes signées</small></span><span className="ann-m">{c.tax.attachments.length}</span></button>
    {c.closing?.report ? <button type="button" className="ann-row" onClick={nouvelleVersion}><span className="ann-t">Travailler sur une nouvelle version<small>la version figée reste intacte</small></span><Lock size={16}/></button>
      : <button type="button" className="ann-row" disabled={!peutFiger || d.busy} onClick={() => void d.freeze()}><span className="ann-t">Figer la version {c.year}<small>{peutFiger ? 'une copie de référence, intouchable' : 'note d’abord l’inventaire (étape 3)'}</small></span><Lock size={16}/></button>}
    <button type="button" className="ann-row" onClick={c.act.onArchives}><span className="ann-t">Archives<small>années passées</small></span></button>
    <p className="ann-terme">Extrais le ZIP pour joindre les documents demandés dans FriTax. Conserve l’ensemble pendant dix ans.</p>
  </Cadre>;
}
