/**
 * Le carnet ouvert (R03, figés p2:h05-3 et p2:i06-4, **sans** la rangée « Ajouter à … : quoi ? », D-114 ; R12 base g5:v03-6 :
 * ✎ près du titre, ··· par note, un seul champ en bas).
 * De haut en bas : « ‹ Carnets », l'état (« Idée · 15 nov. », « À comparer », « Choisi le … »), ···, le titre et son ✎ (G28),
 * sa phrase citée (R25), les pastilles « lié à » (R33, R47), le bandeau et le cadre du geste en cours (slots), Ce qui compte (G5).
 * Tout juste créé (R11, g5:v04-4) : en tête « ●○○○ idée », l'encadré « Idée · 17 nov. / Ensuite : l'IA cherche les façons », et
 * chaque rubrique dit qui agit, Photos comprise (« Photos · aucune », seulement dans cet état).
 * Façons et articles (P5, P38 ; figé h05-3) : dès le 2e article, le tableau du carnet range les articles **dans leur façon** : chaque
 * façon a son nom, ses prix et sa pastille sur le critère (« capte la buée » / « ne capte pas la buée ») ; chaque ligne a son rang, sa
 * vignette (photo ou picto), son nom sur 2 lignes au plus, son origine et son délai (« CH · sur commande »), l'œil de la veille ; les
 * colonnes sont la valeur qui classe et le prix, en-têtes courts avec l'unité. Un lien dont la page n'est pas lue n'est jamais classé :
 * ligne « ? Lien sans aperçu · à relire · Ouvrir ↗ » sous le tableau (P6, `Tableau.aRelire`). Puis la conclusion « Le critère sépare
 * les deux façons : … · Retenir la hotte », de l'IA si elle l'a dite (`separe`), sinon calculée sur place avec `passe()` (picto local).
 * Toucher « Articles » ouvre la feuille des cartes (P12, figé h03-5) : photo, valeur du critère en gros, réglette, « Veiller ».
 * Avant le 2e article : les façons en cartes et l'article en carte. Notes : chaque note porte son genre et son picto (G22).
 */
import { domaineParMots } from './domaineMots';
import { domaineDe } from '../../domain/carnets/domaines';
import { PastilleDomaine } from './Domaines';
import { sousDomainesProposes } from '../../domain/carnets/arbre';
import React, { useEffect, useRef, useState } from 'react';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { comptesCarnet, pluriel } from '../../domain/carnets/comptes';
import { estLienSeul } from '../../domain/carnets/modele';
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Ellipsis, FileText, GitFork, Pencil, Target } from 'lucide-react';
import { filDe as filDuCarnet } from '../../domain/carnets/fil';
import { etatDe, etatOption, genreDe, jourLocal as jourDeIso, optionRetenue } from '../../domain/carnets/suivi';
import type { CarnetDoc, GenreCarnet } from '../../domain/carnets/modele';
import { BarreEtat } from './BarreEtat';
import { ChipGenre, PastilleCategorie } from './EnTeteGenre';
import { FilCarnetVue } from './FilCarnet';
import { OptionsProbleme, RangeeJetons } from './OptionsProbleme';
import { FilAncienARanger } from './FilAncienARanger';
import { CarteReclasser } from './CarteReclasser';
import { notePlanningDe } from '../../domain/carnets/taches';
import { propositionFilAncien } from '../../domain/carnets/filAncien';
import { QuestionPourquoi } from './QuestionPourquoi';
import { CarteFermerParAchat, ResoluProbleme } from './ResoluProbleme';
import { achatConstate, resumeJetons } from './filRegles';
import { Bandeau } from './Bandeau';
import { dateCourte, texteSortie, type ArticleV, type CritereV } from './EtatIA';
import { LigneRangee } from './LigneRangee';
import { phraseEnTitre } from './ListeCarnets';
import { PREFIXE_PLANNING } from '../../domain/carnets/anciens';
import { Photos } from './Photos';
import { titreAffiche } from './titre';
import { liesParNbsp } from './insecable';
import { VignetteObjet } from './pictos';
import { sansApercu } from './Comparer';
import { etendue, etiquetteStatut, provenanceCritere, separationDe } from './ouvertCalculs';
import { FeuilleCartes } from './FeuilleCartes';
import { jourLocal, RubriqueQuand } from './RubriqueQuand';
import { LigneNote } from './LigneNote';
import { useCriteresCarnet } from './CriteresCarnet';
import { rubriqueArticles } from './ArticlesCarnet';
import type { CarnetOuvertProps, RangeeV } from './carnetOuvertTypes';

export type { CarnetOuvertProps, LienV, RangeeV } from './carnetOuvertTypes';
export { enMinuscule, nier, nomCourt, provenanceCritere, separationDe, texteMoinsBien, type Separation } from './ouvertCalculs';
export { colonnesCarnet, enteteCourt } from './TableauCarnet';

