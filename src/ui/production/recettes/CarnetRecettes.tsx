// r2a (choix du brasseur, 15.11), porté tel quel : le carnet dit d'abord ce qui est prêt à brasser, puis ce qui manque.
// Aucune donnée inventée : « prête » vient du stock et des réservations (recettesModel). Un stock inconnu est « à vérifier ».
// Ce que r2a n'a pas est retiré de l'écran (Comparer, bilan, favori, Ranger) ; leur code reste dans ProductionCatalog.
import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Check, ChevronRight, Plus, Search, SlidersHorizontal, Trash2, TriangleAlert } from 'lucide-react';
import { ConfirmerSuppressionRecette } from '../../recette/ConfirmerSuppressionRecette';
import type { Batch, Recipe, StockItem } from '../../../types';
import { StorageService } from '../../../services/storage';
import { useStorageValue } from '../../../hooks/useLiveData';
import { Sheet } from '../../Sheet';
import { DEFAULT_CATALOG_FILTERS, catalogOptions, filterCatalog, recipeEntries, type CatalogEntry } from '../../../domain/productionCatalog';
import { isArchived, isCurrent } from '../../../domain/catalogOrganization';
import { changementsDepuis, dateCourte, grouper, lignees, versionPrecedente, type Lignee, type LigneBesoin } from './recettesModel';
import './recettes.css';

const lireStock = (): StockItem[] => {
  try { return StorageService.getStocks().rawMaterials ?? []; } catch { return []; }
};

const virgule = (n: number, d: number) => n.toFixed(d).replace('.', ',');
const fois = (n: number) => (n === 0 ? 'jamais brassée' : `brassée ${n} fois`);
const nomsDe = (l: { article: string }[]) => l.map((x) => x.article).join(', ');
const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);
/** « manque **levure Belle Saison**, 1 sachet » : le nom seul en gras quand la quantité est comptée en pièces (r2a). */
const manqueDit = (m: LigneBesoin) => <><b>{m.manqueGras}</b>{(m.manque ?? '').slice((m.manqueGras ?? '').length)}</>;

interface Props {
  recipes: Recipe[];
  batches: Batch[];
  onOpenRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onOpenBatch: (batch: Batch) => void;
  /** Ouvre la feuille « Préparer un brassin » de l'app, recette préchoisie. */
  onBrew: (recipeId: string) => void;
  onNewRecipe: () => void;
  /** Supprime la recette (après la feuille de confirmation commune) ; absente, la fiche ne propose pas de supprimer. */
  onDeleteRecipe?: (recipe: Recipe) => void;
}

/**
 * La couleur de la bière : le métro des versions la reprend. `entry.swatch` est une classe (« bg-ebc-gold ») : on lit la bande,
 * et ses aplats sont ceux de l'échelle EBC (tailwind.config). La paille n'est pas le jeton d'action (noir en clair) mais le jaune de r2a.
 */
const APLATS: Record<string, string> = { straw: '#D9B414', gold: '#E0A02E', amber: '#C87A2C', copper: '#A0522D', brown: '#6B3A1E', stout: '#3B1F14' };
const teinte = (l: Lignee): React.CSSProperties => {
  const bande = /bg-ebc-([a-z]+)/.exec(l.entree.swatch ?? '')?.[1] ?? '';
  return { ['--rcp-c' as string]: APLATS[bande] ?? 'rgb(var(--cave-texte-400))' };
};

function Metro({ n, version }: { n: number; version: number }) {
  const points = Math.min(Math.max(n, 1), 6);
  return (
    <span className="rcp-metro" aria-hidden="true">
      {Array.from({ length: points }, (_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <i className="rcp-tr" />}
          <i className="rcp-st" {...(i === points - 1 ? { 'data-der': '' } : {})} />
        </React.Fragment>
      ))}
      <b className="rcp-v">v{version}</b>
    </span>
  );
}

