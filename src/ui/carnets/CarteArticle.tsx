/**
 * La carte d'article (R04, figés p2:h03-5 et p2:h06-5 ; CARNET-CARTE-MUETTE) : photo ou picto de l'objet (pictos.tsx), nom, d'où il
 * vient, prix avec sa devise, la mesure qui compte pour le critère avec son rang, l'état de lecture.
 * - `CarteArticle` (liste) : la ligne compacte ; la bascule de veille vit dans la fiche (R31) et la carte dit « veille demandée ».
 * - Variante `complete` (R17, g5:v06-10) : la carte rangée après un lien. Photo, nom, « domaine · pays · exemple », les
 *   caractéristiques lues **avec leur valeur** (« 40 L/min · jusqu'à 90 °C »), « 690 CHF » et la dispo en pastille ; la ligne « Veille du
 *   prix, tous les 3 jours » (éteinte à la naissance) ; « lu sur la page : nom, prix, photo, débit · tient 80 °C : oui », le verdict
 *   écrit une fois.
 * - `CarteClassee` (R04, h03-5) : la grande carte de la feuille « Articles » : rang sur la photo, nom, vendeur · pays, prix et délai,
 *   la valeur du critère en gros, la réglette de la caractéristique et « Veiller ».
 * Une valeur inconnue n'est jamais rendue 0 : elle est absente, ou dite « non publié ».
 */
import React from 'react';
import { ExternalLink, Eye, Link2 } from 'lucide-react';
import { libelleEcarte } from '../../domain/carnets/comparer';
import { dispoDe } from '../../domain/carnets/modele';
import { montant, Provenance, rangTexte, texteSelonNom, valeurTexte, type ArticleV, type CritereV, type ValeurV } from './EtatIA';
import { VignetteObjet } from './pictos';
import { detailPrix, PrixPastille, PrixRenduDetail, PrixTexte } from './PrixPastille';

export interface CarteArticleProps {
  article: ArticleV;
  /** D447 : le taux EUR→CHF (facture ou posé) ; sans lui, le cours du jour lu avec la page. */
  taux?: number;
  /** Le critère qui range (sa caractéristique donne la mesure affichée). */
  critere?: CritereV;
  rang?: number;
  faconNom?: string;
  /** Titre du carnet : dernier recours du picto. */
  carnetTitre?: string;
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
  const t = texteSelonNom(c.nom, valeurTexte(v), v?.valeur);
  if (t === null) return null;
  return { texte: t, unite: v?.unite ?? c.unite };
}

const dispoClasse = (d: string) => (/stock/i.test(d) ? 'cn-pastille-vert' : 'cn-pastille-att');

/** Un prix lisible : « 690 CHF » ; inconnu : null. */
function prixAvecDevise(a: Pick<ArticleV, 'prixCentimes' | 'devise'>): string | null {
  const m = montant(a.prixCentimes);
  return m ? `${m} ${a.devise ?? 'CHF'}` : null;
}

/** Marqué « exemple » : un article du banc ou de la fixture (origine, valeurs, ou lien vers le domaine réservé `.invalid`). */
export function estExemple(a: ArticleV): boolean {
  return a.origine === 'exemple' || Object.values(a.valeurs).some(v => v.origine === 'exemple') || /\.invalid$/i.test(a.domaine ?? '');
}

/** Le nom de la caractéristique que dit le verdict (« tient 80 °C : oui » → « tient 80 °C ») ; null sans verdict. */
function sujetDuVerdict(verdict?: string): string | null {
  if (!verdict) return null;
  const i = verdict.lastIndexOf(' : ');
  return i > 0 ? verdict.slice(0, i).trim() : null;
}

/** « 40 L/min · jusqu'à 90 °C » : chaque valeur lue avec son unité ; une valeur sans unité porte son nom ; le sujet du verdict exclu. */
export function valeursLues(valeurs: Record<string, ValeurV>, sauf?: string | null): string[] {
  return Object.entries(valeurs).flatMap(([nom, v]) => {
    if (sauf && nom === sauf) return [];
    /* un nombre lu en texte (« 2000 ») se dit comme un nombre (« 2 000 ») */
    const n = typeof v.valeur === 'string' ? nombreValeur(v) : null;
    const t = texteSelonNom(nom, valeurTexte(n !== null ? { ...v, valeur: n } : v), v.valeur);
    if (t === null) return [];
    if (typeof v.valeur === 'boolean') return [`${nom} : ${t}`];
    /* CRN-17 : un critère oui-non lu en texte se dit par son verbe (h05-3 « capte la buée ») : « tient 80 °C », jamais « tient 80 °C oui » */
    if (!v.unite && /^oui$/i.test(t.trim())) return [nom];
    if (!v.unite && /^non$/i.test(t.trim())) return [`pas : ${nom}`];
    return [v.unite ? `${t} ${v.unite}` : `${nom} ${t}`];
  });
}

