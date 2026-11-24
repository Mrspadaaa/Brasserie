/** La feuille des cartes du carnet ouvert (R04, h03-5), sortie de CarnetOuvert.tsx. */
import React, { useEffect, useState } from 'react';
import { ArrowRightToLine, X } from 'lucide-react';
import { comptesCarnet, pluriel } from '../../domain/carnets/comptes';
import { CarteClassee, CarteMatiere, estExemple, Glisse, nombreValeur } from './CarteArticle';
import { teteDeClassement, type TableauV } from './Comparer';
import { Provenance, type ArticleV, type ContenuCarnetV } from './EtatIA';
import { colonnesCarnet, LigneARelire, lignesClassees, usePour } from './TableauCarnet';
import { aDesPaliers, classerAuKilo, estCarnetDeMatiere, poserQuantitePour, type ArticleRegle } from './tableauRegles';

/**
 * `onRetirer`, `onDeplacer` et `carnetsVers` (facultatifs, ceux de CarnetOuvertProps) : avec eux, chaque carte d'un carnet de matière glisse vers la gauche
 * (Déplacer, Retirer, maquettes2/v01 « articles ») ; sans eux, la feuille est celle d'avant.
 */
export function FeuilleCartes({ carnet: k, titre, tableau: tableauBrut, aRelire, onFermer, onOuvrir, onVeille, taux, onTaux, onRetirer, onDeplacer, carnetsVers }: {
  taux?: number; onTaux?: (t: number) => void; carnet: ContenuCarnetV; titre: string; tableau: TableauV; aRelire: ArticleV[]; onFermer: () => void; onOuvrir: (id: string) => void; onVeille?: (id: string, active: boolean) => void;
  onRetirer?: (articleId: string) => void; onDeplacer?: (articleId: string, vers: string) => void; carnetsVers?: readonly { id: string; titre: string }[];
}) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);
  const [pour] = usePour(titre);
  const [vers, setVers] = useState<string | null>(null);
  /* R53 (C66-3) : un seul classement au kilo rendu pour tout le carnet : la carte « 1re » est la moins chère à la quantité d'achat */
  const tableau = classerAuKilo(tableauBrut, k.articles as never, pour, taux);
  const lignes = lignesClassees(tableau, aRelire);
  /* les cartes du conditionnement (maquette v01) ne naissent que là où le prix change avec la quantité ; ailleurs la carte classée d'avant */
  const regle = k.articles as unknown as ArticleRegle[];
  const matiere = estCarnetDeMatiere(regle) && aDesPaliers(regle);
  const col = colonnesCarnet(tableau).find(c => c.cle !== '__prix');
  const carac = col ? { nom: col.nom, ...(col.unite ? { unite: col.unite } : {}), sens: col.sens } : undefined;
  const art = (id: string) => k.articles.find(a => a.id === id);
  const connues = col ? lignes.filter(l => !l.ecarte).map(l => nombreValeur(l.cellules[col.nom] as never)).filter((x): x is number => x !== null) : [];
  const bornes = connues.length > 1 ? { min: Math.min(...connues), max: Math.max(...connues) } : null;
  const critere = col ? k.criteres.find(cr => cr.caracteristique?.nom === col.nom) : undefined;
  const autres = carnetsVers ?? [];
  const glisse = !!onRetirer && k.articles.some(a => a.id !== k.choix?.articleId);
  return (
    <div className="cn-voile" onClick={onFermer}>
      <section className="cn-feuille-cartes" role="dialog" aria-modal="true" aria-label={`Articles · ${k.articles.length}`} onClick={e => e.stopPropagation()}>
        <span className="cn-poignee" aria-hidden />
        <div className="cn-feuille-cartes-tete">
          <h3 className="cn-sp"><b>Articles · {k.articles.length}</b> {comptesCarnet(k).facons > 0 && <span className="cn-mut">{pluriel(comptesCarnet(k).facons, 'façon')}</span>}</h3>
          <button type="button" className="cn-lien cn-fermer" onClick={onFermer}><X size={18} aria-hidden /> Fermer</button>
        </div>
        {/* C48-3 : le même critère en tête que Comparer (`teteDeClassement`, une seule fonction, celle du calcul du rang) */}
        {carac && !matiere && <p className="cn-mut">Classés par ce qui compte : <b className="cn-encre">{teteDeClassement(tableau, critere as never)}</b></p>}
        <div className="cn-classees">
          {lignes.map(l => {
            const a = art(l.articleId);
            if (!a) return null;
            /* le choix du carnet ne se retire pas d'ici : son choix se revoit d'abord (BL-3) */
            const actions = onRetirer && a.id !== k.choix?.articleId
              ? { onRetirer: () => { onFermer(); onRetirer(a.id); }, ...(onDeplacer && autres.length > 0 ? { onDeplacer: () => setVers(vers === a.id ? null : a.id) } : {}) }
              : undefined;
            const carte = matiere
              ? <CarteMatiere article={a} rang={l.ecarte ? null : l.rang} taux={taux} pour={pour} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} carnetTitre={titre}
                  {...(l.ecarte ? { ecarte: l.ecarte } : {})} onOuvrir={() => onOuvrir(a.id)} onPour={kg => poserQuantitePour(titre, kg)} {...(actions ? { actions } : {})} />
              : (
                <Glisse nom={a.nom ?? 'Article'} actions={actions}>
                  <CarteClassee article={a} rang={l.ecarte ? null : l.rang} carac={carac} valeur={col ? (l.cellules[col.nom] as never) : undefined} bornes={bornes} {...(col?.cible !== undefined ? { cible: col.cible } : {})} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} carnetTitre={titre}
                    {...(l.ecarte ? { ecarte: l.ecarte } : {})} onOuvrir={() => onOuvrir(a.id)} onVeille={v => onVeille?.(a.id, v)} taux={taux} onTaux={onTaux} />
                </Glisse>
              );
            return (
              <React.Fragment key={a.id}>
                {carte}
                {vers === a.id && onDeplacer && (
                  <div className="cn-feuille cn-articles-vers" role="menu" aria-label={`Déplacer « ${a.nom ?? 'article'} » vers`}>
                    {autres.map(c => (
                      <button key={c.id} type="button" role="menuitem" className="cn-feuille-item cn-feuille-vers" onClick={() => { setVers(null); onFermer(); onDeplacer(a.id, c.id); }}>
                        <ArrowRightToLine size={18} aria-hidden /> <span className="cn-mut">dans</span> {c.titre}
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}
          {aRelire.map(a => <div key={a.id} className="cn-classee cn-classee-relire"><LigneARelire article={a} /></div>)}
        </div>
        {glisse && <p className="cn-mut cn-glisse-aide">Glisse une carte vers la gauche : Déplacer, Retirer.</p>}
        {k.articles.some(estExemple) && <p className="cn-mut">Vendeurs, prix et valeurs : <Provenance origine="exemple" /></p>}
      </section>
    </div>
  );
}
