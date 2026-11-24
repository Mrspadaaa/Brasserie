/** La feuille des cartes du carnet ouvert (R04, h03-5), sortie de CarnetOuvert.tsx. */
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { comptesCarnet, pluriel } from '../../domain/carnets/comptes';
import { CarteClassee, estExemple, nombreValeur } from './CarteArticle';
import { teteDeClassement, type TableauV } from './Comparer';
import { Provenance, type ArticleV, type ContenuCarnetV } from './EtatIA';
import { colonnesCarnet, LigneARelire, lignesClassees } from './TableauCarnet';

export function FeuilleCartes({ carnet: k, titre, tableau, aRelire, onFermer, onOuvrir, onVeille, taux, onTaux }: { taux?: number; onTaux?: (t: number) => void; carnet: ContenuCarnetV; titre: string; tableau: TableauV; aRelire: ArticleV[]; onFermer: () => void; onOuvrir: (id: string) => void; onVeille?: (id: string, active: boolean) => void }) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);
  const lignes = lignesClassees(tableau, aRelire);
  const col = colonnesCarnet(tableau).find(c => c.cle !== '__prix');
  const carac = col ? { nom: col.nom, ...(col.unite ? { unite: col.unite } : {}), sens: col.sens } : undefined;
  const art = (id: string) => k.articles.find(a => a.id === id);
  const connues = col ? lignes.filter(l => !l.ecarte).map(l => nombreValeur(art(l.articleId)?.valeurs[col.nom])).filter((x): x is number => x !== null) : [];
  const bornes = connues.length > 1 ? { min: Math.min(...connues), max: Math.max(...connues) } : null;
  const critere = col ? k.criteres.find(cr => cr.caracteristique?.nom === col.nom) : undefined;
  return (
    <div className="cn-voile" onClick={onFermer}>
      <section className="cn-feuille-cartes" role="dialog" aria-modal="true" aria-label={`Articles · ${k.articles.length}`} onClick={e => e.stopPropagation()}>
        <span className="cn-poignee" aria-hidden />
        <div className="cn-feuille-cartes-tete">
          <h3 className="cn-sp"><b>Articles · {k.articles.length}</b> {comptesCarnet(k).facons > 0 && <span className="cn-mut">{pluriel(comptesCarnet(k).facons, 'façon')}</span>}</h3>
          <button type="button" className="cn-lien cn-fermer" onClick={onFermer}><X size={18} aria-hidden /> Fermer</button>
        </div>
        {/* C48-3 : le même critère en tête que Comparer (`teteDeClassement`, une seule fonction, celle du calcul du rang) */}
        {carac && <p className="cn-mut">Classés par ce qui compte : <b className="cn-encre">{teteDeClassement(tableau, critere as never)}</b></p>}
        <div className="cn-classees">
          {lignes.map(l => {
            const a = art(l.articleId);
            if (!a) return null;
            return <CarteClassee key={a.id} article={a} rang={l.ecarte ? null : l.rang} carac={carac} bornes={bornes} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} carnetTitre={titre}
              {...(l.ecarte ? { ecarte: l.ecarte } : {})} onOuvrir={() => onOuvrir(a.id)} onVeille={v => onVeille?.(a.id, v)} taux={taux} onTaux={onTaux} />;
          })}
          {aRelire.map(a => <div key={a.id} className="cn-classee cn-classee-relire"><LigneARelire article={a} /></div>)}
        </div>
        {k.articles.some(estExemple) && <p className="cn-mut">Vendeurs, prix et valeurs : <Provenance origine="exemple" /></p>}
      </section>
    </div>
  );
}