export function CarnetRecettes({ recipes, batches, onOpenRecipe, onEditRecipe, onOpenBatch, onBrew, onNewRecipe, onDeleteRecipe }: Props) {
  // 36 (16.11) : la suppression ne se cache plus derrière « OG … › » puis la page ; la fiche la porte, avec la même confirmation.
  const [aSupprimer, setASupprimer] = useState<Recipe | null>(null);
  const stock = useStorageValue(lireStock);
  const [recherche, setRecherche] = useState('');
  const [style, setStyle] = useState('');
  const [houblon, setHoublon] = useState('');
  const [levure, setLevure] = useState('');
  const [filtreOuvert, setFiltreOuvert] = useState(false);
  const [archives, setArchives] = useState(false);
  const [ouverte, setOuverte] = useState<string | null>(null);

  const entrees = useMemo(() => {
    const config = StorageService.getConfig();
    const cuverie = config.brewhouses.find((b) => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];
    return recipeEntries(recipes, batches, cuverie?.efficiencyPct ?? 75).filter((e) => !!e.recipe);
  }, [recipes, batches]);
  const courantes = useMemo(() => entrees.filter(isCurrent), [entrees]);
  const rangees = useMemo(() => entrees.filter(isArchived), [entrees]);

  const toutes = useMemo(() => lignees(courantes, batches, stock), [courantes, batches, stock]);
  const toutesArchivees = useMemo(() => lignees(rangees, batches, stock), [rangees, batches, stock]);

  const nbFiltres = [style, houblon, levure].filter(Boolean).length;
  const filtre = recherche.trim() !== '' || nbFiltres > 0;
  // Une lignée reste si une de ses versions correspond.
  const familles = useMemo(() => {
    if (!filtre) return null;
    const trouvees = filterCatalog(entrees, { ...DEFAULT_CATALOG_FILTERS, folder: 'all', search: recherche, style, hop: houblon, yeast: levure }, 'all');
    return new Set(trouvees.map((e: CatalogEntry) => e.family));
  }, [filtre, entrees, recherche, style, houblon, levure]);
  const gardees = (l: Lignee[]) => (familles ? l.filter((x) => familles.has(x.id)) : l);

  const groupes = useMemo(() => grouper(gardees(toutes)), [toutes, familles]);
  // Le résultat d'un filtre se dit sous le champ (r2a) ; la phrase de tête est partie le 19.11 (LST-TITRE-COMPTEUR).
  const archivees = useMemo(() => gardees(toutesArchivees), [toutesArchivees, familles]);

  const ouverteLignee = ouverte ? [...toutes, ...toutesArchivees].find((l) => l.id === ouverte) ?? null : null;
  const effacer = () => { setRecherche(''); setStyle(''); setHoublon(''); setLevure(''); };
  // À l'ouverture d'une feuille, le focus va au début du contenu et non au ×, sinon un anneau l'entoure comme un bouton choisi par erreur (r2a n'en a pas).
  const debutFeuille = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ouverte && !filtreOuvert) return;
    const t = window.setTimeout(() => { if (debutFeuille.current && document.activeElement?.getAttribute('aria-label') === 'Fermer') debutFeuille.current.focus({ preventScroll: true }); }, 80);
    return () => window.clearTimeout(t);
  }, [ouverte, filtreOuvert]);
  const brasser = (id: string) => { setOuverte(null); onBrew(id); };

  // ——— Le carnet vide ———
  if (recipes.length === 0) {
    const compte = (cat: string) => stock.filter((s) => (s.category ?? '').trim().toLowerCase() === cat).length;
    const [h, m, y] = [compte('houblon'), compte('malt'), compte('levure')];
    return (
      <div className="rcp-vide">
        <p className="rcp-vide-titre">Aucune recette</p>
        <p className="rcp-vide-texte">Chaque recette dira si ton stock suffit pour la brasser, et ce qu’il manque.</p>
        <div className="rcp-exemple" aria-hidden="true">
          <div className="rcp-liste">
            <div className="rcp-ligne">
              <span className="rcp-marque" data-etat="ok"><Check /></span>
              <span className="rcp-nom"><span className="rcp-nomt"><strong>Ta recette</strong></span><span className="rcp-sous">tout est en stock</span></span>
              <span className="rcp-pastille">Brasser</span>
            </div>
            <div className="rcp-ligne">
              <span className="rcp-marque" data-etat="presque" />
              <span className="rcp-nom"><span className="rcp-nomt"><strong>Une autre</strong></span><span className="rcp-sous">manque <b>un houblon</b></span></span>
              <span className="rcp-pastille">Planifier</span>
            </div>
          </div>
        </div>
        {h + m + y > 0 && <p className="rcp-vide-texte">Ton stock aujourd’hui : {h} {pluriel(h, 'houblon', 'houblons')}, {m} {pluriel(m, 'malt', 'malts')}, {y} {pluriel(y, 'levure', 'levures')}.</p>}
        <div className="rcp-vide-pied">
          <button type="button" className="rcp-btn rcp-btn-primaire" onClick={onNewRecipe}>Nouvelle recette</button>
          <p className="rcp-vide-texte">Ou verse une recette trouvée ailleurs :</p>
          <div className="rcp-sources">
            {['Photo', 'Lien', 'Texte'].map((s) => (
              <button key={s} type="button" className="rcp-btn rcp-btn-second" onClick={onNewRecipe}><Plus />{s}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ——— Une ligne « prête » ———
  const lignePrete = (l: Lignee) => (
    <div className="rcp-ligne" key={l.id} style={teinte(l)}>
      <span className="rcp-marque" data-etat="ok"><Check /></span>
      <button type="button" className="rcp-ouvrir rcp-nom" onClick={() => setOuverte(l.id)}>
        <span className="rcp-nomt"><strong>{l.nom}</strong><Metro n={l.nbVersions} version={l.version} /></span>
        <span className="rcp-sous">
          {fois(l.brassees)}{l.derniere && dateCourte(l.derniere, true) ? ` · dernière : ${dateCourte(l.derniere, true)}` : ''}
          {l.prevu && <><br /><span className="rcp-retard">prévue le {dateCourte(l.prevu.plannedBrewDate) || 'bientôt'}{l.retard ? ` · ${l.retard} j de retard` : ''}</span></>}
        </span>
      </button>
      {l.prevu
        ? <button type="button" className="rcp-btn rcp-btn-lot" onClick={() => onOpenBatch(l.prevu!)}>{l.prevu.id}<ChevronRight /></button>
        : <button type="button" className="rcp-btn" onClick={() => onBrew(l.entree.recipe!.id)}>Brasser</button>}
    </div>
  );

  // ——— Une ligne « à un achat près » ———
  const lignePresque = (l: Lignee) => {
    const m = l.manques[0];
    return (
      <div className="rcp-ligne" key={l.id} style={teinte(l)}>
        <span className="rcp-marque" data-etat="presque" />
        <button type="button" className="rcp-ouvrir rcp-nom" onClick={() => setOuverte(l.id)}>
          <span className="rcp-nomt"><strong>{l.nom}</strong><Metro n={l.nbVersions} version={l.version} /></span>
          <span className="rcp-sous">manque {manqueDit(m)}{m.reservePar ? ` : les ${m.reservePar.stock} du stock vont au ${m.reservePar.lots.join(', ')}` : ''}</span>
        </button>
        <button type="button" className="rcp-btn" onClick={() => onBrew(l.entree.recipe!.id)}>Planifier</button>
      </div>
    );
  };

  // ——— Une ligne courte (« Plus loin », « À vérifier », archives) ———
  const ligneCourte = (l: Lignee, droite: string) => (
    <button type="button" className="rcp-court" key={l.id} style={teinte(l)} onClick={() => setOuverte(l.id)}>
      <span className="rcp-marque" data-etat="loin" />
      <span className="rcp-nomt"><strong>{l.nom}</strong><Metro n={l.nbVersions} version={l.version} /></span>
      <span>{droite}</span>
    </button>
  );

  const montrees = groupes.pretes.length + groupes.presque.length + groupes.loin.length + groupes.inconnues.length;
  const rien = groupes.pretes.length + groupes.presque.length + groupes.loin.length + groupes.inconnues.length === 0;

  // ——— Les archives ———
  if (archives) {
    return (
      <div className="rcp-ecran-archives">
        <button type="button" className="rcp-lien" onClick={() => setArchives(false)}>‹ Retour au carnet</button>
        <section className="rcp-groupe">
          <div className="rcp-groupe-tete"><h2>Archives</h2><span>{archivees.length} {pluriel(archivees.length, 'lignée', 'lignées')}</span></div>
          <div className="rcp-liste">
            {archivees.length === 0 ? <p className="rcp-vide-filtre">Aucune recette archivée ne correspond.</p> : archivees.map((l) => ligneCourte(l, l.etat === 'pret' ? 'en stock' : l.etat === 'inconnu' ? 'à vérifier' : `${l.manques.length} ${pluriel(l.manques.length, 'achat', 'achats')}`))}
          </div>
        </section>
        {feuille()}
      </div>
    );
  }

  // ——— La feuille d'une recette ———
  function feuille() {
    const l = ouverteLignee;
    const options = (champ: 'style' | 'hops' | 'yeast') => catalogOptions(courantes, champ);
    const recette = l?.entree.recipe;
    const precedente = l ? versionPrecedente(l.entree, entrees)?.recipe : undefined;
    const change = recette ? changementsDepuis(recette, precedente) : [];
    const reserve = l?.manques.find((m) => m.reservePar);
    const og = recette?.ogTarget ? virgule(recette.ogTarget, 3) : null;
    const ibu = l?.entree.ibu ? Math.round(l.entree.ibu) : null;
    const sousTitre = l ? [l.entree.style, l.entree.volumeL ? `${String(l.entree.volumeL).replace('.', ',')} L` : '', fois(l.brassees)].filter(Boolean).join(' · ') : undefined;
    return (
      <>
        <Sheet
          open={!!l}
          onClose={() => setOuverte(null)}
          className="lg:max-w-xl lg:mx-auto"
          title={l ? `${l.nom} · v${l.version}` : ''}
          subtitle={sousTitre}
          footer={l && recette ? (
            <div className="rcp-pied">
              <button type="button" className="rcp-btn rcp-btn-second" onClick={() => { setOuverte(null); onEditRecipe(recette); }}>Modifier</button>
              <button type="button" className={`rcp-btn ${l.etat === 'pret' ? 'rcp-btn-primaire' : 'rcp-btn-second'}`} onClick={() => brasser(recette.id)}>{l.etat === 'pret' ? 'Brasser' : 'Brasser quand même'}</button>
            </div>
          ) : undefined}
        >
          {l && recette && (
            <div ref={debutFeuille} tabIndex={-1} className="rcp-debut">
              {l.manques.length > 0 ? (
                <div className="rcp-alerte">
                  <p>Pour la rebrasser, il manque {l.manques.map((m, i) => <React.Fragment key={m.cle}>{i > 0 && ', '}{manqueDit(m)}</React.Fragment>)}.</p>
                  {reserve?.reservePar && <small>Le stock a {reserve.reservePar.stock} de {reserve.article}, tous réservés au {reserve.reservePar.lots.join(', ')} : il n’en reste aucun de libre.</small>}
                  {l.inconnus.length > 0 && <small>Le stock de <b>{nomsDe(l.inconnus)}</b> est aussi à vérifier.</small>}
                </div>
              ) : l.inconnus.length > 0 ? (
                <div className="rcp-alerte"><p>Le stock de <b>{nomsDe(l.inconnus)}</b> est à vérifier : il n’est pas relié à un article du stock.</p></div>
              ) : (
                <p className="rcp-prete"><Check />Tout est en stock</p>
              )}
              <div className="rcp-bloc">
                <h3>Ce qu’elle demande</h3>
                {l.besoins.map((b) => (
                  <div className="rcp-ingr" key={b.cle}>
                    <span className={b.etat === 'ok' ? 'rcp-vv' : 'rcp-x'}>{b.etat === 'ok' ? <Check /> : <TriangleAlert />}</span>
                    <span>{b.texte}</span>
                    <span className={`rcp-q${b.etat === 'manque' ? ' rcp-manque' : ''}`}>{b.droite}</span>
                  </div>
                ))}
              </div>
              {change.length > 0 && precedente && <p className="rcp-change"><b>Depuis la v{versionPrecedente(l.entree, entrees)!.version}</b> : {change.join(', ')}</p>}
              {(og || ibu) && (
                <button type="button" className="rcp-detail" onClick={() => { setOuverte(null); onOpenRecipe(recette); }}>
                  <span>{og && <>OG <b>{og}</b></>}{og && ibu ? ' · ' : ''}{ibu ? <><b>{ibu}</b> IBU</> : null}{' · couleur, alcool'}</span>
                  <ChevronRight />
                </button>
              )}
              {!og && !ibu && (
                <button type="button" className="rcp-detail" onClick={() => { setOuverte(null); onOpenRecipe(recette); }}>
                  <span>Couleur, alcool, détail</span><ChevronRight />
                </button>
              )}
              {onDeleteRecipe && (
                <button type="button" className="rcp-suppr" onClick={() => setASupprimer(recette)}>
                  <Trash2 aria-hidden="true" />Supprimer la recette
                </button>
              )}
            </div>
          )}
        </Sheet>
        <ConfirmerSuppressionRecette
          recipe={aSupprimer}
          batches={batches}
          open={!!aSupprimer}
          onClose={() => setASupprimer(null)}
          onConfirm={() => {
            const r = aSupprimer;
            setASupprimer(null);
            setOuverte(null);
            if (r) onDeleteRecipe?.(r);
          }}
        />
        <Sheet
          open={filtreOuvert}
          onClose={() => setFiltreOuvert(false)}
          className="lg:max-w-xl lg:mx-auto"
          title="Filtrer"
          subtitle={`${courantes.length} recettes`}
          footer={<div className="rcp-pied">
            <button type="button" className="rcp-btn rcp-btn-second" onClick={() => { setStyle(''); setHoublon(''); setLevure(''); }}>Effacer</button>
            <button type="button" className="rcp-btn rcp-btn-primaire" onClick={() => setFiltreOuvert(false)}>Voir</button>
          </div>}
        >
          <div className="rcp-filtres rcp-debut" ref={debutFeuille} tabIndex={-1}>
            <label>Style
              <select value={style} onChange={(e) => setStyle(e.target.value)}><option value="">Tous</option>{options('style').map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <label>Houblon
              <select value={houblon} onChange={(e) => setHoublon(e.target.value)}><option value="">Tous</option>{options('hops').map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <label>Levure
              <select value={levure} onChange={(e) => setLevure(e.target.value)}><option value="">Toutes</option>{options('yeast').map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
          </div>
        </Sheet>
      </>
    );
  }

  return (
    <div className="rcp-ecran">
      <div className="rcp-col-g">
        {/* LST-TITRE-COMPTEUR (19.11, « Pareil, inutile ») : plus de « N à un achat près » ni de « N lignées · N recettes » ; les sections le disent. */}
        <div className="rcp-cherche">
          <label className="rcp-champ">
            <Search aria-hidden="true" />
            <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={`Nom, houblon, levure… dans les ${courantes.length}`} aria-label="Chercher une recette" autoComplete="off" />
          </label>
          <button type="button" className="rcp-filtre" aria-label={nbFiltres ? `Filtrer (${nbFiltres})` : 'Filtrer'} onClick={() => setFiltreOuvert(true)}>
            <SlidersHorizontal />{nbFiltres > 0 && <span>{nbFiltres}</span>}
          </button>
        </div>
        {filtre && montrees > 0 && <p className="rcp-resultat" role="status">{montrees} sur {toutes.length} {pluriel(toutes.length, 'lignée', 'lignées')}</p>}
      </div>
      <div className="rcp-col-d">
        {filtre && rien && archivees.length === 0 && (
          <div className="rcp-liste"><p className="rcp-vide-filtre">Aucune recette ne correspond. <button type="button" className="rcp-lien" onClick={effacer}>Effacer</button></p></div>
        )}
        {groupes.pretes.length > 0 && (
          <section className="rcp-groupe">
            <div className="rcp-groupe-tete"><h2>Prêtes</h2><span>tout est en stock</span></div>
            <div className="rcp-liste">{groupes.pretes.map(lignePrete)}</div>
          </section>
        )}
        {groupes.presque.length > 0 && (
          <section className="rcp-groupe">
            <div className="rcp-groupe-tete"><h2>À un achat près</h2><span>un seul ingrédient manque</span></div>
            <div className="rcp-liste">{groupes.presque.map(lignePresque)}</div>
          </section>
        )}
        {(groupes.loin.length > 0 || toutesArchivees.length > 0) && !(filtre && groupes.loin.length === 0 && archivees.length === 0) && (
          <section className="rcp-groupe">
            {groupes.loin.length > 0 && <div className="rcp-groupe-tete"><h2>Plus loin</h2><span>2 achats ou plus</span></div>}
            <div className="rcp-liste">
              {groupes.loin.map((l) => ligneCourte(l, `${l.manques.length} achats`))}
              {archivees.length > 0 && (
                <button type="button" className="rcp-reste" onClick={() => setArchives(true)}>
                  <Boxes aria-hidden="true" />
                  <span><b>{archivees.length}</b> {pluriel(archivees.length, 'lignée', 'lignées')} aux Archives</span>
                  <ChevronRight aria-hidden="true" />
                </button>
              )}
            </div>
          </section>
        )}
        {groupes.inconnues.length > 0 && (
          <section className="rcp-groupe">
            <div className="rcp-groupe-tete"><h2>À vérifier</h2><span>stock inconnu</span></div>
            <div className="rcp-liste">{groupes.inconnues.map((l) => ligneCourte(l, `${l.inconnus.length} à vérifier`))}</div>
          </section>
        )}
      </div>
      {feuille()}
    </div>
  );
}
