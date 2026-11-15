// c2a (choix du brasseur, 15.11) : « Créer un brassin » = la liste des recettes, deux chiffres, levure · dernier lot, pastille à trois traits et un mot.
// « Brasser » ouvre la feuille d1b (le dernier choix règle la date). Un brassin déjà prévu porte « Brasser LOT-xxx » et ouvre ce brassin.
import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Beer, Boxes, Download, FlaskConical, Pencil, ShoppingCart } from 'lucide-react';
import type { Batch, Recipe, StockItem } from '../../../types';
import { cartesCreer, phraseCuve, type CarteCreer, type Trait, type TriCreer } from './creerModel';
import { BeerStyleTag } from '../../BeerStyleTag';
import { styleCourt } from '../liste/listeModel';
import './creer.css';

/** Le picto de cuve de la maquette c2a (une cuve sur pieds), le même sur la ligne de cuve et dans le vide. */
export const PictoCuve = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h10v13a5 5 0 0 1-10 0z" /><path d="M7 8h10" /><path d="M10 21v1M14 21v1" /></svg>
);

const Traits = ({ t }: { t: Trait[] }) => (
  <span className="c2a-tr" aria-hidden="true">{t.map((x, i) => <u key={i} data-t={x} />)}</span>
);
const ARIA: Record<string, string> = { prête: 'Tout en stock', prévue: 'Un brassin est déjà prévu', 'à vérifier': 'Stock à vérifier' };

interface Props {
  recipes: Recipe[];
  batches: Batch[];
  stock: StockItem[];
  capaciteL?: number;
  maintenant?: number;
  onBrasser: (recipeId: string) => void;
  onOuvrirBrassin: (batch: Batch) => void;
  /** Importer, écrire ou partir d'une idée : l'assistant de recette actuel. */
  onNouvelleRecette: () => void;
}

export function ListeCreer({ recipes, batches, stock, capaciteL, maintenant, onBrasser, onOuvrirBrassin, onNouvelleRecette }: Props) {
  const [tri, setTri] = useState<TriCreer>('pretes');
  const { cartes, pretes, acompleter } = useMemo(() => cartesCreer(recipes, batches, stock, tri), [recipes, batches, stock, tri]);
  const cuve = useMemo(() => phraseCuve(batches, recipes.find((r) => r.volumeL > 0)?.volumeL ?? 0, capaciteL, maintenant), [batches, recipes, capaciteL, maintenant]);

  if (!recipes.length) {
    return (
      <div className="c2a-ecran">
        <h3 className="c2a-h1">Aucune recette</h3>
        <div className="c2a-vide">
          <p className="c2a-vide-t">Rien à brasser d'un toucher</p>
          <p className="c2a-vide-p">Brasser réserve le stock, met les manques aux achats et choisit un jour de cuve ; il lui faut une recette.</p>
          <div className="c2a-voies">
            <button type="button" className="c2a-btn c2a-primaire" onClick={onNouvelleRecette}><Download aria-hidden="true" />Importer une recette</button>
            <button type="button" className="c2a-btn" onClick={onNouvelleRecette}><Pencil aria-hidden="true" />Écrire une recette</button>
            <button type="button" className="c2a-btn" onClick={onNouvelleRecette}><FlaskConical aria-hidden="true" />Partir d'une idée de l'Atelier</button>
          </div>
          <div className="c2a-fant" aria-hidden="true">
            <h4>Ce que Brasser montrera</h4>
            <ul>
              <li><span className="c2a-ei"><Boxes /></span><span>Stock réservé</span></li>
              <li data-ton="attention"><span className="c2a-ei"><ShoppingCart /></span><span>Manques aux achats</span></li>
              <li><span className="c2a-ei"><PictoCuve /></span><span>Cuve libre</span></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="c2a-ecran">
      <div className="c2a-tete">
        <h3 className="c2a-h1"><span className="c2a-ok">{pretes} {pretes > 1 ? 'prêtes' : 'prête'}</span>{acompleter > 0 && <span className="c2a-att"> {acompleter} à compléter</span>}</h3>
        <div className="c2a-cnt"><b>{cartes.length}</b>{cartes.length > 1 ? 'recettes' : 'recette'}</div>
      </div>
      {cuve && <p className="c2a-cuve"><PictoCuve /><span><b>{cuve.gras}</b>{cuve.reste}</span></p>}
      <div className="c2a-tris" role="group" aria-label="Tri des recettes">
        <button type="button" className="c2a-sel" aria-pressed={tri === 'pretes'} onClick={() => setTri('pretes')}><ArrowUpDown aria-hidden="true" />Prêtes d'abord</button>
        <button type="button" className="c2a-sel" aria-pressed={tri === 'derniere'} onClick={() => setTri('derniere')}>Dernière brassée</button>
      </div>
      <div className="c2a-grille">
        {cartes.map((c: CarteCreer) => (
          <article key={c.id} className="c2a-rec" data-recette={c.nom}>
            <div className="c2a-rh">
              <span className="c2a-rn">{c.nom}</span>
              <span className="c2a-style" title={c.style}><BeerStyleTag style={styleCourt(c.style)} /></span>
              <span className="c2a-st" data-ton={c.ton} aria-label={`Stock : ${ARIA[c.mot] ?? 'il manque ' + c.mot}`}><Traits t={c.traits} />{c.mot}</span>
            </div>
            <div className="c2a-rp">
              <div className="c2a-rc">{c.chiffres.map((x) => <span key={x.nom}><small>{x.nom}</small><b>{x.valeur}</b></span>)}</div>
              <button type="button" className="c2a-btn c2a-brasser" onClick={() => (c.prevu ? onOuvrirBrassin(c.prevu) : onBrasser(c.id))}>
                <Beer aria-hidden="true" />{c.prevu ? `Brasser ${c.prevu.id}` : 'Brasser'}
              </button>
            </div>
            <p className="c2a-dern"><b className={c.levureManque ? 'c2a-att' : undefined}>{c.levure}</b> · {c.dernier}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
