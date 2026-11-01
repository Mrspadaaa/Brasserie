import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Fermentable, FermentableKind, FermentableUse, StockItem } from '../../types';
import { Units } from '../../services/units';
import { proposerFermentables } from '../../domain/fermentables/proposition';
import { Bascule, Entree, Etoile, Plus, Sac } from './icones';
import { Input } from '../Input';
import { chercher, decouper, kgTxt, lireAjout, memeArticle, qteTxt, teinte, texteSurTeinte, type Candidat } from './modele';
import { chargerTypicite } from '../../domain/fermentables/typicite';

export interface DefFamille {
  label: string;
  use: FermentableUse;
  fermentability: number;
  ppg?: number;
  hint?: string;
  stock: string[];
  newCat: string;
}

export interface AjoutProps {
  famille: FermentableKind;
  familles: readonly FermentableKind[];
  defs: Record<FermentableKind, DefFamille>;
  onFamille: (k: FermentableKind) => void;
  stockItems: readonly StockItem[];
  fermentables: readonly Fermentable[];
  styleCode?: string | null;
  ebcVise?: number | null;
  ebcMax?: number | null;
  /** Ajoute (ou retrouve) la ligne de ce candidat ; `kg` est la masse tapée avec le nom (« cara 0,3 »), sinon `null`. */
  onChoisir: (c: Candidat, kg: number | null) => void;
  /** Crée l'article à stock zéro puis sa ligne (`onCreateStockItem` de l'app). */
  onCreer: (nom: string, kg: number | null) => void;
}

const QUAND: Record<FermentableUse, string> = { empatage: 'à l’empâtage', ebullition: 'à l’ébullition', fermentation: 'en fermentation, J+3' };

/** Ce que l'app écrit sous le nom : « 12,5 kg en stock » ou « stock épuisé » (D221). Un article inconnu du stock n'a pas de stock : ce n'est pas zéro. */
const stockTxt = (a?: StockItem) => (!a ? 'hors stock' : a.currentStock > 0 ? `${Units.format(a.currentStock, a.unit)} en stock` : 'stock épuisé');

