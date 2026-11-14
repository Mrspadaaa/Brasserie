import React from 'react';
import { nombreFr } from '../../../domain/nombreAffiche';
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react';
import { echelle } from '../../../domain/finance/periodeSynthese';
import { colonnesAnnee, piecesAClasser, premiereNonPrete, resultatEnAttente, type EtapeEtat } from './calculs';
import { couleur, libelleCategorie, texteSur } from '../synthese/libelles';
import { montant } from '../previsions/format';
import { versInventaireCloture, type Ctx } from './ctx';

const H = 286;
/** Hauteur (px) sous laquelle l'écart ne contient plus son texte : perte = résultat 28 + « CHF perdus » + badge du stock 28 + marges ; gain = résultat 24 + « CHF gagnés ». */
export const ECART_MIN_TEXTE_PERTE = 96, ECART_MIN_TEXTE_GAIN = 56;

export function Piste({ etapes, ici, onGo }: { etapes: EtapeEtat[]; ici?: number; onGo: (n: number) => void }) {
  const now = premiereNonPrete(etapes)?.n;
  const clavier = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const boutons = Array.from(e.currentTarget.querySelectorAll('button')), i = boutons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    boutons[e.key === 'Home' ? 0 : e.key === 'End' ? boutons.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : boutons.length - 1)) % boutons.length]?.focus();
  };
  return <div className="ann-pi" role="group" onKeyDown={clavier} aria-label={`Clôture : ${etapes.filter(e => e.prete).length} étapes sur 9 prêtes`}>
    {etapes.map(e => <button type="button" key={e.n} aria-label={`${e.n}. ${e.nom}${e.prete ? ' · prête' : ''}`} aria-current={ici === e.n ? 'step' : undefined} className={`ann-pi-b${e.prete ? ' ok' : e.n === now ? ' now' : ''}${ici === e.n ? ' ici' : ''}`} onClick={() => onGo(e.n)}><i/></button>)}
  </div>;
}

/** « Stock au 31 déc. » : inconnu, la puce est un renvoi (CP-18) vers l'inventaire de CLÔTURE, avec ce que le manque empêche ; connu, une simple valeur. */
function PuceStock({ c, label, seul }: { c: Ctx; label: string; seul: boolean }) {
  const classe = `ann-stock${seul ? ' ann-stock-seul' : ''} ann-m`;
  if (c.report.inventoryChangeCents != null) return <i className={classe}>Stock au 31 déc. <b>{label}</b></i>;
  return <button type="button" className={`${classe} ann-stock-q`} disabled={c.gele} aria-label="Noter le stock au 31 déc. : sans lui, la perte reste avant stock" onClick={() => versInventaireCloture(c)}>Stock au 31 déc. <b>{label}</b><small className="ann-stock-why">sans lui, perte avant stock ›</small></button>;
}

/** « À classer » : une pièce de travaux dont on ne sait pas si c'est une charge ou du matériel. Même état que la puce du stock (hachure jaune, renvoi) : elle mène à l'étape 4, où la pièce se classe. */
function PuceAClasser({ c, cents }: { c: Ctx; cents: number }) {
  return <button type="button" className="ann-stock ann-stock-seul ann-stock-q ann-m" aria-label={`${cents > 0 ? `${montant(cents)} à classer` : 'Matériel à classer'} : sans classement, pas de résultat. Ouvrir l’étape matériel`} onClick={() => c.act.aller(4)}>À classer{cents > 0 && <> <b style={{ fontSize: 12, lineHeight: 1.25 }}>{montant(cents)}</b></>}<small className="ann-stock-why">sans lui, pas de résultat ›</small></button>;
}