/** T30-8 : combien de caractéristiques la carte rangée montre au plus (la fiche montre le reste). */
export const VALEURS_VUES_MAX = 3;

/**
 * T30-8 : « lu sur la page : nom, prix, photo, 8 caractéristiques » : les noms des caractéristiques que la carte montre déjà (ou que la fiche porte)
 * ne se répètent pas ; ils se comptent. Un seul nom se dit « 1 caractéristique ».
 */
export function luEnBref(lu: readonly string[], valeurs: Record<string, unknown>): string[] {
  const noms = new Set(Object.keys(valeurs));
  const champs = lu.filter(x => !noms.has(x));
  const n = lu.length - champs.length;
  return n > 0 ? [...champs, `${n} caractéristique${n > 1 ? 's' : ''}`] : champs;
}

/**
 * Ce que la page a donné (g5:v06-10, « lu sur la page : nom, prix, photo, débit, °C ») quand le geste ne le passe pas : lu sur
 * l'article même. Un champ ne se dit que s'il existe ; les caractéristiques se nomment (« débit »), celle du verdict exclue.
 */
export function luDeLArticle(a: ArticleV, sauf?: string | null): string[] {
  if (a.lecture !== 'lue') return [];
  const champs: string[] = [];
  if (a.nom?.trim()) champs.push('nom');
  if (montant(a.prixCentimes)) champs.push('prix');
  if (a.photo) champs.push('photo');
  for (const [nom, v] of Object.entries(a.valeurs)) {
    if (sauf && nom === sauf) continue;
    if (v.origine === 'vous' || valeurTexte(v) === null) continue;
    champs.push(nom);
  }
  return champs;
}

/** Le verdict de l'article sur le critère oui-non (« tient 80 °C : oui ») ; null si la valeur est inconnue (jamais « non » par défaut). */
export function verdictDe(a: ArticleV, critere?: CritereV): string | null {
  const c = critere?.caracteristique;
  if (!c || c.sens !== 'oui-non') return null;
  const v = a.valeurs[c.nom];
  if (!v || typeof v.valeur !== 'boolean') return null;
  return `${c.nom} : ${v.valeur ? 'oui' : 'non'}`;
}

function Vignette({ article, faconNom, carnetTitre, classe }: { article: ArticleV; faconNom?: string; carnetTitre?: string; classe?: string }) {
  if (!article.photo && article.lecture !== 'lue' && !article.nom?.trim()) {
    return <span className={`cn-vignette cn-vignette-lien${classe ? ` ${classe}` : ''}`} aria-hidden><Link2 size={22} /></span>;
  }
  return <VignetteObjet photo={article.photo} mots={[article.nom, faconNom, carnetTitre]} classe={classe} />;
}