export const Ajout: React.FC<AjoutProps> = ({ famille, familles, defs, onFamille, stockItems, fermentables, styleCode, ebcVise, ebcMax, onChoisir, onCreer }) => {
  const [valeur, setValeur] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [cible, setCible] = useState(0);
  const [flechee, setFlechee] = useState(false);
  // La table de typicité des styles (voie a1) arrive en morceau à part, sans bloquer l'ouverture : avant elle, la règle sans typicité ; à son arrivée, les tuiles se recalculent.
  // Aucune tuile n'est montrée avant la fin du chargement (réussi ou non) : un malt écarté par le style n'apparaît jamais une fraction de seconde.
  const [typicite, setTypicite] = useState(0);
  const [prete, setPrete] = useState(false);
  useEffect(() => {
    let vivant = true;
    chargerTypicite()
      .then(() => { if (vivant) setTypicite((v) => v + 1); })
      .catch(() => { /* hors ligne ou absente : tout reste inconnu, jamais 0 */ })
      .finally(() => { if (vivant) setPrete(true); });
    return () => { vivant = false; };
  }, []);
  const champ = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const rangee = useRef<HTMLDivElement | null>(null);
  const def = defs[famille];

  // Le rayon du stock de la famille (KIND_DEF[famille].stock), comme le sélecteur d'avant.
  const articles = useMemo(
    () => stockItems.filter((i) => def.stock.some((c) => i.category.toLowerCase() === c.toLowerCase())),
    [stockItems, def.stock],
  );
  const lignes = useMemo(
    () => fermentables.map((f, i) => ({ f, i })).filter(({ f }) => f.kind === famille),
    [fermentables, famille],
  );
  const doublons = useMemo(() => {
    const n = new Map<string, number>();
    articles.forEach((a) => { const k = a.name.trim().toLocaleLowerCase('fr'); n.set(k, (n.get(k) ?? 0) + 1); });
    return n;
  }, [articles]);

  const s = lireAjout(valeur);
  const t = s.nom;
  const on = ouvert || !!t;
  const trouves = useMemo(() => (t ? chercher(t, articles, lignes) : []), [t, articles, lignes]);
  const affiches = t ? trouves.slice(0, 6) : [];
  const propositions = useMemo(
    () => proposerFermentables({
      articles: articles as StockItem[],
      dejaLa: lignes.map(({ f }) => ({ name: f.name, stockItemRef: f.stockItemRef })),
      styleCode, ebcVise, ebcMax, max: 6,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [articles, lignes, styleCode, ebcVise, ebcMax, typicite],
  );
  const creer = t.length >= 2 && trouves.length === 0;
  const liste = t ? affiches : !prete ? [] : propositions.map((p): Candidat => ({ nom: p.article.name, rang: 1, article: p.article, ligne: -1 }));
  const iCible = Math.min(cible, Math.max(0, liste.length - 1));
  const nomCible = t.length >= 2 ? (trouves.length ? trouves[Math.min(cible, trouves.length - 1)].nom : t) : flechee && liste[iCible] ? liste[iCible].nom : '';

  // Les sacs du repos : une seule rangée, des sacs entiers (jamais un sac coupé au bord). Ceux qui ne tiennent pas dans la largeur passent à la ligne,
  // hors de la rangée (masquée) : trois à 390, cinq à 1280. Un sac masqué ne prend plus le focus.
  useLayoutEffect(() => {
    const r = rangee.current;
    if (!r) return;
    const mesurer = () => {
      const sacs = [...r.querySelectorAll<HTMLElement>('.fer-pu')];
      const haut = sacs[0]?.getBoundingClientRect().top ?? 0;
      for (const s of sacs) {
        const hors = s.getBoundingClientRect().top > haut + 2;
        if (hors) s.setAttribute('data-hors', '1'); else s.removeAttribute('data-hors');
        s.tabIndex = hors ? -1 : 0;
      }
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(r);
    return () => ro.disconnect();
  }, [on, prete, propositions]);

  const reinit = () => { setValeur(''); setCible(0); setFlechee(false); };
  const choisir = (c: Candidat, kg: number | null) => { reinit(); onChoisir(c, kg); };
  const entree = () => {
    if (t.length >= 2) {
      if (trouves.length) choisir(trouves[Math.min(cible, trouves.length - 1)], s.kg);
      else { reinit(); onCreer(t, s.kg); }
    } else if (flechee && liste[iCible]) choisir(liste[iCible], null);
  };

  const sousNom = (a?: StockItem) => {
    const dup = a && (doublons.get(a.name.trim().toLocaleLowerCase('fr')) ?? 0) > 1;
    return `${stockTxt(a)}${dup ? ` · réf. ${a!.ref}` : ''}`;
  };

  return (
    <section className={`fer-aj${on ? ' fer-on' : ''}`} aria-label="Ajouter">
      <label className="fer-champ">
        <button type="button" className="fer-fam" data-role="fam" data-booster="familles" aria-label={`Famille de l’ajout : ${def.label}`}
          title={def.hint} onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => { e.preventDefault(); onFamille(familles[(familles.indexOf(famille) + 1) % familles.length]); reinit(); }}>
          {def.label} <Bascule />
        </button>
        <Input
          ref={champ}
          type="text"
          className="fer-in"
          data-role="ajout"
          data-booster="ajout-clavier"
          placeholder="Nom (et kg), Entrée"
          enterKeyHint="enter"
          role="combobox"
          aria-expanded={on}
          aria-controls="fer-resultats"
          aria-autocomplete="list"
          aria-label={`Ajouter un fermentescible de la famille ${def.label} (nom, Entrée)`}
          value={valeur}
          onFocus={() => setOuvert(true)}
          onBlur={() => setOuvert(false)}
          onChange={(e) => { setValeur(e.target.value); setCible(0); setFlechee(false); setOuvert(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); entree(); }
            else if (e.key === 'Escape') { e.stopPropagation(); if (valeur) { e.preventDefault(); reinit(); } else setOuvert(false); }
            else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              const n = t ? affiches.length : liste.length;
              if (n) { setOuvert(true); setFlechee(true); setCible((c) => (c + (e.key === 'ArrowDown' ? 1 : n - 1)) % n); }
            }
          }}
        />
        <span className={`fer-ap${nomCible ? ' fer-vu' : ''}`} data-role="apercu" aria-live="polite">
          {nomCible && (
            <>{creer ? <Plus /> : null}{nomCible.split(' ')[0]}{s.kg != null && <> <b>{kgTxt(s.kg)}</b> kg</>}<Entree /></>
          )}
        </span>
      </label>
      <div ref={rangee} className={`fer-puces${on ? ' fer-tuiles' : ''}`} id="fer-resultats" role={on ? 'listbox' : undefined} aria-label={on ? 'Résultats de la recherche' : undefined} data-role="puces" data-booster="sacs-habituels"
        onPointerDown={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()}>
        {!on && prete && propositions.slice(0, 5).map((p) => (
          <button key={p.article.ref} type="button" className="fer-pu" data-pu={p.article.name} data-role="resultat" data-nom={p.article.name}
            onClick={() => choisir({ nom: p.article.name, rang: 1, article: p.article, ligne: -1 }, s.kg)}>
            <Sac famille={famille} ebc={p.article.colorEbc} />{p.article.name}
          </button>
        ))}
        {on && liste.map((c, k) => {
          const pr = (t.length >= 2 || flechee) && k === iCible;
          const fin = pr ? <i className="fer-ent" aria-hidden="true"><Entree /></i> : null;
          const [av, gras, ap] = decouper(c.nom, t);
          const nom = <span className="fer-nm2">{av}{gras && <b>{gras}</b>}{ap}</span>;
          const etoile = c.article?.favorite ? <Etoile /> : null;
          if (c.ligne >= 0) {
            const f = fermentables[c.ligne];
            return (
              <button key={`l${c.ligne}`} type="button" role="option" aria-selected={pr} className={`fer-tu fer-large${pr ? ' fer-prem' : ''}`} data-role="resultat" data-nom={f.name} data-deja={c.ligne}
                aria-label={`${f.name} : déjà ${kgTxt(f.weightKg)} kg dans la recette, ${stockTxt(c.article)}`} onClick={() => choisir(c, s.kg)}>
                <span className="fer-l1">{etoile}{nom}</span>
                <span className="fer-l2"><b>déjà {kgTxt(f.weightKg)} kg</b> · {stockTxt(c.article)}</span>{fin}
              </button>
            );
          }
          const a = c.article;
          const ebc = famille === 'grain' && a?.colorEbc != null ? a.colorEbc : null;
          return (
            <button key={a?.ref ?? c.nom} type="button" role="option" aria-selected={pr} className={`fer-tu${pr ? ' fer-prem' : ''}${a && !(a.currentStock > 0) ? ' fer-epuise' : ''}`} data-role="resultat"
              data-nom={c.nom} data-pu={c.nom} aria-label={`Ajouter ${c.nom} : ${sousNom(a)}${ebc != null ? ` · ${qteTxt(ebc)} EBC` : ''}`} onClick={() => choisir(c, s.kg)}>
              <span className="fer-l1">{etoile}{nom}
                {ebc != null && <i className="fer-ebcp" style={{ background: teinte(ebc), color: texteSurTeinte(ebc) }}>{qteTxt(ebc)}</i>}</span>
              <span className="fer-l2">{sousNom(a)}</span>{fin}
            </button>
          );
        })}
        {on && creer && (
          <button type="button" role="option" aria-selected className="fer-tu fer-large fer-cree fer-prem" data-role="creer" data-cree="1" onClick={() => { reinit(); onCreer(t, s.kg); }}>
            <span className="fer-l1"><Plus /><span className="fer-nm2">Créer « {t} » (stock à zéro)</span></span>
            <span className="fer-l2">{def.label.toLowerCase()} : {QUAND[def.use]}</span><i className="fer-ent" aria-hidden="true"><Entree /></i>
          </button>
        )}
        {on && !t && prete && !liste.length && <p className="fer-rien">Rien en stock pour {def.label.toLowerCase()}</p>}
      </div>
    </section>
  );
};

export { memeArticle };
