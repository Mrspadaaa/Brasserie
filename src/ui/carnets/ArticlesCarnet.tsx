/** La rubrique Articles du carnet ouvert (R03, h05-3, h03-5), sortie de CarnetOuvert.tsx : une fonction de rendu, appelée en place. */
import { nomCourtSi } from '../../domain/carnets/titreCourt';
import type React from 'react';
import { ArrowRightToLine, ChevronDown, ChevronRight, Ellipsis, Tag } from 'lucide-react';
import type { comptesCarnet } from '../../domain/carnets/comptes';
import { CarteArticle } from './CarteArticle';
import { Provenance, type ArticleV, type CarnetV, type ContenuCarnetV, type CritereV, type FaconV } from './EtatIA';
import { LigneRangee } from './LigneRangee';
import { TableauCarnet, usePour } from './TableauCarnet';
import { aDesPaliers, estCarnetDeMatiere, QUANTITES_POUR, texteQuantite, type ArticleRegle } from './tableauRegles';
import type { Separation } from './ouvertCalculs';
import type { CarnetOuvertProps, RangeeV } from './carnetOuvertTypes';
import { liesParNbsp } from './insecable';

export interface ArticlesCarnetV {
  p: CarnetOuvertProps; c: CarnetV; k: ContenuCarnetV; n: ReturnType<typeof comptesCarnet>; neuf: boolean; picto: number;
  cartes: boolean; setCartes: (v: boolean) => void; r: RangeeV | null | undefined; critere: CritereV | undefined;
  articleRange: ArticleV | undefined; faconRange: FaconV | undefined; aRelire: ArticleV[]; sep: Separation | null;
  conclusion: { texte: string; retenir: string; onRetenir: () => void; ia: boolean } | null;
  /** BL-3 : le ⋯ de la ligne Articles ouvert ; `vers` : l'article dont on choisit le carnet d'arrivée. */
  gerer: boolean; setGerer: (v: boolean) => void; vers: string | null; setVers: (id: string | null) => void;
}

/**
 * BL-3 (banc réel de liens, 23.11) : un article arrivé dans le mauvais carnet ne se retirait ni ne se déplaçait une fois le bandeau parti.
 * Comme la ligne Critère (L-20), la ligne Articles a son ⋯ : chaque article, une fois, avec « Déplacer » (puis le carnet) et « Retirer ».
 * L'article retenu (le choix du carnet) ne se retire pas d'ici : son choix se revoit d'abord.
 */
