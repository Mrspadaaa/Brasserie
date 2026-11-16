// La liste des brassins d'e6a : une phrase qui répond, la recherche, des puces qui comptent, le tri et la période, des cartes à un seul geste.
// Un geste (puce, recherche) pose un critère : la puce passe en tête avec son ×, le reste se replie en « n autres hors du filtre ».
import React, { useEffect, useMemo, useState } from 'react';
import { Archive, Calendar, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Batch, KegItem } from '../../../types';
import { enPeriode, etiquetteCourte, titre, type PeriodeEntree } from '../../../components/periode/periode';
import type { CatalogEntry, CatalogFilters } from '../../../domain/productionCatalog';
import { isArchived } from '../../../domain/catalogOrganization';
import type { BatchDetailSection } from '../../../domain/productionInsights';
import { DateUtils } from '../../../services/dateUtils';
import { CarteBrassin } from './CarteBrassin';
import { FeuilleFiltres, SelectTri, COULEUR_TON } from './FeuilleFiltres';
import {
  AVANCEMENTS,
  CRITERES_VIDES,
  appliquer,
  comptesAvancement,
  criteresPoses,
  dansLeDossier,
  miniModel,
  phraseListe,
  type Avancement,
  type Contexte,
  type Criteres
} from './listeModel';
import './liste.css';

const POINT: Partial<Record<Avancement, string>> = {
  cuve: 'rgb(var(--hop))', brasser: 'rgb(var(--attention))', conditionnes: 'rgb(var(--lst-cuivre))', favoris: 'rgb(var(--lst-or))', termines: 'rgb(var(--lst-fin))', notes: 'rgb(var(--lst-cuivre))'
};
const PUCES: Avancement[] = ['cuve', 'brasser', 'conditionnes', 'favoris', 'termines', 'mesures', 'notes'];

/** Houblons réellement présents dans les brassins : nom, style du premier brassin qui l'emploie et sa dose (somme de ses ajouts). */
function houblonsDesBrassins(entries: CatalogEntry[]): { nom: string; style: string; dose?: number; n: number }[] {
  const vus = new Map<string, { nom: string; style: string; dose?: number; n: number }>();
  entries.forEach((e) => {
    const lignes = e.batch?.recipeSnapshot?.hops ?? [];
    e.hops.forEach((h) => {
      const cle = h.trim().toLocaleLowerCase('fr');
      if (!cle) return;
      const prev = vus.get(cle);
      if (prev) { prev.n += 1; return; }
      const g = lignes.filter((l) => l.name?.trim().toLocaleLowerCase('fr') === cle).reduce((s, l) => s + (Number.isFinite(l.weightG) ? l.weightG : 0), 0);
      vus.set(cle, { nom: h.trim(), style: e.style, dose: g > 0 ? g : undefined, n: 1 });
    });
  });
  return [...vus.values()].sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom, 'fr')).slice(0, 4);
}

/* Fusion avec la période commune (m3r-a) : la période de l'app est `PeriodeEntree` ; son libellé vient de `periode.ts` (« Nov. », « T4 », « 2026 »). */
function libellePeriode(c: Criteres, appPeriode: PeriodeEntree, now: number): { texte: string; suite: string; actif: boolean } {
  const mois = new Date(now).toLocaleDateString('fr-CH', { month: 'short' });
  const Mois = mois.charAt(0).toLocaleUpperCase('fr') + mois.slice(1);
  const suite = c.periode.enCours ? '+ en cours' : '';
  if (c.periode.mode === 'mois') return { texte: Mois, suite, actif: true };
  if (c.periode.mode === 'annee') return { texte: 'Cette année', suite, actif: true };
  if (c.periode.mode === 'dates') return { texte: 'Dates', suite, actif: true };
  const app = enPeriode(appPeriode, new Date(now));
  if (app.genre === 'tout') return { texte: 'Toutes', suite: '', actif: false };
  if (app.genre === 'mois' && app.annee === new Date(now).getFullYear() && app.mois === new Date(now).getMonth() + 1) return { texte: Mois, suite: '+ en cours', actif: true };
  return { texte: etiquetteCourte(app), suite: '+ en cours', actif: true };
}