export function Tete({ c, onAnnee, onMois, onTva, tva }: { c: Ctx; onAnnee: () => void; onMois: () => void; onTva: () => void; tva: { libelle: string; pct: number } | null }) {
  const aClasser = React.useMemo(() => piecesAClasser(c.transactions, c.assets, c.year), [c.transactions, c.assets, c.year]);
  const col = colonnesAnnee(c.report, aClasser);
  const attente = resultatEnAttente(c.report, aClasser);
  const maxCents = Math.max(col.entreCents, col.totalAvecAClasserCents, 1);
  const ech = echelle(col.entreCents, col.totalDepenseCents, H);
  const prets = c.etapes.filter(e => e.prete).length, suivante = premiereNonPrete(c.etapes);
  const ventes = c.report.documents.filter(d => d.category === 'recettes');
  const legendeVente = ventes.length === 1 ? ventes[0].description : ventes.length > 1 ? `${ventes.length} ventes` : 'Aucune vente notée';
  const vide = col.entreCents === 0 && col.totalAvecAClasserCents === 0;
  const stockLabel = c.report.inventoryChangeCents == null ? '?' : `${c.report.inventoryChangeCents > 0 ? '+' : ''}${montant(c.report.inventoryChangeCents)}`;
  const perte = col.perteAvantStockCents;
  const ecartMince = ech.hEcart < ECART_MIN_TEXTE_PERTE, gainMince = ech.hEcart < ECART_MIN_TEXTE_GAIN;
  return <div className="ann-wrap">
    <section>
      <div className="ann-top">
        <button type="button" className="ann-an" aria-label={`Année ${c.year} et versions`} onClick={onAnnee}>{c.year}<ChevronDown size={14}/></button>
        <span className="ann-prov">{c.closing?.report ? 'version figée' : 'provisoire'}</span>
        <button type="button" className="ann-tool" onClick={onMois}><LayoutGrid size={16}/>Mois par mois</button>
      </div>
      {c.gele && <p className="ann-gele">Cette version est figée : ses chiffres ne bougent plus.</p>}
      {c.perimees && <p className="ann-gele" role="status">Les comptes ont changé depuis ta dernière relecture : les vérifications sont à refaire.</p>}
      {vide ? <p className="ann-vide">Rien de noté pour {c.year}.</p> : <div className="ann-scene" role="img" aria-label={attente ? `${c.year} : entré ${montant(col.entreCents)}, dépensé plus usure ${montant(col.totalDepenseCents)}${col.aClasserCents > 0 ? `, ${montant(col.aClasserCents)} à classer` : ''} ; résultat en attente du classement` : `${c.year} : entré ${montant(col.entreCents)}, dépensé plus usure ${montant(col.totalDepenseCents)}, ${perte < 0 ? 'perdu' : 'gagné'} ${montant(Math.abs(perte))} avant le stock`}>
        <div className="ann-col">
          <div className="ann-hc"><span>&nbsp;</span></div>
          {/* Une pièce attend son classement : le résultat n'est pas ferme (le domaine le refuse aussi, `resultCents` null). Pas de « perdus » ni de « gagnés » : un « ? » et les deux renvois. */}
          {attente && <div className="ann-trou-txt" style={{ color: 'var(--ann-attt)' }}><b className="ann-m">?</b><span>CHF : résultat en attente</span><PuceAClasser c={c} cents={col.aClasserCents}/><PuceStock c={c} label={stockLabel} seul={true}/></div>}
          {!attente && ech.signe === 'perte' && !ecartMince &&<div className="ann-trou" style={{ height: ech.hEcart }}><b className="ann-m">{montant(perte)}</b><span>CHF perdus</span><PuceStock c={c} label={stockLabel} seul={false}/></div>}
          {/* Écart trop mince pour porter son texte (g6 : le trou est à l'échelle, jamais gonflé) : le trou reste un liseré hachuré à sa vraie hauteur, le résultat et le stock se posent juste au-dessus. */}
          {!attente && ech.signe === 'perte' && ecartMince && <><div className="ann-trou-txt"><b className="ann-m">{montant(perte)}</b><span>CHF perdus</span><PuceStock c={c} label={stockLabel} seul={true}/></div><div className="ann-trou ann-trou-mince" style={{ height: ech.hEcart }} aria-hidden="true" /></>}
          {!attente && ech.signe !== 'perte' && <PuceStock c={c} label={stockLabel} seul={true}/>}
          <div className="ann-pile ann-pile-entree" style={attente ? { height: Math.round(H * col.entreCents / maxCents), borderRadius: 10 } : { height: ech.signe === 'perte' ? ech.hPileEntree : H }}>
            <span className="ann-lib">Entré <b className="ann-m">{montant(col.entreCents)}</b></span><span className="ann-leg">{legendeVente}</span>
          </div>
        </div>
        <div className="ann-col">
          <div className="ann-hc">Dépensé + usure <b className="ann-m">{montant(col.totalDepenseCents)}</b></div>
          {!attente && ech.signe === 'gain' && !gainMince && <div className="ann-gain" style={{ height: ech.hEcart }}><b className="ann-m">+{montant(perte)}</b><span>CHF gagnés</span></div>}
          {!attente && ech.signe === 'gain' && gainMince && <><div className="ann-gain-txt"><b className="ann-m">+{montant(perte)}</b><span>CHF gagnés</span></div><div className="ann-gain ann-gain-mince" style={{ height: ech.hEcart }} aria-hidden="true" /></>}
          <div className="ann-pile" style={{ height: attente ? Math.round(H * col.totalAvecAClasserCents / maxCents) : ech.signe === 'gain' ? ech.hPileDepense : H }}>
            {col.usureCents > 0 && <div className="ann-s ann-usure" style={{ flex: col.usureCents }}><span className="ann-tag">Usure du matériel <b className="ann-m">{montant(col.usureCents)}</b></span><span className="ann-tag">estimé</span></div>}
            {/* Hors du ferme : une pièce à classer se pose en segment hachuré (la grammaire de g6 pour l'inconnu), et se touche pour la classer. */}
            {col.aClasser.map(p => <button type="button" key={p.id} className="ann-s ann-hachA" style={{ flex: p.chargeCents, color: 'var(--ann-attt)', border: '2px dashed var(--ann-att)', alignItems: 'center' }} aria-label={`${p.description} ${montant(p.chargeCents)} : à classer, charge ou matériel. Ouvrir l’étape matériel`} onClick={() => c.act.aller(4)}><span>{p.description}<small style={{ display: 'block', fontSize: 11, fontWeight: 600 }}>à classer ›</small></span><b className="ann-m">{montant(p.chargeCents)}</b></button>)}
            {col.postes.map(p => <div key={p.categorie} className="ann-s" style={{ flex: p.cents, background: couleur(p.categorie), color: p.categorie === 'renovation' ? '#24100a' : texteSur(p.categorie) }}><span>{libelleCategorie(p.categorie)}</span><b className="ann-m">{montant(p.cents)}</b></div>)}
          </div>
        </div>
      </div>}
    </section>
    <section>
      <div className="ann-cl">
        <div className="ann-clh">Clôture {c.year}<small><span className="ann-m">{prets} / 9</span> prêtes</small></div>
        <Piste etapes={c.etapes} onGo={c.act.aller}/>
        <div className="ann-next"><span>{suivante ? <>Ensuite<b>{suivante.nom === 'Opérations' ? 'Vérifier les opérations' : suivante.nom}</b></> : <b>Tout est prêt</b>}</span>
          <button type="button" className="ann-go" onClick={() => c.act.aller(suivante?.n ?? 9)}>Continuer</button></div>
      </div>
      <button type="button" className="ann-row" onClick={() => c.act.aller(8)}><span className="ann-t">Impôts Fribourg<small>{c.report.generatedAt.slice(0, 10) <= `${c.year}-12-31` ? 'après le 31 déc.' : 'à reporter'}</small></span><ChevronRight size={16}/></button>
      {tva && <button type="button" className="ann-row" onClick={onTva}><span className="ann-t">TVA<small>{tva.libelle}</small></span><span className="ann-m ann-t2">{nombreFr(tva.pct, tva.pct > 0 && tva.pct < 10 ? 1 : 0)} %</span><ChevronRight size={16}/></button>}
      <button type="button" className="ann-row" onClick={() => c.act.aller(9)}><span className="ann-t">Dossier et archives</span><ChevronRight size={16}/></button>
    </section>
  </div>;
}