function gererArticles({ p, k, gerer, setGerer, vers, setVers }: ArticlesCarnetV): React.ReactNode {
  if (!gerer || !p.onRetirerArticle) return null;
  const autres = p.carnetsVers ?? [];
  const fini = () => { setGerer(false); setVers(null); };
  return (
    <div className="cn-criteres-derriere cn-articles-gerer" role="list" aria-label="Articles">
      {k.articles.filter(a => a.id !== k.choix?.articleId).map(a => {
        const nom = a.nom ?? a.domaine ?? 'lien';
        return (
          <div key={a.id} role="listitem">
            <p className="cn-critere cn-critere-court cn-critere-retirable">
              <span className="cn-sp"><b>{liesParNbsp(nom)}</b>{a.domaine && a.nom ? <span className="cn-mut"> · {a.domaine}</span> : null}</span>
              {p.onDeplacerArticle && autres.length > 0 && (
                <button type="button" className="cn-lien" aria-expanded={vers === a.id} aria-label={`Déplacer l’article « ${nom} »`} onClick={() => setVers(vers === a.id ? null : a.id)}>Déplacer</button>
              )}
              <button type="button" className="cn-lien" aria-label={`Retirer l’article « ${nom} »`} onClick={() => { p.onRetirerArticle!(a.id); fini(); }}>Retirer</button>
            </p>
            {vers === a.id && (
              <div className="cn-feuille cn-articles-vers" role="menu" aria-label={`Déplacer « ${nom} » vers`}>
                {autres.map(c => (
                  <button key={c.id} type="button" role="menuitem" className="cn-feuille-item cn-feuille-vers" onClick={() => { p.onDeplacerArticle!(a.id, c.id); fini(); }}>
                    <ArrowRightToLine size={18} aria-hidden /> <span className="cn-mut">dans</span> {c.titre}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * La ligne d'en-tête de la maquette v01 : « [Articles 2] [Comparer] ········ pour [1 kg ⌄] ». Articles (noir) ouvre la feuille des cartes ; Comparer
 * ouvre Comparer ; « pour » est la quantité d'achat de référence d'un carnet de matière pesée dont un vendeur a plusieurs conditionnements
 * (le tableau et « Selon la quantité » la lisent). Absent quand il n'a pas de sens : jamais un réglage mort.
 */
function PastillesArticles({ n, k, titre, onCartes, onComparer, cartes }: { n: number; k: ContenuCarnetV; titre: string; onCartes: () => void; onComparer?: () => void; cartes: boolean }) {
  const [pour, poser] = usePour(titre);
  const regle = k.articles as unknown as ArticleRegle[];
  const avecPour = estCarnetDeMatiere(regle) && aDesPaliers(regle);
  return (
    <>
      <button type="button" className="cn-tete-bouton cn-seg-pastille" data-on aria-haspopup="dialog" aria-expanded={cartes} onClick={onCartes}><b>Articles</b> <span className="cn-mono cn-compte">{n}</span></button>
      <button type="button" className="cn-lien cn-comparer-lien cn-seg-pastille" onClick={onComparer}>Comparer</button>
      {avecPour && (
        <span className="cn-seg-droite">pour
          <label className="cn-pour"><span className="cn-cache">Quantité d’achat de référence</span>
            <select aria-label="Quantité d’achat de référence" value={pour} onChange={e => poser(Number(e.target.value))}>
              {QUANTITES_POUR.map(q => <option key={q} value={q}>{texteQuantite(q)}</option>)}
            </select><ChevronDown size={16} aria-hidden />
          </label>
        </span>
      )}
    </>
  );
}

/** C71-8 : la quantité choisie (R54, « 1 kg ») et son prix, pour la carte de l'article choisi seulement. */
const choisieDe = (k: ContenuCarnetV, id: string): { libelle: string; centimes: number } | undefined => {
  const ch = k.choix;
  return ch && ch.articleId === id && ch.quantite && typeof ch.prixCentimes === 'number' && ch.prixCentimes > 0 ? { libelle: ch.quantite.libelle, centimes: ch.prixCentimes } : undefined;
};

export function rubriqueArticles(v: ArticlesCarnetV): React.ReactNode {
  const { p, c, k, n, neuf, picto, cartes, setCartes, r, critere, articleRange, faconRange, aRelire, sep, conclusion, gerer, setGerer } = v;
  return (
    <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Articles">
        {k.articles.length === 0 ? (
          <p className="cn-rubrique-tete"><Tag size={picto} aria-hidden /> <b>Articles</b> <span className="cn-mut">· collez un lien</span></p>
        ) : (
          <>
            {/* Critique 6, n° 8 (R03, D-99, h05-3) : une seule ligne, « Articles 6 ⌄ · Comparer › ». Le compte est le total de
                `comptesCarnet` (lus et sans aperçu ensemble, n° 15) ; le lien sans aperçu se lit dans le tableau (« Lien sans aperçu ·
                Ouvrir »). P12 (h03-5) : toucher « Articles » ouvre la feuille des cartes. */}
            <div className="cn-rubrique-tete cn-tete-articles">
              {p.tableau ? <PastillesArticles n={n.articles} k={k} titre={c.title} onCartes={() => setCartes(true)} onComparer={p.onComparer} cartes={cartes} /> : (
                <><Tag size={18} aria-hidden /><b>Articles</b><span className="cn-mut cn-mono cn-compte">{n.articles}</span></>
              )}
              {p.onRetirerArticle && (
                <button type="button" className="cn-ico cn-articles-actions" aria-label="Articles, actions" aria-expanded={gerer} onClick={() => { setGerer(!gerer); v.setVers(null); }}><Ellipsis size={22} aria-hidden /></button>
              )}
            </div>
            {gererArticles(v)}
            {articleRange && r && !p.tableau && (
              <LigneRangee sorte="article" faconNom={nomCourtSi(faconRange?.nom)} rang={r.rang} phrase={r.phrase} onAnnuler={r.onAnnuler} onDeplacer={r.onDeplacer} versSuggere={r.versSuggere}>
                <CarteArticle article={articleRange} choisie={choisieDe(k, articleRange.id)} taux={p.taux} critere={critere} faconNom={nomCourtSi(faconRange?.nom)} carnetTitre={c.title} variante="complete" luSurPage={r.luSurPage} verdict={r.verdict} onVeille={v => p.onVeille?.(articleRange.id, v)} />
              </LigneRangee>
            )}
            {p.tableau ? (<>
              {/* n° 20 : la conclusion se colle aux façons en lice, avant l'écartée et le lien à relire */}
              <TableauCarnet taux={p.taux} carnet={k} titre={c.title} tableau={p.tableau} aRelire={aRelire} sep={sep} onOuvrir={p.onOuvrirArticle}
                conclusion={conclusion && (
                  <div className="cn-encart cn-separe" role="note">
                    {/* un nombre ne se sépare pas de son unité (« 80 °C » jamais coupé en fin de ligne) */}
                    <span className="cn-sp"><Provenance origine={conclusion.ia ? 'ia' : 'locale'} /> {conclusion.texte.replace(/(\d) (°C|m³\/h|L\/min|CHF|kg|cm|L)\b/g, (_, n: string, u: string) => `${n} ${u}`)}</span>
                    <button type="button" className="cn-action cn-action-vert" onClick={conclusion.onRetenir}>Retenir {conclusion.retenir}</button>
                  </div>
                )} />
              {/* tour 3, PCN-108 et 132 (G20, g5:v06-11) : au 2e article, le tableau est à l'écran avec l'article déposé dans ses
                  lignes ; « Article rangé ici · 2e · Annuler » dessous, sans carte complète qui pousserait le tableau sous la flottaison */}
              {articleRange && r && (
                <LigneRangee sorte="article" faconNom={nomCourtSi(faconRange?.nom)} rang={r.rang} phrase={r.phrase} onAnnuler={r.onAnnuler} onDeplacer={r.onDeplacer} versSuggere={r.versSuggere}>{null}</LigneRangee>
              )}
            </>) : (
              <div className="cn-cartes">
                {(() => {
                  /* n° 6 (g5:v06-10) : un seul article lu, la carte complète (valeurs avec unité, « lu sur la page : … », veille) */
                  const reste = k.articles.filter(a => a.id !== articleRange?.id);
                  const seul = !articleRange && reste.length === 1 && reste[0].lecture === 'lue' ? reste[0] : null;
                  if (seul) {
                    return (
                      <div className="cn-carte-complete">
                        <CarteArticle article={seul} choisie={choisieDe(k, seul.id)} taux={p.taux} critere={critere} faconNom={nomCourtSi(k.facons.find(f => f.id === seul.faconId)?.nom)} carnetTitre={c.title} variante="complete"
                          onOuvrir={() => p.onOuvrirArticle(seul.id)} onVeille={v => p.onVeille?.(seul.id, v)} />
                      </div>
                    );
                  }
                  return reste.map(a => (
                    <CarteArticle key={a.id} article={a} choisie={choisieDe(k, a.id)} taux={p.taux} critere={critere} carnetTitre={c.title} faconNom={nomCourtSi(k.facons.find(f => f.id === a.faconId)?.nom)} onOuvrir={() => p.onOuvrirArticle(a.id)} />
                  ));
                })()}
              </div>
            )}
          </>
        )}
      </section>
  );
}
