/** Les écrans du Carnet (liste, fiche d'article, Comparer, Choisir, carnet ouvert avec ses feuilles : note, modifier, renommer, supprimer) ;
 *  sortis de CarnetsVue.tsx : une fonction de rendu appelée en place, au même moment du rendu. */
import type React from 'react';
import type { CarnetDoc } from '../../domain/carnets/modele';
import { archiverCarnet, basculerVeille, changerSorte, choisir, deplacer, deplacerArticles, detacherPlan, liensQuiRetiennent, noteEnCritere, planSuitCarnet, poserPrixArticle,
  supprimerCarnet, supprimerNote, type EcritureCarnet } from '../../domain/carnets/operations';
import { mentionValeurs, tableau as tableauDe } from '../../domain/carnets/comparer';
import { analyserLigne, type LigneLocale } from '../../domain/carnets/analyseLocale';
import { carnetProche } from '../../domain/carnets/rattacher';
import { notesEnDouble } from '../../domain/carnets/doublons';
import type { AidesCarnet, ModeCarnetIA } from '../../config/carnetIA';
import type { MagasinCarnets } from '../../services/carnetsStore';
import { anciennesNotes, faitsDuPlanning } from '../../domain/carnets/anciens';
import { prixSemblable, type AchatPasse } from '../../domain/horizons';
import type { Rangement as Envoi } from './rangement';
import { ListeCarnets } from './ListeCarnets';
import { CarnetOuvert, type LienV, type RangeeV } from './CarnetOuvert';
import { CadreArrivee } from './CadreArrivee';
import { FicheArticle } from './FicheArticle';
import { Comparer, nonLusDe } from './Comparer';
import { Choisir } from './Choisir';
import { SupprimerCarnet } from './SupprimerCarnet';
import { FeuilleNote } from './FeuilleNote';
import { PictoObjet, pictoDe } from './pictos';
import { RenommerCarnet } from './RenommerCarnet';
import type { ArticleV } from './EtatIA';
import { jourIso } from './lignesRegles';
import type { ActionsCarnet } from './actionsCarnet';
import type { Appliquer, AvisIA, Boite, CarnetsVueProps, Etat, FinancesCarnet, Retour, RetourNeuf, Supprime, Vue } from './carnetsTypes';

export interface EcransV extends Pick<ActionsCarnet, 'enV' | 'ecrirePlanLie' | 'voirSortie' | 'planSuitLeChoix' | 'sortieV' | 'envoyerAVenir' | 'sortieFinie' | 'placer'
  | 'supprimerAvecPlan' | 'retirerCriteres' | 'dater' | 'auCalendrier' | 'prixDuCarnet' | 'planOuvert'> {
  p: CarnetsVueProps; ouvert: CarnetDoc | null; vue: Vue; setVue: Etat<Vue>; carnets: CarnetDoc[]; faitsPlanning: ReturnType<typeof faitsDuPlanning>;
  anciennes: ReturnType<typeof anciennesNotes>; enTete: string | undefined; retour: Retour | null; setRetour: (r: RetourNeuf | null) => void;
  supprime: Supprime | null; setSupprime: Etat<Supprime | null>; annuler: (inverse: EcritureCarnet[]) => void; repriseNode: React.ReactNode;
  bandeauIci: React.ReactNode; proposeesNode: React.ReactNode; rangee: RangeeV | null; cadre: () => React.ReactNode; champRef: Boite<HTMLTextAreaElement | null>;
  setTexte: Etat<string>; rangement: Envoi<LigneLocale>; rangeEnCours: string | null; tableauV: ReturnType<typeof tableauDe> | null; appliquer: Appliquer;
  magasin: MagasinCarnets; maintenant: () => Date; tauxEur: number | undefined; poserTaux: (t: number) => void; feuille: string | null;
  setFeuille: Etat<string | null>; edition: string | null; setEdition: Etat<string | null>; finances: FinancesCarnet; aides: AidesCarnet;
  titreEdite: string; renommerOuvert: (c: CarnetDoc, titre: string) => void; ouvrirRenommer: (c: CarnetDoc) => void;
  propositionTitre: (c: CarnetDoc) => { titre: string; phrase: string; messageId: string } | null;
  iaManquee: Readonly<Record<string, AvisIA['sorte']>>; mode: ModeCarnetIA; enLigne: boolean; liens: LienV[]; vientDEtreCree: string | null;
  setVientDEtreCree: Etat<string | null>; noteSupprimee: { id: string; inverse: EcritureCarnet[] } | null;
  setNoteSupprimee: Etat<{ id: string; inverse: EcritureCarnet[] } | null>; annulerSuppressionNote: (ns: { id: string; inverse: EcritureCarnet[] }) => void;
  autresPour: (id: string, texte: string) => { id: string; titre: string }[]; achatsPasses: AchatPasse[];
}

