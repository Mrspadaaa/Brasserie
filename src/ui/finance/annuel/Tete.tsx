import React from 'react';
import { nombreFr } from '../../../domain/nombreAffiche';
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react';
import { echelle } from '../../../domain/finance/periodeSynthese';
import { colonnesAnnee, premiereNonPrete, type EtapeEtat } from './calculs';
import { couleur, libelleCategorie, texteSur } from '../synthese/libelles';
import { montant } from '../previsions/format';
import type { Ctx } from './ctx';

const H = 286;

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

export function Tete({ c, onAnnee, onMois, onTva, tva }: { c: Ctx; onAnnee: () => void; onMois: () => void; onTva: () => void; tva: { libelle: string; pct: number } | null }) {
  const col = colonnesAnnee(c.report);
  const ech = echelle(col.entreCents, col.totalDepenseCents, H);
  const prets = c.etapes.filter(e => e.prete).length, suivante = premiereNonPrete(c.etapes);
  const ventes = c.report.documents.filter(d => d.category === 'recettes');
  const legendeVente = ventes.length === 1 ? ventes[0].description : ventes.length > 1 ? `${ventes.length} ventes` : 'Aucune vente notée';
  const vide = col.entreCents === 0 && col.totalDepenseCents === 0;
  const stockLabel = c.report.inventoryChangeCents == null ? '?' : `${c.report.inventoryChangeCents > 0 ? '+' : ''}${montant(c.report.inventoryChangeCents)}`;
  const perte = col.perteAvantStockCents;
  return <div className="ann-wrap">
    <section>
      <div className="ann-top">
        <button type="button" className="ann-an" aria-label={`Année ${c.year} et versions`} onClick={onAnnee}>{c.year}<ChevronDown size={14}/></button>
        <span className="ann-prov">{c.closing?.report ? 'version figée' : 'provisoire'}</span>
        <button type="button" className="ann-tool" onClick={onMois}><LayoutGrid size={16}/>Mois par mois</button>
      </div>
      {c.gele && <p className="ann-gele">Cette version est figée : ses chiffres ne bougent plus.</p>}
      {c.perimees && <p className="ann-gele" role="status">Les comptes ont changé depuis ta dernière relecture : les vérifications sont à refaire.</p>}
      {vide ? <p className="ann-vide">Rien de noté pour {c.year}.</p> : <div className="ann-scene" role="img" aria-label={`${c.year} : entré ${montant(col.entreCents)}, dépensé plus usure ${montant(col.totalDepenseCents)}, ${perte < 0 ? 'perdu' : 'gagné'} ${montant(Math.abs(perte))} avant le stock`}>
        <div className="ann-col">
          <div className="ann-hc"><span>&nbsp;</span></div>
          {ech.signe === 'perte' && <div className="ann-trou" style={{ height: ech.hEcart }}><b className="ann-m">{montant(perte)}</b><span>CHF perdus</span><i className="ann-stock ann-m">Stock au 31 déc. <b>{stockLabel}</b></i></div>}
          {ech.signe !== 'perte' && <i className="ann-stock ann-stock-seul ann-m">Stock au 31 déc. <b>{stockLabel}</b></i>}
          <div className="ann-pile ann-pile-entree" style={{ height: ech.signe === 'perte' ? ech.hPileEntree : H }}>
            <span className="ann-lib">Entré <b className="ann-m">{montant(col.entreCents)}</b></span><span className="ann-leg">{legendeVente}</span>
          </div>
        </div>
        <div className="ann-col">
          <div className="ann-hc">Dépensé + usure <b className="ann-m">{montant(col.totalDepenseCents)}</b></div>
          {ech.signe === 'gain' && <div className="ann-gain" style={{ height: ech.hEcart }}><b className="ann-m">+{montant(perte)}</b><span>CHF gagnés</span></div>}
          <div className="ann-pile" style={{ height: ech.signe === 'gain' ? ech.hPileDepense : H }}>
            {col.usureCents > 0 && <div className="ann-s ann-usure" style={{ flex: col.usureCents }}><span className="ann-tag">Usure du matériel <b className="ann-m">{montant(col.usureCents)}</b></span><span className="ann-tag">estimé</span></div>}
            {col.postes.map(p => <div key={p.categorie} className="ann-s" style={{ flex: p.cents, background: couleur(p.categorie), color: texteSur(p.categorie) }}><span>{libelleCategorie(p.categorie)}</span><b className="ann-m">{montant(p.cents)}</b></div>)}
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
