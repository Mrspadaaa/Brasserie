/**
 * L'article ouvert (R05, figé p2:h01-6) : photo de la page collée, nom entier, façon et sa raison, la mesure qui compte avec
 * sa place parmi les autres, l'offre (vendeur, prix, Ouvrir ↗), les caractéristiques lues avec leur rang, la veille, Choisir.
 * Veille (R31, D-28) : libellé et bascule de g5:v06-10, « Veille du prix, tous les 3 jours », éteinte à la naissance ; allumée et
 * sans relève, « demandée · pas encore relevée » : aucune date de relève, aucun prix relevé, aucune baisse.
 */
import React from 'react';
import { Camera, Check, ChevronLeft, ExternalLink, Eye } from 'lucide-react';
import { Bascule, mesureCritere } from './CarteArticle';
import { dateCourte, montant, Provenance, rangTexte, valeurTexte, type ArticleV, type CritereV, type FaconV } from './EtatIA';

export interface FicheArticleProps {
  article: ArticleV;
  titreCarnet: string;
  critere?: CritereV;
  facon?: FaconV;
  /** Place de l'article et nombre d'articles comparables (« 1re sur 5 »). */
  rang?: number;
  sur?: number;
  /** Les valeurs des autres articles sur la caractéristique du critère, pour la piste « la plus basse des 5 ». */
  autresMesures?: number[];
  /** Rang de chaque caractéristique (« 2e »), calculé par `comparer.ts`. */
  rangs?: Record<string, number>;
  /** L'idée est-elle déjà choisie ? Alors pas de Choisir ici (R07). */
  choisi?: boolean;
  onRetour: () => void;
  onVeille: (active: boolean) => void;
  onChoisir?: () => void;
}

export function FicheArticle(p: FicheArticleProps) {
  const a = p.article;
  const prix = montant(a.prixCentimes);
  const mesure = mesureCritere(a, p.critere);
  const carac = p.critere?.caracteristique;
  const autres = Object.entries(a.valeurs).filter(([nom]) => nom !== carac?.nom);
  const veille = !!a.veille?.active;
  const lu = dateCourte(Object.values(a.valeurs).find(v => v.luLe)?.luLe);
  const ajoute = dateCourte(a.ajouteLe);
  const piste = mesure && p.autresMesures && p.autresMesures.length > 1 ? p.autresMesures : null;
  const qui = a.vendeur ?? a.domaine;

  return (
    <article className="cn-page cn-fiche">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> Articles · {p.titreCarnet}</button>
        <span className="cn-sp" />
        {p.rang !== undefined && p.sur ? <span className="cn-pastille">{rangTexte(p.rang)} sur {p.sur}</span> : null}
      </div>
      {a.photo ? (
        <figure className="cn-fiche-photo"><img src={a.photo} alt="" /><figcaption><Camera size={16} aria-hidden /> photo de la page collée</figcaption></figure>
      ) : null}
      <h2 className="cn-titre">{a.nom ?? a.domaine ?? 'Lien sans aperçu'}</h2>
      {(p.facon || ajoute) && (
        <p className="cn-mut">
          {p.facon && <><b className="cn-encre">façon {p.facon.nom.toLowerCase()}</b>{p.facon.raison ? ` : ${p.facon.raison}` : ''}</>}
          {p.facon && ajoute ? ' · ' : ''}{ajoute ? `lien collé le ${ajoute}` : ''}
        </p>
      )}
      {mesure && carac && (
        <div className="cn-mesure">
          <div>
            <span className="cn-mut">{p.critere!.texte}</span>
            <span className="cn-mesure-val"><span className="cn-mono">{mesure.texte}</span>{mesure.unite ? <small> {mesure.unite}</small> : null}</span>
          </div>
          {piste && <Piste valeurs={piste} moi={Number(String(mesure.texte).replace(',', '.'))} sens={carac.sens} />}
        </div>
      )}
      {(prix || qui) && (
        <>
          <h3 className="cn-sous">Offre</h3>
          <div className="cn-offre">
            <div className="cn-sp">
              <b>{[a.vendeur, a.pays].filter(Boolean).join(' · ') || a.domaine}</b>
              {a.dispo && <span className="cn-mut">{a.dispo}</span>}
            </div>
            {prix && <span className="cn-mono cn-prix">{prix}</span>}
            {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
          </div>
        </>
      )}
      {autres.length > 0 && (
        <>
          <h3 className="cn-sous">Caractéristiques {lu && <span className="cn-mut">lues sur la fiche du vendeur, {lu}</span>}</h3>
          <dl className="cn-carac">
            {autres.map(([nom, v]) => {
              const t = valeurTexte(v);
              return (
                <div key={nom}>
                  <dt>{nom}</dt>
                  <dd>{t === null ? <span className="cn-mut">non publié</span> : <><span className="cn-mono">{t}</span>{v.unite ? ` ${v.unite}` : ''}</>}
                    {p.rangs?.[nom] ? <span className="cn-vert"> {rangTexte(p.rangs[nom])}</span> : null}
                    {v.origine === 'exemple' && <> <Provenance origine="exemple" /></>}
                  </dd>
                </div>
              );
            })}
          </dl>
        </>
      )}
      <div className="cn-veille-bloc">
        <div className="cn-veille-ligne">
          <Eye size={18} aria-hidden />
          <span className="cn-sp">Veille du prix, tous les 3 jours</span>
          <Bascule active={veille} onChange={p.onVeille} etiquette="Veille du prix, tous les 3 jours" />
        </div>
        {veille && !a.veille?.releveLe && <p className="cn-mut cn-veille-etat">demandée · pas encore relevée</p>}
      </div>
      {!p.choisi && p.onChoisir && (
        <>
          <button type="button" className="cn-action cn-large" onClick={p.onChoisir}><Check size={18} aria-hidden /> Choisir{a.vendeur ? ` · ${a.vendeur}` : ''}</button>
          <p className="cn-mut">Part dans À venir : {[a.nom, a.vendeur, prix ? `${prix} ${a.devise ?? 'CHF'}` : null, a.dispo].filter(Boolean).join(', ')}, avec le pourquoi.</p>
        </>
      )}
    </article>
  );
}

/** Piste des valeurs connues (« la plus basse des 5 ») : un rond par article, le sien plein. */
function Piste({ valeurs, moi, sens }: { valeurs: number[]; moi: number; sens: string }) {
  const tri = [...valeurs].sort((x, y) => x - y);
  const min = tri[0], max = tri[tri.length - 1];
  const pos = (v: number) => (max === min ? 0 : ((v - min) / (max - min)) * 100);
  const meilleur = sens === 'moins' ? min : sens === 'plus' ? max : null;
  const dit = meilleur === moi ? (sens === 'moins' ? `la plus basse des ${valeurs.length}` : `la plus haute des ${valeurs.length}`) : null;
  return (
    <div className="cn-piste" aria-hidden>
      <span className="cn-piste-trait" />
      {tri.map((v, i) => <span key={i} className={`cn-piste-rond${v === moi ? ' cn-piste-moi' : ''}`} style={{ left: `${pos(v)}%` }} />)}
      <span className="cn-piste-legende"><span className="cn-mut">{dit ?? ''}</span><span className="cn-mono cn-mut">{sens === 'moins' ? max : min}</span></span>
    </div>
  );
}