export function CarteArticle(p: CarteArticleProps) {
  const a = p.article;
  const prix = montant(a.prixCentimes);
  const mesure = mesureCritere(a, p.critere);
  const carac = p.critere?.caracteristique;
  const veilleDemandee = !!a.veille?.active;

  /* test en ligne 2 (bloquant 6) : un article que l'IA a nommé garde son nom, sa page lue ou non ; seul un lien sans nom est « sans aperçu » */
  if (a.lecture !== 'lue' && !a.nom?.trim()) {
    const enCours = a.lecture === 'en-cours' || a.lecture === 'a-lire';
    return (
      <div className="cn-article" data-lecture={a.lecture}>
        <span className="cn-rang cn-rang-vide" aria-label="sans rang">?</span>
        <Vignette article={a} />
        <div className="cn-article-tx">
          <b>{enCours ? (a.domaine ?? 'Lien') : a.lecture === 'introuvable' ? 'Lien introuvable' : 'Lien sans aperçu'}</b>
          <span className="cn-mut">{a.domaine ? `${a.domaine} · ` : ''}{enCours ? 'lecture…' : a.lecture === 'introuvable' ? 'ne mène plus à la fiche : rien n’a été lu' : 'page non lue'}</span>
        </div>
        {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
      </div>
    );
  }

  if (p.variante === 'complete') {
    /* g5:v06-10 : le verdict écrit une fois (pas dans les valeurs, pas dans « lu sur la page ») */
    /* sans `luSurPage` ni `verdict` du geste, ils se lisent sur l'article (critique 5, n° 6 : la carte ne maigrit jamais) */
    const verdict = p.verdict ?? verdictDe(a, p.critere) ?? undefined;
    const sujet = sujetDuVerdict(verdict);
    const valeurs = valeursLues(a.valeurs, sujet);
    const lu = luEnBref((p.luSurPage ?? luDeLArticle(a, sujet)).filter(x => x !== sujet), a.valeurs);
    const vues = valeurs.slice(0, VALEURS_VUES_MAX), reste = valeurs.length - vues.length;
    const origine = [a.domaine ?? a.vendeur, a.pays].filter(Boolean).join(' · ');
    const haut = (
      <>
        <Vignette article={a} faconNom={p.faconNom} carnetTitre={p.carnetTitre} classe="cn-vignette-grande" />
        <span className="cn-article-tx">
          <b className="cn-article-nom">{a.nom}</b>
          {(origine || estExemple(a)) && <span className="cn-mut">{origine}{estExemple(a) && <> <Provenance origine="exemple" /></>}</span>}
          {valeurs.length > 0 && <span className="cn-encre-2 cn-mono-chiffres cn-valeurs-lues">{vues.join(' · ')}{reste > 0 ? <span className="cn-mut"> · +{reste}</span> : null}</span>}
          {(prix || dispoDe(a)) && (
            <span className="cn-ligne cn-article-pied">
              {prix && <PrixTexte a={a} taux={p.taux} />}
              {dispoDe(a) && <span className={`cn-pastille ${dispoClasse(dispoDe(a)!)}`}>{dispoDe(a)}</span>}
            </span>
          )}
          {prix && detailPrix(a, p.taux) && <span className="cn-mut">{detailPrix(a, p.taux)}</span>}
        </span>
      </>
    );
    return (
      <div className="cn-article-complet">
        {p.onOuvrir
          ? <button type="button" className="cn-article cn-article-grand" onClick={p.onOuvrir}>{haut}</button>
          : <div className="cn-article cn-article-grand">{haut}</div>}
        <div className="cn-veille-ligne">
          <Eye size={18} aria-hidden />
          <span className="cn-sp">Veille du prix, tous les 3 jours</span>
          <Bascule active={veilleDemandee} onChange={v => p.onVeille?.(v)} etiquette="Veille du prix, tous les 3 jours" />
        </div>
        {veilleDemandee && !a.veille?.releveLe && <p className="cn-mut cn-veille-etat">demandée · pas encore relevée</p>}
        {(lu.length > 0 || verdict) && (
          <p className="cn-mut cn-lu"><Provenance origine={estExemple(a) ? 'ia' : 'page'} /> lu sur la page{lu.length ? ` : ${lu.join(', ')}` : ''}{verdict ? <> · <b className="cn-encre">{verdict}</b></> : null}</p>
        )}
      </div>
    );
  }

  const origine = [a.vendeur, a.pays].filter(Boolean).join(' · ') || a.domaine;
  const corps = (
    <>
      {p.rang !== undefined && !p.ecarte && <span className={`cn-rang${p.rang === 1 ? ' cn-rang-1' : ''}`}>{p.rang}</span>}
      <Vignette article={a} faconNom={p.faconNom} carnetTitre={p.carnetTitre} />
      <div className="cn-article-tx">
        <span className="cn-ligne"><b className="cn-sp">{a.nom}</b>{prix && <PrixTexte a={a} taux={p.taux} muet />}</span>
        <span className="cn-mut">
          {p.ecarte ? libelleEcarte(p.ecarte.raison) : [origine, dispoDe(a), prix ? detailPrix(a, p.taux) : null].filter(Boolean).join(' · ')}
          {a.origine === 'exemple' && <> <Provenance origine="exemple" /></>}
        </span>
        {/* critique 5, n° 6 : les caractéristiques lues, avec leur unité (« 40 L/min · jusqu'à 90 °C »), celle du critère exclue */}
        {(() => { const autres = valeursLues(a.valeurs, carac?.nom); return autres.length ? <span className="cn-encre-2 cn-valeurs-lues">{autres.join(' · ')}</span> : null; })()}
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

  return p.onOuvrir
    ? <button type="button" className={`cn-article${p.ecarte ? ' cn-ecarte' : ''}`} onClick={p.onOuvrir}>{corps}</button>
    : <div className={`cn-article${p.ecarte ? ' cn-ecarte' : ''}`}>{corps}</div>;
}

export interface CarteClasseeProps {
  article: ArticleV;
  rang?: number | null;
  /** La caractéristique qui classe (nom, unité, sens), et les valeurs connues des articles en lice pour la réglette. */
  carac?: { nom: string; unite?: string; sens: string };
  bornes?: { min: number; max: number } | null;
  faconNom?: string;
  carnetTitre?: string;
  ecarte?: { raison: string };
  onOuvrir: () => void;
  onVeille?: (active: boolean) => void;
  /** D421 : le taux EUR→CHF (Finances, sinon posé une fois) et sa pose ; sans taux, l'euro se dit en euros. */
  taux?: number;
  onTaux?: (t: number) => void;
}

/** Nombre d'une valeur (oui-non exclu) ; null si inconnue. */
export function nombreValeur(v?: ValeurV): number | null {
  if (!v || typeof v.valeur === 'boolean') return null;
  if (typeof v.valeur === 'number') return Number.isFinite(v.valeur) ? v.valeur : null;
  const n = Number(String(v.valeur).replace(/[\s  ']/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** La grande carte de la feuille « Articles » (h03-5) : un toucher l'ouvre ; « Veiller » bascule la veille sans l'ouvrir. */
export function CarteClassee(p: CarteClasseeProps) {
  const a = p.article;
  const v = p.carac ? a.valeurs[p.carac.nom] : undefined;
  const t = valeurTexte(v);
  const n = nombreValeur(v);
  const pos = n !== null && p.bornes ? (p.bornes.max === p.bornes.min ? 0 : (n - p.bornes.min) / (p.bornes.max - p.bornes.min)) : null;
  const [rendu, setRendu] = React.useState(false);
  const qui = [a.vendeur ?? a.domaine, a.pays].filter(Boolean).join(' · ');
  return (
    <div className={`cn-classee${p.ecarte ? ' cn-ecarte' : ''}`}>
      <button type="button" className="cn-classee-corps" onClick={p.onOuvrir} aria-label={`${a.nom ?? 'Article'}${p.rang ? `, ${rangTexte(p.rang)}` : ''}`}>
        <span className="cn-classee-photo">
          <Vignette article={a} faconNom={p.faconNom} carnetTitre={p.carnetTitre} classe="cn-vignette-grande" />
          {p.rang ? <span className={`cn-rang cn-classee-rang${p.rang === 1 ? ' cn-rang-1' : ''}`}>{p.rang}</span> : null}
        </span>
        <span className="cn-classee-tx">
          <b className="cn-deux-lignes">{a.nom}</b>
          {/* « exemple » se dit une fois, au pied de la feuille (h06-5 « Vendeurs, prix et photos : exemple ») */}
          <span className="cn-mut">{p.ecarte ? libelleEcarte(p.ecarte.raison) : qui}</span>
          {dispoDe(a) && <span><span className={`cn-dispo${/stock/i.test(dispoDe(a)!) ? ' cn-vert' : ' cn-att'}`}>{dispoDe(a)}</span></span>}
        </span>
        <span className="cn-classee-reserve" aria-hidden />
      </button>
      {/* B1 : la pastille de prix à droite (hors du bouton de la carte : un bouton ne s'emboîte pas) */}
      <span className="cn-classee-prix"><PrixPastille article={a} taux={p.taux} onTaux={p.onTaux} ouvert={rendu} onBascule={() => setRendu(x => !x)} onOuvrir={p.onOuvrir} /></span>
      {rendu && <PrixRenduDetail article={a} taux={p.taux} onTaux={p.onTaux} />}
      <div className="cn-classee-pied">
        {t !== null ? <span className="cn-chip-valeur" title={p.carac?.nom}><span className="cn-mono">{t}</span>{(v?.unite ?? p.carac?.unite) ? <span> {v?.unite ?? p.carac?.unite}</span> : null}</span>
          : p.carac ? <span className="cn-mut cn-classee-carac">{p.carac.nom} : non publié</span> : null}
        {t !== null && p.carac && <span className="cn-mut cn-classee-carac">{p.carac.nom}</span>}
        <span className="cn-reglette" aria-hidden>
          {pos !== null && <><span className="cn-reglette-plein" style={{ width: `${Math.round(pos * 100)}%` }} /><span className="cn-reglette-rond" style={{ left: `${Math.round(pos * 100)}%` }} /></>}
        </span>
        <span>Veiller</span>
        <Bascule active={!!a.veille?.active} onChange={x => p.onVeille?.(x)} etiquette={`Veiller ${a.nom ?? ''}`.trim()} />
      </div>
    </div>
  );
}

/** Interrupteur (role switch), cible 44 px ; éteint par défaut, seul son toucher l'allume (R31). */
export function Bascule({ active, onChange, etiquette }: { active: boolean; onChange: (v: boolean) => void; etiquette: string }) {
  return (
    <button type="button" role="switch" aria-checked={active} aria-label={etiquette} className="cn-bascule" onClick={() => onChange(!active)}>
      <span className="cn-bascule-piste"><span className="cn-bascule-rond" /></span>
    </button>
  );
}