export function ListeBrassins({
  entries,
  filtres,
  onFiltres,
  criteres,
  onCriteres,
  appPeriode,
  now,
  kegs,
  onOpenBatch,
  onBrew,
  onFavorite,
  onArchive,
  onBilan
}: {
  entries: CatalogEntry[];
  filtres: CatalogFilters;
  onFiltres: (f: CatalogFilters) => void;
  criteres: Criteres;
  onCriteres: (c: Criteres) => void;
  appPeriode: PeriodeEntree;
  now?: number;
  kegs?: KegItem[];
  onOpenBatch: (b: Batch, section?: BatchDetailSection) => void;
  onBrew: (b: Batch) => void;
  onFavorite: (e: CatalogEntry) => void;
  onArchive: (e: CatalogEntry, archived: boolean) => void;
  onBilan: () => void;
}) {
  const [feuille, setFeuille] = useState(false);
  const [pliOuvert, setPliOuvert] = useState(true);
  const [couleurs, setCouleurs] = useState<Record<string, string[]>>({});
  const t = now ?? Date.now();
  const ctx: Contexte = { entries, criteres, filtres, now: t };
  const resultats = useMemo(() => appliquer(ctx), [entries, criteres, filtres, t]);
  const dossier = useMemo(() => dansLeDossier(ctx), [entries, filtres.folder]);
  const comptes = useMemo(() => comptesAvancement(ctx), [entries, criteres, filtres, t]);
  const tousN = useMemo(() => appliquer(ctx, ['avancement']).length, [entries, criteres, filtres, t]);
  const poses = criteresPoses(criteres, filtres.search);
  const sansRecherche = poses.filter((x) => x.groupe !== 'recherche').length;
  const bornesPosees = [filtres.volumeMin, filtres.volumeMax, filtres.ibuMin, filtres.ibuMax, filtres.colorMin, filtres.colorMax].filter((v) => v.trim()).length;
  const nbFiltres = sansRecherche + (bornesPosees ? 1 : 0);
  const phrase = phraseListe(ctx, resultats);
  const archives = entries.filter(isArchived).length;
  const vide = resultats.length === 0;
  const horsFiltre = poses.length > 0 && !vide ? dossier.filter((e) => !resultats.some((r) => r.id === e.id)) : [];
  const houblons = useMemo(() => houblonsDesBrassins(dossier), [dossier]);
  const periode = libellePeriode(criteres, appPeriode, t);
  const posees = criteres.avancement;
  const ordrePuces = [...PUCES.filter((p) => posees.includes(p)), ...PUCES.filter((p) => !posees.includes(p))];
  const toutEffacer = () => {
    onCriteres({ ...CRITERES_VIDES, periode: criteres.periode });
    onFiltres({ ...filtres, search: '', volumeMin: '', volumeMax: '', ibuMin: '', ibuMax: '', colorMin: '', colorMax: '' });
  };
  const basculer = (a: Avancement) => onCriteres({ ...criteres, avancement: posees.includes(a) ? posees.filter((x) => x !== a) : [...posees, a] });

  // Les bandes de familles d'arômes des houblons (radar du catalogue) : chargées quand un écran les montre.
  const besoin = feuille || (vide && houblons.length > 0);
  useEffect(() => {
    if (!besoin) return;
    let vivant = true;
    const noms = [...new Set(dossier.flatMap((e) => e.hops))];
    Promise.all([import('../volumes/familles'), import('../../hopIndex/familyTokens')])
      .then(async ([{ famillesDe }, { COULEURS }]) => {
        const f = await famillesDe(noms);
        if (!vivant) return;
        setCouleurs(Object.fromEntries(Object.entries(f).map(([nom, fam]) => [nom, fam.map((id) => COULEURS[id].base)])));
      })
      .catch(() => undefined);
    return () => { vivant = false; };
  }, [besoin, dossier]);

  const ligneEtat = (
    <div className="lst-row">
      <SelectTri classe="lst-sel lst-grow" value={filtres.sort} onChange={(sort) => onFiltres({ ...filtres, sort })} />
      {poses.length > 0 ? (
        <button type="button" className="lst-sel" onClick={toutEffacer}>Tout effacer<X aria-hidden /></button>
      ) : (
        <button type="button" className={`lst-sel${periode.actif ? ' lst-per' : ''}`} aria-label={`Période : ${periode.texte} ${periode.suite}`.trim()} onClick={() => setFeuille(true)}>
          <Calendar aria-hidden />{periode.texte}{periode.suite && <small>{periode.suite}</small>}
        </button>
      )}
    </div>
  );

  return (
    <div className="lst-racine" aria-label="Liste des brassins" data-liste-brassins>
      <div className="lst-rep">
        <h2 className="lst-h1">
          {phrase.lignes.map((l, i) => (
            <span key={i} className={l.ton === 'hop' ? 'lst-hop' : l.ton === 'attention' ? 'lst-att' : undefined}>{l.texte}</span>
          ))}
        </h2>
        <div className="lst-cnt" role="status"><b>{phrase.compteurN}</b>{phrase.compteurLabel}</div>
      </div>

      <div className="lst-search">
        <div className={`lst-field${filtres.search ? ' lst-plein' : ''}`}>
          <Search aria-hidden />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            aria-label="Chercher un brassin"
            placeholder="Nom, lot, houblon, malt…"
            value={filtres.search}
            onChange={(e) => onFiltres({ ...filtres, search: e.target.value })}
          />
          {filtres.search && (
            <button type="button" className="lst-x" aria-label="Effacer la recherche" onClick={() => onFiltres({ ...filtres, search: '' })}><X aria-hidden /></button>
          )}
        </div>
        <button type="button" className="lst-fbtn" aria-label={nbFiltres ? `Filtrer, ${nbFiltres} filtre${nbFiltres > 1 ? 's' : ''}` : 'Filtrer'} onClick={() => setFeuille(true)}>
          <SlidersHorizontal aria-hidden />
          {nbFiltres > 0 && <span aria-hidden>{nbFiltres}</span>}
        </button>
      </div>

      <div className="lst-puces" role="group" aria-label="Avancement">
        {posees.length === 0 && (
          <button type="button" className={`lst-puce${tousN === 0 ? ' lst-zero' : ''}`} aria-current="true" onClick={() => undefined}>Tous<b>{tousN}</b></button>
        )}
        {ordrePuces.map((a, i) => {
          const on = posees.includes(a);
          const def = AVANCEMENTS.find((x) => x.id === a)!;
          return (
            <React.Fragment key={a}>
              {i === posees.length && posees.length > 0 && (
                <button type="button" className="lst-puce" aria-pressed={false} onClick={() => onCriteres({ ...criteres, avancement: [] })}>Tous<b>{tousN}</b></button>
              )}
              <button type="button" className={`lst-puce${comptes[a] === 0 && !on ? ' lst-zero' : ''}`} aria-pressed={on} aria-label={def.label} onClick={() => basculer(a)}>
                {!on && POINT[a] && <i style={{ background: POINT[a] }} aria-hidden />}
                {def.court}<b>{comptes[a]}</b>
                {on && <X aria-hidden />}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* e6a (vide) : pas de ligne tri / période ; « Tout effacer » vit dans la carte du vide. */}
      {!vide && ligneEtat}

      {!vide && (
        <div className="lst-liste">
          {resultats.map((e) => (
            <CarteBrassin key={e.id} entry={e} now={t} kegs={kegs} onOpen={onOpenBatch} onBrew={onBrew} onFavorite={onFavorite} onArchive={onArchive} />
          ))}
          {horsFiltre.length > 0 && (
            <>
              <button type="button" className="lst-fold" aria-expanded={pliOuvert} onClick={() => setPliOuvert(!pliOuvert)}>
                {horsFiltre.length} autre{horsFiltre.length > 1 ? 's' : ''} hors du filtre
                <span className="lst-dots" aria-hidden>
                  {horsFiltre.slice(0, 6).map((e) => <i key={e.id} style={{ background: `rgb(var(${COULEUR_TON[miniModel(e, t).ton]}))` }} />)}
                </span>
              </button>
              {pliOuvert && horsFiltre.map((e) => {
                const m = miniModel(e, t);
                return (
                  <button key={e.id} type="button" className="lst-mini" aria-label={`Ouvrir le brassin ${e.id}`} onClick={() => onOpenBatch(e.batch!)}>
                    <i style={{ background: `rgb(var(${COULEUR_TON[m.ton]}))` }} aria-hidden />
                    <b>{m.nom}</b>
                    <span className="lst-m">{m.lot}</span>
                    <span>{m.phase}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}

      {vide && (
        <>
          <div className="lst-panneau lst-empty">
            <h3 className="lst-title">
              {!dossier.length
                ? archives && filtres.folder === 'current' ? 'Le carnet courant est vide' : 'Aucun brassin pour le moment'
                : filtres.search.trim() && !sansRecherche ? `Aucun brassin avec ${filtres.search.trim()}` : 'Aucun brassin pour ces critères'}
            </h3>
            {!dossier.length && <p className="lst-unite" style={{ marginTop: 6, fontSize: 14 }}>{archives && filtres.folder === 'current' ? 'Tes anciennes fiches sont conservées dans Archives.' : 'Crée une recette, puis planifie son brassin.'}</p>}
            {dossier.length > 0 && (
              <div className="lst-btns">
                <button type="button" className="lst-btn lst-btn-primaire" onClick={() => (filtres.search.trim() && !sansRecherche ? onFiltres({ ...filtres, search: '' }) : toutEffacer())}>
                  {filtres.search.trim() && !sansRecherche ? 'Effacer la recherche' : 'Tout effacer'}
                </button>
                {archives > 0 && filtres.folder === 'current' ? (
                  <button type="button" className="lst-btn" onClick={() => onFiltres({ ...filtres, folder: 'archived' })}>Chercher dans Archives</button>
                ) : (
                  sansRecherche + (bornesPosees ? 1 : 0) > 0 && <button type="button" className="lst-btn" onClick={() => setFeuille(true)}>Voir les critères</button>
                )}
              </div>
            )}
            {dossier.length > 0 && houblons.length > 0 && (
              <div className="lst-near">
                <h4 className="lst-section" style={{ marginBottom: 8 }}>Houblons de tes brassins</h4>
                {houblons.map((h) => (
                  <button key={h.nom} type="button" className="lst-chip" onClick={() => onFiltres({ ...filtres, search: h.nom })}>
                    {couleurs[h.nom]?.length > 0 && <span className="lst-fam" aria-hidden>{couleurs[h.nom].map((c, i) => <i key={i} style={{ background: c }} />)}</span>}
                    {h.nom}
                    <small>{[h.style, h.dose ? `${Math.round(h.dose)} g` : ''].filter(Boolean).join(' · ')}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          {archives > 0 && filtres.folder === 'current' && (
            <button type="button" className="lst-arch" onClick={() => onFiltres({ ...filtres, folder: 'archived' })}>
              <Archive aria-hidden />
              <div><b className="lst-section">Archives</b><br /><span>{archives} brassin{archives > 1 ? 's' : ''} rangé{archives > 1 ? 's' : ''}</span></div>
              <ChevronRight aria-hidden style={{ marginLeft: 'auto' }} />
            </button>
          )}
        </>
      )}

      <FeuilleFiltres
        open={feuille}
        onClose={() => setFeuille(false)}
        ctx={ctx}
        kegs={kegs}
        resultats={resultats}
        onCriteres={onCriteres}
        onFiltres={onFiltres}
        onToutEffacer={toutEffacer}
        onOuvrir={(e) => { setFeuille(false); onOpenBatch(e.batch!); }}
        couleursHoublon={couleurs}
        onBilan={onBilan}
        notePeriodeApp={enPeriode(appPeriode).genre !== 'tout' ? `L’en-tête limite déjà les brassins terminés à « ${titre(enPeriode(appPeriode))} » ; ce choix s’y ajoute.` : undefined}
      />
    </div>
  );
}
