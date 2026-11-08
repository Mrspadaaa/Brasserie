import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Fermentable, FermentableKind, FermentableUse, StockItem } from '../../types';
import { Units } from '../../services/units';
import { proposerFermentables } from '../../domain/fermentables/proposition';
import { Bascule, Entree, Etoile, Plus, Sac } from './icones';
import { Input } from '../Input';
import { chercher, chercherAilleurs, decouper, kgTxt, lireAjout, memeArticle, nomPossible, qteTxt, teinte, texteSurTeinte, type Candidat } from './modele';
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
  // La bascule dit où elle va (B1 n° 13 : cinq familles parcourues à l'aveugle) : « Toucher : Sucre » en infobulle et pour le lecteur d'écran.
  const suivante = familles[(familles.indexOf(famille) + 1) % familles.length];

  // Le repli des tuiles ne se fait jamais pendant l'appui qui prend le focus : replié au `mousedown`, la grille (trois rangées) redevient une rangée de 32 px,
  // la page remonte sous la souris et le `mouseup` tombe ailleurs, sans `click` (p9-clic, 01.11). Souris tenue : on attend son `pointerup`, puis le tour suivant.
  // Doigt ou clavier : le tour suivant. Si le champ a repris le focus entre-temps, rien ne se replie. Minuteries et écouteurs nettoyés au démontage.
  const sourisTenue = useRef(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finAppui = useRef<(() => void) | null>(null);
  const annulerRepli = () => {
    if (minuterie.current !== null) { clearTimeout(minuterie.current); minuterie.current = null; }
    if (finAppui.current) { finAppui.current(); finAppui.current = null; }
  };
  useEffect(() => {
    const bas = (e: Event) => { sourisTenue.current = (e as PointerEvent).pointerType === 'mouse'; };
    const haut = () => { sourisTenue.current = false; };
    document.addEventListener('pointerdown', bas, true);
    document.addEventListener('pointerup', haut, true);
    document.addEventListener('pointercancel', haut, true);
    return () => {
      document.removeEventListener('pointerdown', bas, true);
      document.removeEventListener('pointerup', haut, true);
      document.removeEventListener('pointercancel', haut, true);
      annulerRepli();
    };
  }, []);
  const replierPlusTard = () => {
    annulerRepli();
    const replier = () => {
      minuterie.current = setTimeout(() => {
        minuterie.current = null;
        if (champ.current && document.activeElement === champ.current) return;
        setOuvert(false);
      }, 0);
    };
    if (sourisTenue.current) {
      const fin = () => { document.removeEventListener('pointerup', fin, true); document.removeEventListener('pointercancel', fin, true); finAppui.current = null; replier(); };
      document.addEventListener('pointerup', fin, true);
      document.addEventListener('pointercancel', fin, true);
      finAppui.current = () => { document.removeEventListener('pointerup', fin, true); document.removeEventListener('pointercancel', fin, true); };
    } else replier();
  };

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

  // Une masse entière sans « kg » seulement derrière un nom déjà là (en tête de nom) : « Crystal 60 » reste un nom (critique B1 n° 2).
  // Hors du grain (sucre, sucre de lait, fruit, extrait), un petit entier est une masse même derrière un nom neuf (« sirop candi 1 », RO-2 ; « Mangue 20 », MV-10).
  const s = lireAjout(valeur, (nom) => chercher(nom, articles, lignes).some((c) => c.rang <= 1), famille !== 'grain');
  const t = s.nom;
  const on = ouvert || !!t;
  // Les autres rayons comptent : « dext » en Grain propose Dextrose (rayon Sucre), qui s'ajoute dans sa famille. Les noms de la famille du champ restent devant
  // (le brasseur a choisi sa famille) ; un rang 4 (faute d'une lettre) ne passe jamais devant un nom trouvé ailleurs (critique B1 n° 4).
  const trouves = useMemo(() => {
    if (!t) return [];
    const propres = chercher(t, articles, lignes);
    const ailleurs = chercherAilleurs(t, famille, familles, defs, stockItems, fermentables);
    return [...propres.filter((c) => c.rang <= 3), ...ailleurs, ...propres.filter((c) => c.rang > 3)];
  }, [t, articles, lignes, famille, familles, defs, stockItems, fermentables]);
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
  const creer = t.length >= 2 && trouves.length === 0 && nomPossible(t);
  const liste = t ? affiches : !prete ? [] : propositions.map((p): Candidat => ({ nom: p.article.name, rang: 1, article: p.article, ligne: -1 }));
  const iCible = Math.min(cible, Math.max(0, liste.length - 1));
  const nomCible = t.length >= 2 ? (trouves.length ? trouves[Math.min(cible, trouves.length - 1)].nom : nomPossible(t) ? t : '') : flechee && liste[iCible] ? liste[iCible].nom : '';

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
  // Un double toucher sur une tuile ou un sac ajoutait deux fois (banc d'actionneurs N2) : un 2e CLIC dans les 400 ms qui suivent un choix est ignoré. Le clavier (Entrée) n'est pas concerné.
  const dernierClic = useRef(0);
  const cliquer = (c: Candidat, kg: number | null) => {
    const t = Date.now();
    if (t - dernierClic.current < 400) return;
    dernierClic.current = t;
    choisir(c, kg);
  };
  const entree = () => {
    if (t.length >= 2) {
      if (trouves.length) choisir(trouves[Math.min(cible, trouves.length - 1)], s.kg);
      else if (nomPossible(t)) { reinit(); onCreer(t, s.kg); }
    } else if (flechee && liste[iCible]) choisir(liste[iCible], null);
  };

  const sousNom = (a?: StockItem, autre?: FermentableKind) => {
    const dup = a && (doublons.get(a.name.trim().toLocaleLowerCase('fr')) ?? 0) > 1;
    return `${stockTxt(a)}${dup ? ` · réf. ${a!.ref}` : ''}${autre ? ` · ${defs[autre].label.toLowerCase()}` : ''}`;
  };

  return (
    <section className={`fer-aj${on ? ' fer-on' : ''}`} aria-label="Ajouter">
      <label className="fer-champ">
        <button type="button" className="fer-fam" data-role="fam" data-booster="familles" aria-label={`Famille de l’ajout : ${def.label}. Toucher : ${defs[suivante].label}`}
          title={`${def.hint ? `${def.hint} ` : ''}Toucher : ${defs[suivante].label}`} onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => { e.preventDefault(); onFamille(suivante); reinit(); }}>
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
          onFocus={() => { annulerRepli(); setOuvert(true); }}
          onBlur={replierPlusTard}
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
            onClick={() => cliquer({ nom: p.article.name, rang: 1, article: p.article, ligne: -1 }, s.kg)}>
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
                aria-label={`${f.name} : déjà ${kgTxt(f.weightKg)} kg dans la recette, ${stockTxt(c.article)}`} onClick={() => cliquer(c, s.kg)}>
                <span className="fer-l1">{etoile}{nom}</span>
                <span className="fer-l2"><b>déjà {kgTxt(f.weightKg)} kg</b> · {stockTxt(c.article)}</span>{fin}
              </button>
            );
          }
          const a = c.article;
          const ebc = (c.famille ?? famille) === 'grain' && a?.colorEbc != null ? a.colorEbc : null;
          return (
            <button key={a?.ref ?? c.nom} type="button" role="option" aria-selected={pr} className={`fer-tu${pr ? ' fer-prem' : ''}${a && !(a.currentStock > 0) ? ' fer-epuise' : ''}`} data-role="resultat"
              data-nom={c.nom} data-pu={c.nom} data-ailleurs={c.famille} aria-label={`Ajouter ${c.nom}${c.famille ? ` (${defs[c.famille].label})` : ''} : ${sousNom(a)}${ebc != null ? ` · ${qteTxt(ebc)} EBC` : ''}`} onClick={() => cliquer(c, s.kg)}>
              <span className="fer-l1">{etoile}{nom}
                {ebc != null && <i className="fer-ebcp" style={{ background: teinte(ebc), color: texteSurTeinte(ebc) }}>{qteTxt(ebc)}</i>}</span>
              <span className="fer-l2">{sousNom(a, c.famille)}</span>{fin}
            </button>
          );
        })}
        {on && creer && (
          <button type="button" role="option" aria-selected className="fer-tu fer-large fer-cree fer-prem" data-role="creer" data-cree="1" onClick={() => { const now = Date.now(); if (now - dernierClic.current < 400) return; dernierClic.current = now; reinit(); onCreer(t, s.kg); }}>
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