/* ---------- le carnet ---------- */

/** C69-3 : « Décidé » : la rangée ne garde que le coût de la retenue (200 CHF), plus de piste ni de somme ; avant, elle dit tout le diagnostic. */
function coutEnTete<T extends { trouve: number; pasTrouve: number; devis: unknown; total: unknown; fourchette?: unknown; retenu?: unknown } | null>(r: T, decide: boolean): T {
  return decide && r ? { ...r, trouve: 0, pasTrouve: 0, devis: null, total: null, fourchette: null } : r;
}

/** f13 tour 2 (n° 5) : la bande de l'en-tête du carnet tout juste créé (g5:v04-4) ; inactive, ses enfants seuls. */
function Bande({ active, children }: { active: boolean; children: React.ReactNode }) {
  return active ? <div className="cn-bande">{children}</div> : <>{children}</>;
}

export function CarnetOuvert(p: CarnetOuvertProps) {
  const c = p.carnet, k = c.carnet;
  /* k1d (h05-3, i06-4) : un projet porté du Planning a pour titre le nom de la tâche, pas sa phrase ; son budget vient du Planning */
  /* R101 (c75) : un projet du Planning se reconnaît aussi à sa note « À faire du … au … (Planning, …) » : un id recopié ou renommé ne le fait pas perdre sa date (le relevé réel a des ids sans préfixe) */
  const notePl = k.notes.map(n => notePlanningDe(n.texte)).find(Boolean);
  const duPlanning = c.id.startsWith(PREFIXE_PLANNING) || !!notePl;
  const debutPlanning = duPlanning ? notePl?.du : undefined;
  const finPlanning = duPlanning ? notePl?.au : undefined;
  const provenance = (el: CritereV): string | null =>
    duPlanning && String(el.origine) === 'vous' ? (/Planning/.test(el.texte) ? null : 'repris du Planning') : provenanceCritere(el);
  const avecProv = (el: CritereV) => { const x = provenance(el); return x ? ` · ${x}` : ''; };
  /* tour 3, PCN-109 : la pastille R47 dit le lien vers À venir ; la ligne de sortie sous le choix ne le redit pas */
  const sortieEnPastille = !!k.sortie?.planId && p.liens.some(l => l.id === k.sortie!.planId);
  const [menu, setMenu] = useState(false);
  /* critique 6, n° 22 (R21) : le menu « Renommer / Supprimer l'idée » se ferme dès qu'on choisit (✎ compris), à Échap et au toucher
     ailleurs ; il ne reste jamais au-dessus du cadre de renommage. */
  const refMenu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    const ailleurs = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (refMenu.current && t && !refMenu.current.contains(t) && !(t instanceof Element && t.closest('[aria-label="Plus"]'))) setMenu(false);
    };
    window.addEventListener('keydown', touche);
    window.addEventListener('pointerdown', ailleurs);
    return () => { window.removeEventListener('keydown', touche); window.removeEventListener('pointerdown', ailleurs); };
  }, [menu]);
  const [cartes, setCartes] = useState(false);
  /* BL-3 : le ⋯ de la ligne Articles (retirer, déplacer) */
  const [gererArticles, setGererArticles] = useState(false);
  const [versArticle, setVersArticle] = useState<string | null>(null);
  /* L-21 (23.11, M4-22) : une rubrique Notes vue dans ce carnet ouvert ne disparaît pas quand sa dernière note est rangée ailleurs
     (en critère par l'IA) : elle dit « aucune ». La mise en page ne change pas sous les yeux. */
  const notesVues = useRef<{ id: string; vu: boolean }>({ id: c.id, vu: false });
  if (notesVues.current.id !== c.id) notesVues.current = { id: c.id, vu: false };
  if (k.notes.length > 0) notesVues.current.vu = true;
  const r = p.rangee;
  const critere = k.criteres.find(x => x.caracteristique) ?? k.criteres[0];
  /* critique 6, n° 15 : les comptes viennent de `comptesCarnet`, comme la liste et la suppression */
  const n = comptesCarnet(k);
  const enDouble = new Set(p.aides.doublon ? p.doublons ?? [] : []);
  const question = k.facons.length === 2 ? `${k.facons[0].nom} ou ${k.facons[1].nom} ?` : null;
  /* D451 : le carnet vu comme son document (le contrat des vues est ce document tel quel), son genre posé, son état, son fil */
  const doc = c as unknown as CarnetDoc;
  const genrePose = doc.carnet.genre?.valeur;
  /* C67-3 : l'écran du carnet tout juste créé (en-tête d'idée) cède AUSSITÔT quand il pose un autre genre (··· › Problème, Mémo) : sans sortir ni revenir */
  /* R68 (C67B-6) : et quand l'IA (ou le calcul local) le range « problème » à la création : l'écran du problème (Noté · Je cherche · Décidé · Résolu) s'ouvre d'emblée, jamais l'écran idée
     (« Ensuite : l'IA cherche les façons ») ; la liste disait déjà « Je cherche » : le genre posé, par qui que ce soit, fait l'écran. */
  const genreChoisi = !!genrePose && genrePose !== 'idee' && genrePose !== 'achat';
  const neuf = !!p.vientDEtreCree && c.status === 'idea' && !genreChoisi;
  const genre: GenreCarnet = genreDe(doc);
  /* l'en-tête du genre seulement pour un carnet dont le genre est posé (par l'IA ou par lui), hors achat ; un carnet ancien garde son en-tête (règle n° 1 : rien de plus) */
  const enteteGenre = !neuf && !!genrePose && genrePose !== 'achat';
  const etatSuivi = etatDe(doc);
  const messages = p.messages ?? [];
  const annee = Number((p.aujourdhui ?? jourDeIso(new Date().toISOString())).slice(0, 4));
  const rap = p.rappels;
  const filVu = neuf ? null : filDuCarnet(doc, messages);
  const filAncien = neuf ? null : propositionFilAncien(doc, messages);
  const problemeResolu = enteteGenre && genre === 'probleme' && etatSuivi === 'resolu';
  const [achatEcarte, setAchatEcarte] = useState(false);
  const achat = enteteGenre && genre === 'probleme' && etatSuivi === 'decide' && !achatEcarte
    ? achatConstate(doc, messages, k.sortie?.etat === 'realise') : null;
  const titreCarnet = (id: string) => p.carnetsVers?.find(x => x.id === id)?.titre;
  /* CRN-21 (critique carnet 21.11) : la note qui arrive (carnet neuf, ou note ajoutée) vient au-dessus du champ du bas ; sinon
     « Notes 1 » touche le champ et la note est dessous. 'nearest' : un défilement minimal, rien si elle se voit déjà ;
     scroll-margin (carnets.css, `.cn-notes > *`) lit --cn-champ-h et --cn-clavier, comme le bandeau. */
  const notesRef = useRef<HTMLDivElement>(null);
  const nbNotes = useRef(neuf ? 0 : k.notes.length);
  useEffect(() => {
    const avant = nbNotes.current; nbNotes.current = k.notes.length;
    if (k.notes.length <= avant) return;
    const el = notesRef.current?.lastElementChild as HTMLElement | null | undefined;
    if (!el) return;
    if (typeof requestAnimationFrame !== 'function') { el.scrollIntoView?.({ block: 'nearest' }); return; }
    const id = requestAnimationFrame(() => el.scrollIntoView?.({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [k.notes.length]);

  /* P6 : les liens non lus, jamais classés ; le contrat de comparer.ts (`aRelire`), sinon lus sur le carnet */
  const aRelire: ArticleV[] = p.tableau
    ? ((p.tableau as { aRelire?: ArticleV[] }).aRelire ?? k.articles.filter(a => sansApercu(a) && !a.prixCentimes && !Object.keys(a.valeurs).length))
    : [];

  const encadre = (cible: RangeeV['cible'], id: string, noeud: React.ReactNode) =>
    r && r.cible === cible && r.id === id
      ? <LigneRangee key={id} phrase={r.phrase} rangeSur={r.rangeSur} onAnnuler={r.onAnnuler} onVotreTexte={r.onVotreTexte} onDeplacer={r.onDeplacer} onChangerEnNote={r.onChangerEnNote}>{noeud}</LigneRangee>
      : <React.Fragment key={id}>{noeud}</React.Fragment>;

  const { criteres, tete, texteTete, boutonCriteres, rangeeCritere, listeCriteres, ligneCritere } = useCriteresCarnet(p, k, r, provenance, avecProv);
  /* n° 19 (h05-3) : la ligne d'état sous le titre, « 2 façons à comparer · attendre l'avis du ferblantier » (le « à faire » du carnet, tel
     qu'il l'a écrit) ; rien d'inventé, rien à 0. */
  /* CRN-7 (vision au doigt, 21.11) : la note des dates d'un projet du Planning (« À faire du … au … (Planning, …) ») est déjà la note
     du carnet ; elle n'est pas redite sous le titre. Archivé, rien n'est plus « à faire » (CRN-8). */
  const notePlanning = (t: string) => duPlanning && /\(Planning[^)]*\)\s*$/.test(t);
  const aFaire = c.carnet.archive ? undefined : k.notes.find(x => x.genre === 'a-faire' && !notePlanning(x.texte))?.texte;
  /* n° 15 et 28 : « 2 façons à comparer » (les façons en lice, comme la liste), sinon « 2 articles à comparer » ; accordés. */
  const etatTete = c.status === 'validated' || neuf ? null
    : p.tableau ? (n.facons >= 2 ? `${pluriel(n.facons, 'façon')} à comparer` : `${pluriel(n.articles, 'article')} à comparer`)
      : n.facons >= 2 ? pluriel(n.facons, 'façon') : null;
  const texteEtat = (etatTete || (aFaire && !neuf && c.status !== 'validated'))
    ? <span>{etatTete && <span>{etatTete}</span>}{etatTete && aFaire ? <span className="cn-mut"> · </span> : null}{aFaire && <span className="cn-mut">{aFaire}</span>}</span>
    : null;
  /* D437 (carnet-domaine.png) : la pastille du domaine au bout de la ligne d'état ; un toucher ouvre les cinq domaines. Le carnet tout juste
     créé garde l'en-tête de sa maquette (g5:v04-4). */
  const pastille = neuf ? null : <PastilleDomaine domaine={domaineDe(c, domaineParMots)} onDomaine={p.onDomaine} />;
  const ligneEtat = texteEtat || pastille ? <div className="cn-ligne-etat cnd-etat">{texteEtat}{pastille}</div> : null;
  const ia = !p.iaIndisponible;
  /* tour 3, PCN-113 : créé hors ligne, rien n'est encore rangé : une ligne dit que l'IA le range au retour du réseau, sans rubriques vides */
  const enAttente = neuf && p.iaIndisponible === 'hors-ligne' && !k.criteres.length && !k.facons.length && !k.articles.length && !k.notes.length && !k.photos.length;
  /* tout juste créé, le bandeau cite déjà sa phrase (g5:v04-4 ; n° 39 : jamais deux fois). Critique 6, n° 30 (R25) : la phrase citée
     dit ce qu'elle est, « votre phrase : « … » », jamais des guillemets seuls qui flottent ; n° 14 : pas une seconde fois si la ligne
     rangée la cite déjà. */
  /* C72-6 (maquette v01-vapeur : la bulle suffit) : la phrase est déjà la première bulle du fil, une ligne « votre phrase : « … » » la redirait juste dessous */
  const dejaEnBulle = !!k.phrase && messages.some(m => normaliser(m.carnetMessage.texte) === normaliser(k.phrase));
  const phraseCitee = k.phrase && !duPlanning && !p.vientDEtreCree && !dejaEnBulle && !(r?.phrase && normaliser(r.phrase) === normaliser(k.phrase)) ? (phraseEnTitre(c.title, k.phrase)
    ? <p className="cn-cite" data-en-titre>votre phrase en titre</p>
    /* D451 disparaît n° 5 : « votre lien : « https://… » » ne se dit plus ; la barre de lecture du lien montre déjà le lien. Une phrase reste citée (R25). */
    : estLienSeul(k.phrase) ? null : <p className="cn-cite">votre phrase : « {k.phrase} »</p>) : null; /* f5d n° 11 */

  const articleRange = r?.cible === 'article' ? k.articles.find(a => a.id === r.id) : undefined;
  const faconRange = articleRange?.faconId ? k.facons.find(f => f.id === articleRange.faconId) : undefined;

  const sep = p.tableau ? separationDe(k) : null;
  const conclusion = p.separe
    ? { texte: p.separe.texte, retenir: p.separe.retenir, onRetenir: p.separe.onRetenir, ia: true }
    : sep ? { texte: sep.texte, retenir: sep.retenir, onRetenir: () => (p.onRetenirFacon ? p.onRetenirFacon(sep.retenue.id) : p.onComparer()), ia: false } : null;

  /* f13 tour 2 (n° 6, g5:v04-4) : les rubriques à filet du carnet neuf portent des pictos de 20 px, verts et centrés (carnets.css) */
  const picto = neuf ? 20 : 18;

  return (
    <article className={`cn-page cn-ouvert${p.grise ? ' cn-grise' : ''}`} aria-label={titreAffiche(c.title)}>
      {/* Tour 3, f13 tour 2 (critique n° 5, g5:v04-4) : tout juste créé, en-tête, titre et encadré sur la bande teintée de sa maquette,
          fermée par un filet ; ailleurs, rien ne les enveloppe. */}
      <Bande active={neuf}>
      <div className={`cn-tete${enteteGenre ? ' cnp-tete' : ''}`}>
        <button type="button" className="cn-retour" aria-label="Carnets" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden />{!enteteGenre && ' Carnets'}</button>
        {/* D451 (maquettes2/v01) : un genre posé met le titre dans la barre, avec la pastille de sa catégorie */}
        {enteteGenre ? <h2 className="cn-titre cn-sp">{liesParNbsp(titreAffiche(c.title))}</h2> : <span className="cn-sp" />}
        {enteteGenre && <PastilleCategorie c={doc} onDomaine={p.onDomaine} onRanger={p.onRanger} sousDomaines={sousDomainesProposes(p.carnetsDocs ?? [doc], domaineParMots)} />}
        {/* critique 6, n° 32 : ailleurs, l'état n'a qu'une forme, la pastille (g05-1 « Idée », h05-3 : la ligne d'état la remplace quand elle
            dit « 2 façons à comparer »). Tour 3, f13 (PCN-27, R11, règle n° 1) : tout juste créé, l'en-tête de sa maquette g5:v04-4,
            « ●○○○ idée » ; la date est dans l'encadré dessous, pas en pastille. */}
        {neuf
          ? <span className="cn-etapes" aria-label="Étape : idée"><span className="cn-etape-on" /><span /><span /><span /><span className="cn-lien-texte">idée</span></span>
          : !enteteGenre && !(etatTete && c.status === 'research') && <span className={`cn-pastille cn-statut-${c.status}`}>{etiquetteStatut(c)}</span>}
        <button type="button" className="cn-ico" aria-label="Plus" aria-expanded={menu} onClick={() => setMenu(m => !m)}><Ellipsis size={22} aria-hidden /></button>
        {/* tour 3, PCN-154 : le menu flotte sous ···, hors du flux (le titre ne descend plus) */}
        {menu && (
          <div ref={refMenu} className="cn-feuille cn-menu" role="menu">
            <button type="button" role="menuitem" className="cn-feuille-item" onClick={() => { setMenu(false); p.onRenommer(); }}><Pencil size={18} aria-hidden /> Renommer</button>
            {rap?.onGenre && (['probleme', 'memo', 'recolte', 'idee'] as const).map(g => (
              <button key={g} type="button" role="menuitemradio" aria-checked={genrePose === g} className="cn-feuille-item cnp-menu-genre" onClick={() => { setMenu(false); if (genrePose !== g) rap.onGenre!(g); }}>
                {genrePose === g ? <Check size={18} aria-hidden /> : <span className="cnp-menu-vide" aria-hidden />} {{ probleme: 'Problème', memo: 'Mémo', recolte: 'Récolte', idee: 'Idée' }[g]}</button>
            ))}
            <button type="button" role="menuitem" className="cn-feuille-item cn-rouge" onClick={() => { setMenu(false); p.onSupprimer(); }}>
              {/* L-22 (23.11, M2-18, glossaire) : le même mot dans chaque état ; un carnet choisi n'est plus une idée (PCN-189) */}
              Supprimer le carnet</button>
          </div>
        )}
      </div>
      {/* D451 disparaît n° 6 : le crayon visible du titre ne se montre plus ; « Renommer » reste au menu ⋯ (aucun geste perdu) */}
      {!enteteGenre && (
        <div className="cn-titre-ligne">
          {/* f13 tour 2 (n° 4) : « Embouteillage », sa majuscule ; le titre stocké ne change pas */}
          <h2 className="cn-titre">{liesParNbsp(titreAffiche(c.title))}</h2>
        </div>
      )}
      {/* D451 : la barre d'état d'un problème (Noté, Je cherche, Décidé, Résolu), ou la puce du genre (mémo, récolte, idée) */}
      {enteteGenre && (genre === 'probleme'
        ? <BarreEtat etat={etatSuivi} onEtat={rap?.onEtat} />
        : <ChipGenre c={doc} annee={annee} />)}
      {/* Tour 3, f13 (PCN-27, R11, règle n° 1) : tout juste créé, sa maquette g5:v04-4 telle quelle : l'encadré « Idée · 17 nov. / Ensuite :
          l'IA cherche les façons » entre le titre et le bandeau « ✓ Carnet créé · ↺ Annuler » (la critique 6, n° 16, l'avait retiré contre
          la maquette). Sans IA, la suite ne promet rien d'elle (n° 24) : « Ensuite : collez un lien » ; hors ligne, la ligne « au retour du
          réseau » dit déjà la suite : l'encadré ne garde que l'état. */}
      {neuf && (
        <div className="cn-encadre-idee">
          <b className="cn-att">{etiquetteStatut(c)}</b>
          {!enAttente && <b>Ensuite : {ia && k.facons.length === 0 ? "l'IA cherche les façons" : k.articles.length === 0 ? 'collez un lien' : ia ? "l'IA compare" : 'comparez les articles'}</b>}
        </div>
      )}
      </Bande>
      {/* P9 (vision 1) : la confirmation, le bandeau et le cadre du geste restent juste sous le titre, avant la ligne d'état et le tableau :
          à 390 ils doivent être à l'écran quand on les touche */}
      {p.bandeau}
      {p.cadre}
      {/* R95 (c74c) : un fil d'avant le suivi se range à l'ouverture par l'analyse locale : la carte propose, rien n'est écrit avant « Ranger » */}
      {/* R98 (c75) : un carnet écrit avant les correctifs de rangement ; la carte dit ce qui change, un toucher l'applique (Annuler rend) */}
      {!neuf && rap?.reclasser && <CarteReclasser proposition={rap.reclasser.proposition} onReclasser={rap.reclasser.onReclasser} />}
      {filAncien && rap?.onRangerFil &&<FilAncienARanger proposition={filAncien} onRanger={avecResolu => rap.onRangerFil!(filAncien, avecResolu)} />}
      {!enteteGenre && ligneEtat}
      {/* D451 : un problème. Je cherche : les jetons du diagnostic sur une rangée ; les options en deux colonnes ; Décidé : « Fermer grâce à l'achat ? »
          si l'achat est dit, la question honnête si ses notes ne disent pas pourquoi ; Résolu : l'écran du résolu (avant / après, tampon, tuiles). */}
      {enteteGenre && !problemeResolu && genre === 'probleme' && (etatSuivi === 'cherche' || etatSuivi === 'note' || etatSuivi === 'decide') && <RangeeJetons resume={coutEnTete(resumeJetons(messages, c.id, optionRetenue(doc)?.id, new Set(doc.carnet.facons.filter(f => etatOption(f) === 'ecartee').map(f => f.id))), etatSuivi === 'decide')} {...(etatSuivi === 'decide' ? { nom: 'Coût de la retenue' } : {})} />}
      {enteteGenre && !problemeResolu && <OptionsProbleme c={doc} onOption={rap?.onOption} messages={messages} />}
      {achat && <CarteFermerParAchat option={achat.nom} onOui={() => rap?.onFermerParAchat?.(achat.id)} onAnnuler={() => setAchatEcarte(true)} />}
      {enteteGenre && !problemeResolu && genre === 'probleme' && etatSuivi === 'decide' && <QuestionPourquoi c={doc} messages={messages} onEcrire={rap?.onEcrire} />}
      {problemeResolu && (
        <ResoluProbleme c={doc} carnets={p.carnetsDocs ?? [doc]} messages={messages} rappels={rap} liens={p.liens} annee={annee} onRelecture={p.onRelecture}
          nbFil={filVu?.total}
          fil={filVu && <FilCarnetVue c={doc} fil={filVu} messages={messages} annee={annee} rappels={rap} titreCarnet={titreCarnet} onNote={p.onNote} fait />} />
      )}
      {/* h05-3 : la ligne Critère juste sous la ligne d'état, puis le tableau (n° 1) */}
      {!neuf && !problemeResolu && ligneCritere}
      {/* L4-5 : titre = phrase (normalisé) → « votre phrase en titre », une fois ; tout juste créé, le bandeau le dit déjà (g5:v04-4).
          Sinon la phrase citée (R25) : sous le titre tant qu'il n'y a pas de tableau ; avec le tableau, sous lui (le tableau monte). */}
      {!p.tableau && phraseCitee}

      {/* tour 3, f4c (PCN-42) : grisé derrière la carte de suppression, le lien est dit par la carte ; la pastille ne le double pas */}
      {/* CRN-9 (g05-1, i06-1) : le lien vers Matériel tient en une ligne, « Dans À venir depuis le 16 nov. · Voir › » ; le titre du
          carnet n'y est pas redit (un seul lien) ; avec plusieurs liens, chacun dit son plan. */}
      {p.liens.length > 0 && !p.grise && (
        <div className="cn-liens">
          {p.liens.slice(0, 3).map(l => {
            const ou = l.sorte === 'a-venir' ? 'À venir' : 'Réalisés';
            const quoi = p.liens.length > 1 ? ` · ${l.libelle}` : '';
            const depuis = dateCourte(l.le) ? ` depuis le ${dateCourte(l.le)}` : '';
            const texte = l.etat === 'supprime' ? `Supprimé côté ${ou}${quoi}` : `Dans ${ou}${depuis}${quoi}`;
            return l.etat === 'present' && p.onOuvrirLien
              ? (
                <button key={`${l.sorte}:${l.id}`} type="button" className="cn-lien-ligne" onClick={() => p.onOuvrirLien!(l)}>
                  <CalendarCheck size={18} aria-hidden /><span className="cn-sp">{texte}</span>
                  <span className="cn-lien">Voir <ChevronRight size={16} aria-hidden /></span>
                </button>
              )
              : <p key={`${l.sorte}:${l.id}`} className="cn-lien-ligne cn-mut"><CalendarCheck size={18} aria-hidden /><span className="cn-sp">{texte}</span></p>;
          })}
          {p.liens.length > 3 && <span className="cn-mut">+{p.liens.length - 3} autres</span>}
        </div>
      )}


      {c.status === 'validated' && k.choix && (
        <div className="cn-choisi-resume">
          <button type="button" className="cn-carte cn-choisi-ligne" onClick={p.onVoirChoix}>
            {(() => { const ch = k.articles.find(a => a.id === k.choix!.articleId); return <VignetteObjet photo={ch?.photo} mots={[ch?.nom, c.title]} classe="cn-vignette-petite" taille={30} />; })()}
            <span className="cn-sp"><b>Choisi : {k.articles.find(a => a.id === k.choix!.articleId)?.nom ?? 'article'}</b><span className="cn-mut">{k.choix.pourquoi}</span></span>
            <span className="cn-lien">Pourquoi <ChevronRight size={16} aria-hidden /></span>
          </button>
          {k.sortie
            ? !sortieEnPastille && <p className="cn-avenir-ligne"><CalendarCheck size={18} aria-hidden /> {texteSortie(k.sortie)}</p>
            : p.onEnvoyerAVenir && <button type="button" className="cn-action" onClick={p.onEnvoyerAVenir}><CalendarCheck size={18} aria-hidden /> Envoyer dans À venir</button>}
        </div>
      )}

      {/* n° 2 (g5:v04-4) : tout juste créé, « Ce qui compte » est une rubrique à filet comme les autres, jamais un encadré ; sans
          critère, « rien encore : l'IA le proposera » (sans promesse quand l'IA manque, n° 24). Ailleurs, la ligne Critère est en haut. */}
      {enAttente && <p className="cn-mut cn-attente" data-attente="hors-ligne">L'IA le range au retour du réseau : ce qui compte, façons, articles. Rien n'est perdu.</p>}
      {!enAttente && neuf && criteres.length > 0 && (
        <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Ce qui compte">
          {criteres.length === 0
            ? <p className="cn-rubrique-tete"><Target size={picto} aria-hidden /> <b>Ce qui compte</b> <span className="cn-mut">· rien encore{ia ? " : l'IA le proposera" : ''}</span></p>
            : <>
              <p className="cn-rubrique-tete cn-cqc-ligne"><Target size={18} aria-hidden /> <b>Ce qui compte</b> {tete.length > 0 && <span className="cn-cqc-texte">· {texteTete}</span>}{boutonCriteres}</p>
              {rangeeCritere}
              {listeCriteres}
            </>}
        </section>
      )}

      {/* Sans tableau : les façons en cartes (i06-4). Avec tableau : elles sont dans le tableau, avec leur pastille (h05-3). */}
      {!enAttente && !p.tableau && !enteteGenre && k.facons.length > 0 && (
        <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Façons">
          {k.facons.length === 0 ? (
            <p className="cn-rubrique-tete"><GitFork size={picto} aria-hidden /> <b>Façons</b> <span className="cn-mut">· aucune{ia ? " : l'IA les cherche" : ''}</span></p>
          ) : (
            <>
              <h3 className="cn-rubrique-tete">{question ?? <><GitFork size={18} aria-hidden /> Façons</>}{/* tour 3, f5c n° 5 : une seule façon, sa carte est juste dessous : le compte la redirait */}{k.facons.length >= 2 && <> <span className="cn-mut cn-nowrap">{pluriel(k.facons.length, 'façon')}</span></>}</h3>
              <div className="cn-facons">
                {k.facons.map(f => {
                  const sesArticles = k.articles.filter(a => a.faconId === f.id);
                  const prix = etendue(sesArticles.map(a => a.prixCentimes).filter((x): x is number => typeof x === 'number'));
                  const carte = (
                    <div className={`cn-facon cn-facon-${f.etat}`}>
                      <b>{f.nom}</b>
                      {prix ? <span className="cn-mono">{prix}</span> : <span className="cn-mut">aucun article encore</span>}
                      {f.raison && f.etat === 'ouverte' && <span className="cn-mut">{f.raison}</span>}
                      {f.etat === 'retenue' && f.raison && <span className="cn-pastille cn-pastille-plein">{f.raison}</span>}
                      {f.etat === 'ecartee' && f.raison && <span className="cn-pastille">{f.raison}</span>}
                      {f.etat === 'ouverte' && !sesArticles.length && <span className="cn-pastille">à chercher</span>}
                    </div>
                  );
                  return encadre('facon', f.id, carte);
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* D451 disparaît n° 4 : « Articles · collez un lien » ne paraît que s'il sert (un article, un choix, un carnet d'achat, ou le carnet tout juste créé) */}
      {!enAttente && !problemeResolu && (neuf || k.articles.length > 0 || !!k.choix || genrePose === 'achat' || (!enteteGenre && !!p.tableau)) && rubriqueArticles({ p, c, k, n, neuf, picto, cartes, setCartes, r, critere, articleRange, faconRange, aRelire, sep, conclusion,
        gerer: gererArticles, setGerer: setGererArticles, vers: versArticle, setVers: setVersArticle })}

      {/* tour 3, v1-neuf 6 : sous le tableau, « votre phrase en titre » flotterait seul, loin du titre : il ne se dit que sous le titre */}
      {p.tableau && !phraseEnTitre(c.title, k.phrase ?? '') && phraseCitee}

      {/* D451 : une photo rangée avec un message est dans sa bulle du fil ; seules celles que le fil ne montre pas restent en galerie */}
      {enAttente || problemeResolu ? null : (() => {
        const horsFil = neuf ? k.photos : k.photos.filter(ph => !ph.messageId || !messages.some(m => m.id === ph.messageId));
        return horsFil.length === 0 ? null : <Photos photos={horsFil} />;
      })()}

      {!enAttente && neuf && (k.notes.length > 0 || p.noteSupprimee || notesVues.current.vu) && <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Notes">
        {k.notes.length === 0 && !p.noteSupprimee ? (
          <p className="cn-rubrique-tete"><FileText size={picto} aria-hidden /> <b>Notes</b> <span className="cn-mut">· aucune</span></p>
        ) : (
          <>
            <h3 className="cn-rubrique-tete"><FileText size={18} aria-hidden /> Notes <span className="cn-mut cn-mono">{k.notes.length}</span></h3>
            <div className="cn-notes" ref={notesRef}>
              {k.notes.map((n, i) => (
                <React.Fragment key={n.id}>
                  {p.noteSupprimee && i === 0 && !p.noteSupprimee.apres && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                  {encadre('note', n.id, <LigneNote note={n} doublon={enDouble.has(n.id)} onNote={p.onNote} fait={!!c.carnet.archive} />)}
                  {p.feuille?.noteId === n.id && p.feuille.contenu}
                  {p.noteSupprimee?.apres === n.id && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                </React.Fragment>
              ))}
              {p.noteSupprimee && k.notes.length === 0 && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
            </div>
          </>
        )}
      </section>}

      {/* D451 disparaît n° 4 et 8 : « Notes n » en cartes, et la carte « À faire du … au … (Planning, …) », deviennent le fil : le jour en pastille, ses bulles, les
          jetons dessous. L'idée de L-21 reste : un fil vu dans ce carnet ne disparaît pas quand sa dernière note est rangée ailleurs, il dit « aucune note ». */}
      {!enAttente && !neuf && !problemeResolu && filVu && (filVu.total > 0 || p.noteSupprimee || notesVues.current.vu) && (
        <section className="cnp-fil-zone" aria-label="Fil">
          {filVu.total === 0 && !p.noteSupprimee
            ? <p className="cn-rubrique-tete"><FileText size={picto} aria-hidden /> <b>Fil</b> <span className="cn-mut">· aucune note</span></p>
            : <FilCarnetVue c={doc} fil={filVu} messages={messages} annee={annee} rappels={rap} titreCarnet={titreCarnet} onNote={p.onNote} doublons={enDouble} fait={!!c.carnet.archive}
              entourer={(noteId, noeud) => (
                <React.Fragment key={noteId}>
                  {p.noteSupprimee && !p.noteSupprimee.apres && noteId === k.notes[0]?.id && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                  {encadre('note', noteId, noeud)}
                  {p.feuille?.noteId === noteId && p.feuille.contenu}
                  {p.noteSupprimee?.apres === noteId && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                </React.Fragment>
              )} />}
          {p.noteSupprimee && k.notes.length === 0 && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
        </section>
      )}

      {/* D451 disparaît n° 4 : « Quand » ne paraît que s'il sert : une date posée, un achat, une idée ; pas pour un problème, un mémo ou une récolte sans date */}
      {!enAttente && !problemeResolu && p.onDater && (!enteteGenre || !!c.date || genre === 'idee') && <RubriqueQuand {...(debutPlanning ? { planning: debutPlanning, ...(finPlanning ? { planningAu: finPlanning } : {}) } : {})} date={c.date} precision={c.precision} aujourdhui={p.aujourdhui ?? jourLocal()} neuf={neuf} picto={picto}
        onDater={p.onDater} onAuCalendrier={p.onAuCalendrier} prix={p.prix} onPrix={p.onPrix} />}

      {p.vientDEtreCree && <p className="cn-mut cn-g6">Le champ en bas range tout ici : une phrase, un lien collé, une photo.</p>}

      {cartes && p.tableau && (
        <FeuilleCartes carnet={k} titre={c.title} tableau={p.tableau} aRelire={aRelire} onFermer={() => setCartes(false)}
          onOuvrir={id => { setCartes(false); p.onOuvrirArticle(id); }} onVeille={p.onVeille} taux={p.taux} onTaux={p.onTaux}
          onRetirer={p.onRetirerArticle} onDeplacer={p.onDeplacerArticle} carnetsVers={p.carnetsVers} />
      )}
    </article>
  );
}
