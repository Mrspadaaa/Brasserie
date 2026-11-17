/**
 * La carte d'article (R04, figés p2:h03-5 et p2:h06-5 ; CARNET-CARTE-MUETTE) : image ou picto, nom, d'où il vient, prix,
 * la mesure qui compte pour le critère avec son rang, l'état de lecture. La bascule de veille vit dans la fiche (R31, MISSION
 * « Rangé derrière ») : la carte dit seulement « veille demandée » quand il l'a allumée.
 * Variante `complete` (R17, g5:v06-10) : la carte rangée après un lien, avec sa ligne « Veille du prix, tous les 3 jours »
 * (même libellé, même place que la maquette ; éteinte à la naissance) et « ✻ lu sur la page : … · tient 80 °C : oui ».
 * Une valeur inconnue n'est jamais rendue 0 : elle est absente, ou dite « non publié ».
 */
import React from 'react';
import { ExternalLink, Eye, Link2, Package } from 'lucide-react';
import { libelleEcarte } from '../../domain/carnets/comparer';
import { montant, Provenance, rangTexte, valeurTexte, type ArticleV, type CritereV } from './EtatIA';

export interface CarteArticleProps {
  article: ArticleV;
  /** Le critère qui range (sa caractéristique donne la mesure affichée). */
  critere?: CritereV;
  rang?: number;
  faconNom?: string;
  /** Écarté : grisé, à la fin, avec sa raison (D-52). */
  ecarte?: { raison: string };
  variante?: 'liste' | 'complete';
  /** `complete` : ce que la page a donné, et le verdict sur le critère (« tient 80 °C : oui »). */
  luSurPage?: string[];
  verdict?: string;
  onOuvrir?: () => void;
  onVeille?: (active: boolean) => void;
}

export function mesureCritere(article: ArticleV, critere?: CritereV): { texte: string; unite?: string } | null {
  const c = critere?.caracteristique;
  if (!c) return null;
  const v = article.valeurs[c.nom];
  const t = valeurTexte(v);
  if (t === null) return null;
  return { texte: t, unite: v?.unite ?? c.unite };
}

function Vignette({ article }: { article: ArticleV }) {
  if (article.photo) return <img className="cn-vignette" src={article.photo} alt="" loading="lazy" />;
  return <span className="cn-vignette cn-vignette-vide" aria-hidden>{article.lecture === 'illisible' ? <Link2 size={22} /> : <Package size={22} />}</span>;
}

export function CarteArticle(p: CarteArticleProps) {
  const a = p.article;
  const prix = montant(a.prixCentimes);
  const devise = a.devise ?? 'CHF';
  const mesure = mesureCritere(a, p.critere);
  const carac = p.critere?.caracteristique;
  const veilleDemandee = !!a.veille?.active;

  if (a.lecture === 'illisible' || (a.lecture !== 'lue' && !a.nom)) {
    const enCours = a.lecture === 'en-cours' || a.lecture === 'a-lire';
    return (
      <div className="cn-article" data-lecture={a.lecture}>
        <span className="cn-rang cn-rang-vide" aria-label="sans rang">?</span>
        <Vignette article={a} />
        <div className="cn-article-tx">
          <b>{enCours ? (a.domaine ?? 'Lien') : 'Lien sans aperçu'}</b>
          <span className="cn-mut">{a.domaine ? `${a.domaine} · ` : ''}{enCours ? 'lecture…' : 'page non lue'}</span>
        </div>
        {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
      </div>
    );
  }

  const origine = [a.vendeur, a.pays].filter(Boolean).join(' · ') || a.domaine;
  const corps = (
    <>
      {p.rang !== undefined && !p.ecarte && <span className={`cn-rang${p.rang === 1 ? ' cn-rang-1' : ''}`}>{p.rang}</span>}
      <Vignette article={a} />
      <div className="cn-article-tx">
        <span className="cn-ligne"><b className="cn-sp">{a.nom}</b>{prix && <span className="cn-mono cn-prix">{prix}</span>}</span>
        <span className="cn-mut">
          {p.ecarte ? libelleEcarte(p.ecarte.raison) : [origine, a.dispo].filter(Boolean).join(' · ')}
          {a.origine === 'exemple' && <> <Provenance origine="exemple" /></>}
        </span>
        <span className="cn-ligne cn-article-pied">
          {mesure && carac ? (
            <span className="cn-pastille cn-pastille-vert"><span className="cn-mono">{mesure.texte}</span>{mesure.unite ? ` ${mesure.unite}` : ''}{p.rang ? ` · ${rangTexte(p.rang)}` : ''}</span>
          ) : carac ? (
            <span className="cn-pastille cn-pastille-att">{carac.nom} non publié</span>
          ) : p.faconNom ? <span className="cn-mut">{p.faconNom}</span> : null}
          <span className="cn-sp" />
          {veilleDemandee && <span className="cn-veille"><Eye size={16} aria-hidden /> veille demandée</span>}
        </span>
      </div>
    </>
  );

  if (p.variante === 'complete') {
    return (
      <div className="cn-article-complet">
        <div className="cn-article">{corps}</div>
        <div className="cn-veille-ligne">
          <Eye size={18} aria-hidden />
          <span className="cn-sp">Veille du prix, tous les 3 jours</span>
          <Bascule active={veilleDemandee} onChange={v => p.onVeille?.(v)} etiquette="Veille du prix, tous les 3 jours" />
        </div>
        {veilleDemandee && !a.veille?.releveLe && <p className="cn-mut cn-veille-etat">demandée · pas encore relevée</p>}
        {(p.luSurPage?.length || p.verdict) && (
          <p className="cn-mut cn-lu"><Provenance origine={a.origine === 'exemple' ? 'ia' : 'page'} /> lu sur la page : {p.luSurPage?.join(', ')}{p.verdict ? ` · ${p.verdict}` : ''}</p>
        )}
      </div>
    );
  }

  return p.onOuvrir
    ? <button type="button" className={`cn-article${p.ecarte ? ' cn-ecarte' : ''}`} onClick={p.onOuvrir}>{corps}</button>
    : <div className={`cn-article${p.ecarte ? ' cn-ecarte' : ''}`}>{corps}</div>;
}

/** Interrupteur (role switch), cible 44 px ; éteint par défaut, seul son toucher l'allume (R31). */
export function Bascule({ active, onChange, etiquette }: { active: boolean; onChange: (v: boolean) => void; etiquette: string }) {
  return (
    <button type="button" role="switch" aria-checked={active} aria-label={etiquette} className="cn-bascule" onClick={() => onChange(!active)}>
      <span className="cn-bascule-piste"><span className="cn-bascule-rond" /></span>
    </button>
  );
}