export function ecranCarnet(x: EcransV): React.ReactNode {
  const { p, ouvert, vue, setVue, carnets, faitsPlanning, anciennes, enTete, retour, setRetour, supprime, setSupprime, annuler, repriseNode, bandeauIci, proposeesNode,
    rangee, cadre, champRef, setTexte, rangement, rangeEnCours, tableauV, appliquer, magasin, maintenant, tauxEur, poserTaux, feuille, setFeuille, edition, setEdition,
    finances, aides, titreEdite, renommerOuvert, ouvrirRenommer, propositionTitre, iaManquee, mode, enLigne, liens, vientDEtreCree, setVientDEtreCree, noteSupprimee,
    setNoteSupprimee, annulerSuppressionNote, autresPour, achatsPasses, enV, ecrirePlanLie, voirSortie, planSuitLeChoix, sortieV, envoyerAVenir, sortieFinie, placer,
    supprimerAvecPlan, retirerCriteres, dater, auCalendrier, prixDuCarnet, planOuvert } = x;
  /** P33 (R20, g4:v01-11) : « ✎ Se modifie ici » à la place de la note modifiée, avec son texte ; ✕ Supprimer (G31). */
  const cadreModifier = (n: { id: string; texte: string }): React.ReactNode => {
    if (!ouvert) return null;
    const fermer = () => { setEdition(null); setTexte(''); };
    return <CadreArrivee cadre={{ sorte: 'modifier', texte: n.texte, onSupprimer: () => { const r = appliquer(supprimerNote(magasin.lire(), { carnetId: ouvert.id, noteId: n.id })); if (r) { setRetour(null); setNoteSupprimee({ id: n.id, inverse: r.inverse }); } fermer(); } }} onAnnuler={fermer} aides={aides} />;
  };

  /** Le picto de l'objet (lot B) quand l'article n'a pas de photo : déduit du nom, de la façon, puis du carnet. */
  const pictoArticle = (c: { title: string; carnet: { facons: readonly { id: string; nom?: string }[] } }, a: { nom?: string; faconId?: string; photo?: string }) =>
    a.photo ? undefined : <PictoObjet nom={pictoDe(a.nom, c.carnet.facons.find(f => f.id === a.faconId)?.nom, c.title)} taille={24} />;
  const pictosDe = (c: { title: string; carnet: { articles: readonly { id: string; nom?: string; faconId?: string; photo?: string }[]; facons: readonly { id: string; nom?: string }[] } }) =>
    Object.fromEntries(c.carnet.articles.map(a => [a.id, pictoArticle(c, a)] as const).filter(([, v]) => v));

  /* ---------- écrans ---------- */
  let ecran: React.ReactNode;
  if (!ouvert || vue.sorte === 'liste') {
    ecran = <ListeCarnets rangeEnCours={rangeEnCours} carnets={carnets.map(enV)} faits={faitsPlanning.map(enV)} anciennes={anciennes} enTete={enTete} messageRecent={retour?.bandeau.sorte === 'vrac' ? (retour.messageId ?? null) : null}
      supprime={supprime ? { titre: supprime.titre, statut: supprime.statut, onAnnuler: () => { annuler(supprime.inverse); if (supprime.plan) void ecrirePlanLie(supprime.plan); setSupprime(null); } } : null}
      enHaut={<>{repriseNode}{bandeauIci}{cadre()}</>}
      onOuvrir={id => { setVue({ sorte: 'carnet', id }); setRetour(null); }}
      onCollerLien={id => { setVue({ sorte: 'carnet', id }); setTimeout(() => champRef.current?.focus(), 0); }}
      onVoirAVenir={id => voirSortie(carnets.find(c => c.id === id))}
      onExemple={t => { setTexte(t); rangement.taper(t); champRef.current?.focus(); }} />;
  } else if (vue.sorte === 'article') {
    const a = ouvert.carnet.articles.find(x => x.id === vue.articleId);
    const ligne = tableauV?.lignes.find(l => l.articleId === vue.articleId);
    /* L-16 : l'ordre du tableau (articles en lice), sinon celui du carnet ; balayer ou ‹ › passe à l'article voisin */
    const ordre = (() => { const t = (tableauV?.lignes ?? []).filter(l => !l.ecarte).map(l => l.articleId); return t.includes(vue.articleId) ? t : ouvert.carnet.articles.map(x => x.id); })();
    const ici = ordre.indexOf(vue.articleId);
    const voisin = (d: number) => { const id = ordre[ici + d]; return id ? () => setVue({ sorte: 'article', id: ouvert.id, articleId: id }) : undefined; };
    const suivant = voisin(1), precedent = voisin(-1);
    ecran = a ? <FicheArticle key={a.id} article={a as unknown as ArticleV} titreCarnet={ouvert.title} critere={ouvert.carnet.criteres[0]}
      {...(suivant ? { onSuivant: suivant } : {})} {...(precedent ? { onPrecedent: precedent } : {})}
      onPrix={centimes => {
        const r = appliquer(poserPrixArticle(magasin.lire(), { carnetId: ouvert.id, articleId: a.id, centimes }));
        const doc = r?.ecritures.find(e => e.op === 'put' && (e as { doc: CarnetDoc }).doc.id === ouvert.id) as { doc: CarnetDoc } | undefined;
        if (doc && ouvert.carnet.choix?.articleId === a.id) void planSuitLeChoix(doc.doc);
      }}
      facon={ouvert.carnet.facons.find(f => f.id === a.faconId)} {...(ligne?.rang ? { rang: ligne.rang, sur: tableauV!.lignes.filter(l => !l.ecarte).length } : {})}
      choisi={ouvert.carnet.choix?.articleId === a.id}
      onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })}
      onVeille={() => { appliquer(basculerVeille(magasin.lire(), { carnetId: ouvert.id, articleId: a.id, le: maintenant().toISOString() })); }}
      carnet={ouvert.carnet as never} onOffre={articleId => setVue({ sorte: 'article', id: ouvert.id, articleId })}
      onChoisir={() => setVue({ sorte: 'choisir', id: ouvert.id })} /> : null;
  } else if (vue.sorte === 'comparer') {
    ecran = <Comparer titre={ouvert.title} statut={ouvert.status} critere={ouvert.carnet.criteres[0]} tableau={tableauV} taux={tauxEur} facons={ouvert.carnet.facons.length}
      onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })} onOuvrirArticle={articleId => setVue({ sorte: 'article', id: ouvert.id, articleId })}
      nonLus={nonLusDe(ouvert.carnet.articles as never)} pictos={pictosDe(ouvert)} mention={mentionValeurs(ouvert.carnet.articles)}
      onChoisir={() => setVue({ sorte: 'choisir', id: ouvert.id })} />;
  } else if (vue.sorte === 'choisir') {
    const choix = ouvert.carnet.choix;
    const nom = (id: string) => { const a = ouvert.carnet.articles.find(x => x.id === id); return a?.nom ?? a?.domaine ?? 'lien'; };
    if (choix) {
      const a = ouvert.carnet.articles.find(x => x.id === choix.articleId)!;
      ecran = <Choisir etape="choisi" titre={ouvert.title} choix={choix as never} article={a as unknown as ArticleV} critere={ouvert.carnet.criteres[0]} carnet={ouvert.carnet as never} picto={pictoArticle(ouvert, a)}
        facon={ouvert.carnet.facons.find(f => f.id === (choix.faconId ?? a?.faconId))} ecartes={choix.ecartes.map(e => ({ nom: nom(e.articleId), raison: e.raison }))}
        remplaces={choix.remplaces.map(r => ({ nom: nom(r.articleId), pourquoi: r.pourquoi, le: r.le }))} sortie={sortieV(ouvert)}
        onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })} onEnvoyerAVenir={() => void envoyerAVenir(ouvert)} onVoirAVenir={() => voirSortie(ouvert)} {...(sortieFinie(ouvert) ? {} : { onPlacer: () => void placer(ouvert) })} />;
    } else {
      const rangees = (tableauV?.lignes ?? []).filter(l => !l.ecarte);
      /* critique 6, n° 4 : « Retenir la hotte » : le premier de cette façon (g05-11), sinon le premier du tableau */
      const faconVoulue = vue.faconId;
      const dansFacon = faconVoulue ? rangees.find(l => ouvert.carnet.articles.find(x => x.id === l.articleId)?.faconId === faconVoulue) : undefined;
      const premier = ouvert.carnet.articles.find(x => x.id === (dansFacon ?? rangees[0])?.articleId) ?? ouvert.carnet.articles[0];
      ecran = premier ? <Choisir etape="choisir" titre={ouvert.title} carnet={ouvert.carnet as never} picto={pictoArticle(ouvert, premier)} article={premier as unknown as ArticleV} sur={Math.max(rangees.length, 1)} valeurs={[]}
        autres={rangees.slice(1).map((l, i) => ({ article: ouvert.carnet.articles.find(x => x.id === l.articleId) as unknown as ArticleV, rang: l.rang ?? i + 2 }))}
        onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })}
        onChoisir={pourquoi => { const r = appliquer(choisir(magasin.lire(), { carnetId: ouvert.id, articleId: premier.id, ...(premier.faconId ? { faconId: premier.faconId } : {}), pourquoi, le: maintenant().toISOString() })); if (r) { const choisi = r.ecritures.find(e => e.op === 'put' && (e as { doc: CarnetDoc }).doc.id === ouvert.id) as { doc: CarnetDoc } | undefined; if (choisi) void envoyerAVenir(choisi.doc); } if (r) setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse, carnetId: ouvert.id }); }}
        onEcarter={() => setVue({ sorte: 'comparer', id: ouvert.id })} /> : null;
    }
  } else {
    const c = ouvert;
    const note = feuille ? c.carnet.notes.find(n => n.id === feuille) : undefined;
    const noteEditee = edition && vue.sorte === 'carnet' ? c.carnet.notes.find(n => n.id === edition) : undefined;
    const enVeille = c.carnet.articles.filter(a => a.veille?.active).map(a => a.id);
    /* P20 (G35) : le carnet proche de celui qu'on supprime (`carnetProche`, lot A), pour y déplacer ses articles en veille */
    const proche = vue.sorte === 'supprimer' && enVeille.length ? carnetProche(c, carnets) : null;
    const finance = { plans: finances.plans, transactions: finances.transactions, payments: finances.payments };
    /* P9 (g4:v02-18) : la carte de suppression prend la place du bandeau, sous le titre et la phrase, au-dessus de Ce qui compte : à
       l'écran sans défiler ; le reste du carnet est estompé derrière (`.cn-grise`, qui épargne `.cn-supprimer`). */
    const carteSupprimer = vue.sorte !== 'supprimer' ? null : <SupprimerCarnet titre={c.title} contenu={c.carnet as never}
      liens={liensQuiRetiennent(c, finance.plans, finance.transactions, finance.payments)}
      proche={proche ? { titre: proche.titre, onDeplacer: () => { appliquer(deplacerArticles(magasin.lire(), { depuis: c.id, vers: proche.carnetId, articleIds: enVeille })); } } : null}
      onDetacher={() => { appliquer(detacherPlan(magasin.lire(), { carnetId: c.id, ...finance })); }}
      {...(/* L-14 : un plan sans facture liée part avec le carnet, d'un toucher ; Annuler rend les deux */
        liensQuiRetiennent(c, finance.plans, finance.transactions, finance.payments).every(l => !(finance.transactions ?? []).some(t => t.finance?.planId === l.planId))
          ? { onSupprimerAvecPlan: (planId: string) => void supprimerAvecPlan(c, planId) } : {})}
      onArchiver={() => { const r = appliquer(archiverCarnet(magasin.lire(), { carnetId: c.id, le: maintenant().toISOString(), raison: 'plan réalisé' })); if (r) { setVue({ sorte: 'liste' }); setRetour({ bandeau: { sorte: 'archive', titre: c.title }, inverse: r.inverse }); } }}
      onSupprimer={() => { const r = appliquer(supprimerCarnet(magasin.lire(), { carnetId: c.id, ...finance })); if (r) { setSupprime({ titre: c.title, statut: c.status, inverse: r.inverse }); setVue({ sorte: 'liste' }); } }}
      onGarder={() => setVue({ sorte: 'carnet', id: c.id })} />;
    /* n° 26 : renommer garde l'en-tête et le contenu ; le cadre se pose à la place du titre (carnets-fil.css, `.cnf-renommer`) */
    const cadreRenommer = vue.sorte === 'renommer' ? (() => {
      const pr = propositionTitre(c);
      return <RenommerCarnet titre={c.title} aides={aides} proposition={pr} champBas={{ valeur: titreEdite }} onRenommer={t => renommerOuvert(c, t)} onAnnuler={() => setVue({ sorte: 'carnet', id: c.id })} />;
    })() : null;
    /* n° 2 (g5:v04-4) : un seul bandeau après la création ; les puces proposées attendent qu'il parte */
    const proposees = retour?.bandeau.sorte === 'cree' ? null : proposeesNode;
    /* n° 24 : l'IA n'est pas passée pour ce carnet (éteinte, hors ligne, échec du dernier envoi) ; prop du lot B, passée telle quelle */
    const manque = iaManquee[c.id];
    const iaIndisponible = mode === 'eteint' ? 'eteinte' : !enLigne ? 'hors-ligne' : manque === 'eteint' ? 'eteinte' : manque ?? null;
        ecran = <>
      <CarnetOuvert carnet={enV(c)} taux={tauxEur} onTaux={poserTaux} aides={aides as never} liens={liens} tableau={tableauV} iaIndisponible={iaIndisponible}
        bandeau={cadreRenommer ?? carteSupprimer ?? (repriseNode || bandeauIci || proposees ? <>{repriseNode}{bandeauIci}{proposees}</> : null)} rangee={carteSupprimer || cadreRenommer ? null : rangee} cadre={carteSupprimer || cadreRenommer ? null : cadre()}
        vientDEtreCree={vientDEtreCree === c.id} doublons={aides.doublon ? notesEnDouble(c).flat() : []}
        noteSupprimee={noteSupprimee ? { id: noteSupprimee.id, onAnnuler: () => annulerSuppressionNote(noteSupprimee) } : null}
        feuille={noteEditee ? { noteId: noteEditee.id, contenu: cadreModifier(noteEditee) } : note ? { noteId: note.id, contenu: <FeuilleNote note={note as never} aides={aides as never}
          ressembleCritere={aides.noteEnCritere && analyserLigne(note.texte).sorte === 'critere'}
          onPasserCritere={() => { appliquer(noteEnCritere(magasin.lire(), { carnetId: c.id, noteId: note.id })); setFeuille(null); }}
          onModifier={() => { setEdition(note.id); setTexte(note.texte); setFeuille(null); setTimeout(() => champRef.current?.focus(), 0); }}
          onChangerEnFacon={() => { appliquer(changerSorte(magasin.lire(), { carnetId: c.id, cible: 'note', id: note.id, vers: 'facon' })); setFeuille(null); }}
          onChangerEnCritere={() => { appliquer(changerSorte(magasin.lire(), { carnetId: c.id, cible: 'note', id: note.id, vers: 'critere' })); setFeuille(null); }}
          onSupprimer={() => { const r = appliquer(supprimerNote(magasin.lire(), { carnetId: c.id, noteId: note.id })); if (r) { setRetour(null); setNoteSupprimee({ id: note.id, inverse: r.inverse }); } setFeuille(null); }}
          carnets={autresPour(c.id, note.texte)}
          onDeplacer={vers => { const titre = carnets.find(x => x.id === vers)?.title ?? 'un autre carnet'; const r = appliquer(deplacer(magasin.lire(), { cible: 'note', id: note.id, depuis: c.id, vers })); if (r) setRetour({ bandeau: { sorte: 'ailleurs', carnet: titre }, inverse: r.inverse, carnetId: c.id }); setFeuille(null); }}
          onFermer={() => setFeuille(null)} /> } : null}
        grise={vue.sorte === 'supprimer'}
        onRetour={() => { setVue({ sorte: 'liste' }); setVientDEtreCree(null); }}
        onRenommer={() => ouvrirRenommer(c)}
        onSupprimer={() => setVue({ sorte: 'supprimer', id: c.id })}
        onNote={id => setFeuille(f => (f === id ? null : id))}
        onOuvrirArticle={articleId => setVue({ sorte: 'article', id: c.id, articleId })}
        onComparer={() => setVue({ sorte: 'comparer', id: c.id })}
        onRetenirFacon={faconId => setVue({ sorte: 'choisir', id: c.id, faconId })}
        onVeille={articleId => { appliquer(basculerVeille(magasin.lire(), { carnetId: c.id, articleId, le: maintenant().toISOString() })); }}
        onVoirChoix={() => setVue({ sorte: 'choisir', id: c.id })}
        onRetirerCritere={(...ids) => retirerCriteres(c, ids)}
        onEnvoyerAVenir={() => void envoyerAVenir(c)}
        aujourdhui={jourIso(maintenant())}
        onDater={(lundi, precision) => dater(c, lundi, precision)}
        {...(sortieFinie(c) ? {} : { onAuCalendrier: () => void auCalendrier(c) })}
        prix={{ centimes: prixDuCarnet(c), semblable: prixSemblable({ nom: c.title }, achatsPasses) }}
        onPrix={x => {
          const r = appliquer({ ok: true, ecritures: [{ op: 'put', doc: { ...c, estimatedCost: x / 100 } }], inverse: [{ op: 'put', doc: c }], avis: 'Prix estimé' });
          /* L-11 : le prix posé au carnet est celui de son plan (À venir, Calendrier) */
          const pl = planOuvert(c);
          if (r && pl) { const n = planSuitCarnet(pl, { centimes: x }); if (n !== pl) void ecrirePlanLie(n); }
        }}
        onOuvrirLien={l => (l.sorte === 'realise' && p.onVoirRealises ? p.onVoirRealises() : p.onVoirAVenir?.())} />
    </>;
  }
  return ecran;
}
