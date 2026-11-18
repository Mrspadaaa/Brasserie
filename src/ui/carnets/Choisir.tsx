/**
 * Choisir, choisi, pourquoi (R07, figés p2:g05-9, p2:g05-11, p2:v03-7, p2:v09-3 ; R34, D-20 ; R32).
 * - `choisir` (g05-9) : l'article en tête, dans un cadre pointillé : prix, vendeur, Ouvrir ↗, « Ses autres valeurs · place
 *   parmi les n », « Choisir chez <vendeur> » et « Écarter », « Part dans À venir : … , avec le pourquoi. » ; le pourquoi est
 *   proposé (IA ou calcul) dans un champ qu'il corrige ; les autres articles dessous.
 * - `choisi` (g05-11) : « Choisi le 14 nov. », l'article, « Pourquoi ce choix » : la phrase, puis critère, façon, fournisseur (✓) et
 *   écartés (✕) ; un choix revu reste lisible (« Choix d'avant », ADR) ; « Envoyer dans À venir » seulement sur l'idée choisie et
 *   pas encore envoyée, sinon « Dans À venir depuis le … · Voir » (R32). Aucune caisse ni trésorerie ici.
 */
import React, { useEffect, useRef, useState } from 'react';
import { CalendarCheck, Check, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { dateCourte, montant, Provenance, rangTexte, type ArticleV, type ChoixV, type CritereV, type FaconV } from './EtatIA';

export interface ValeurPlaceeV { nom: string; texte: string; rang?: number; exAequo?: boolean }

export type ChoisirProps = {
  titre: string;
  onRetour: () => void;
} & (
  | {
    etape: 'choisir';
    article: ArticleV;
    sur: number;
    valeurs: ValeurPlaceeV[];
    autres: { article: ArticleV; rang: number; mesure?: string }[];
    pourquoiPropose?: string;
    onChoisir: (pourquoi: string) => void;
    onEcarter: (raison: string) => void;
  }
  | {
    etape: 'choisi';
    choix: ChoixV;
    article: ArticleV;
    critere?: CritereV;
    facon?: FaconV;
    /** Les articles écartés au choix, avec leur nom. */
    ecartes: { nom: string; raison: string }[];
    remplaces?: { nom: string; pourquoi: string; le: string }[];
    sortie?: { le: string } | null;
    onEnvoyerAVenir?: () => void;
    onVoirAVenir?: () => void;
  }
);

export function Choisir(p: ChoisirProps) {
  if (p.etape === 'choisir') return <ChoisirArticle {...p} />;
  return <ChoisiVue {...p} />;
}

/**
 * L'état « choisi » (g05-11). Il remplace l'écran Choisir sur place, au bas duquel on vient de toucher « Choisir » : à son arrivée, la
 * vue défile pour mettre « Choisi le … » et « Pourquoi ce choix » en haut de l'écran (sinon on reste face au bas de la page).
 */
function ChoisiVue(p: Extract<ChoisirProps, { etape: 'choisi' }>) {
  const a = p.article;
  const le = dateCourte(p.choix.le);
  const sortieLe = dateCourte(p.sortie?.le);
  const haut = useRef<HTMLElement>(null);
  useEffect(() => { haut.current?.scrollIntoView?.({ block: 'start' }); }, []);
  return (
    <article ref={haut} className="cn-page cn-choisi">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> Carnets</button>
        <span className="cn-sp" />
        <span className="cn-pastille cn-statut-validated">Choisi{le ? ` le ${le}` : ''}</span>
      </div>
      <h2 className="cn-titre">{p.titre}</h2>
      <div className="cn-carte cn-choisi-carte">
        {a.photo ? <img className="cn-vignette" src={a.photo} alt="" /> : null}
        <div className="cn-sp">
          <b>{a.nom}</b>
          <span className="cn-mut">{[a.vendeur, a.pays].filter(Boolean).join(' · ')}</span>
        </div>
        {montant(a.prixCentimes) && <span className="cn-mono cn-prix">{montant(a.prixCentimes)}</span>}
      </div>
      <section className="cn-pourquoi" aria-label="Pourquoi ce choix">
        <h3 className="cn-sous">Pourquoi ce choix</h3>
        {p.choix.pourquoi.trim() && <p>{p.choix.pourquoi}</p>}
        <ul className="cn-raisons">
          {p.critere && <li><Check size={18} aria-hidden className="cn-ok" /><span><b>Critère</b> : {p.critere.texte}{p.critere.origine === 'ia' ? ", proposé par l'IA" : ''}</span></li>}
          {p.facon && <li><Check size={18} aria-hidden className="cn-ok" /><span><b>Façon {p.facon.nom.toLowerCase()}</b>{p.facon.raison ? ` : ${p.facon.raison}` : ''}</span></li>}
          {a.vendeur && <li><Check size={18} aria-hidden className="cn-ok" /><span><b>{a.vendeur}</b>{a.dispo ? ` : ${a.dispo}` : ''}</span></li>}
          {p.ecartes.map(e => <li key={e.nom}><X size={18} aria-hidden /><span><b>{e.nom}</b> : {e.raison}</span></li>)}
        </ul>
        {p.choix.aRevoirSi && <p className="cn-mut">À revoir si : {p.choix.aRevoirSi}</p>}
        {p.remplaces && p.remplaces.length > 0 && (
          <details className="cn-avant">
            <summary>Choix d'avant · {p.remplaces.length}</summary>
            {p.remplaces.map((r, i) => <p key={i} className="cn-mut"><b className="cn-encre">{r.nom}</b>{dateCourte(r.le) ? `, le ${dateCourte(r.le)}` : ''} : {r.pourquoi}</p>)}
          </details>
        )}
        {a.origine === 'exemple' && <p className="cn-mut">Valeurs annoncées par les vendeurs, pas mesurées chez nous · <Provenance origine="exemple" /></p>}
      </section>
      {p.sortie ? (
        <button type="button" className="cn-avenir" onClick={p.onVoirAVenir}>
          <CalendarCheck size={18} aria-hidden /><span className="cn-sp">Dans À venir{sortieLe ? ` depuis le ${sortieLe}` : ''}</span><span>Voir</span><ChevronRight size={18} aria-hidden />
        </button>
      ) : p.onEnvoyerAVenir ? (
        <button type="button" className="cn-action" onClick={p.onEnvoyerAVenir}><CalendarCheck size={18} aria-hidden /> Envoyer dans À venir</button>
      ) : null}
    </article>
  );
}

function ChoisirArticle(p: Extract<ChoisirProps, { etape: 'choisir' }>) {
  const a = p.article;
  const prix = montant(a.prixCentimes);
  const [pourquoi, setPourquoi] = useState(p.pourquoiPropose ?? '');
  const [raison, setRaison] = useState<string | null>(null);
  return (
    <article className="cn-page cn-choisir">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> {p.titre}</button>
        <span className="cn-sp" />
        <span className="cn-pastille cn-statut-research">À comparer</span>
      </div>
      <section className="cn-choisir-cadre" aria-label="Choisir">
        <div className="cn-offre">
          <span className="cn-radio" aria-hidden />
          {prix && <span className="cn-mono cn-prix-grand">{prix}</span>}
          <div className="cn-sp"><b>{[a.vendeur, a.pays].filter(Boolean).join(' · ') || a.nom}</b>{a.dispo && <span className="cn-mut">{a.dispo}</span>}</div>
          {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
        </div>
        {p.valeurs.length > 0 && (
          <table className="cn-place">
            <caption><span>Ses autres valeurs</span><span className="cn-mut">place parmi les {p.sur}</span></caption>
            <tbody>
              {p.valeurs.map(v => (
                <tr key={v.nom}><th scope="row">{v.nom}</th><td className="cn-mono">{v.texte}</td><td className={v.rang === 1 ? 'cn-vert' : 'cn-mut'}>{v.rang ? `${rangTexte(v.rang)}${v.exAequo ? ' ex aequo' : ''}` : ''}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <label className="cn-pourquoi-champ">
          <span>Pourquoi {p.pourquoiPropose ? <Provenance origine="ia" /> : null}</span>
          <textarea rows={2} value={pourquoi} onChange={e => setPourquoi(e.target.value)} placeholder="une phrase suffit" />
        </label>
        <div className="cn-rang-boutons">
          <button type="button" className="cn-action cn-sp" onClick={() => p.onChoisir(pourquoi.trim())}>Choisir{a.vendeur ? ` chez ${a.vendeur}` : ''}</button>
          <button type="button" className="cn-second" onClick={() => setRaison(raison === null ? '' : null)}>Écarter</button>
        </div>
        {raison !== null && (
          <form className="cn-rang-boutons" onSubmit={e => { e.preventDefault(); if (raison.trim()) p.onEcarter(raison.trim()); }}>
            <input className="cn-entree cn-sp" value={raison} onChange={e => setRaison(e.target.value)} placeholder="raison, en quelques mots" aria-label="Raison de l'écart" />
            <button type="submit" className="cn-second" disabled={!raison.trim()}>Écarter</button>
          </form>
        )}
        <p className="cn-mut">Part dans À venir : {[prix ? `${prix} ${a.devise ?? 'CHF'}` : null, a.dispo, a.vendeur].filter(Boolean).join(', ')}, avec le pourquoi.</p>
      </section>
      {p.autres.map(o => (
        <div key={o.article.id} className="cn-carte cn-article">
          <span className="cn-rang">{o.rang}</span>
          {o.article.photo ? <img className="cn-vignette" src={o.article.photo} alt="" /> : null}
          <div className="cn-article-tx"><b>{o.article.nom}</b><span className="cn-mut">{[o.article.vendeur, o.article.pays].filter(Boolean).join(' · ')}</span></div>
          <div className="cn-droite">{montant(o.article.prixCentimes) && <span className="cn-mono cn-prix">{montant(o.article.prixCentimes)}</span>}{o.mesure && <span className="cn-mut">{o.mesure}</span>}</div>
        </div>
      ))}
    </article>
  );
}
