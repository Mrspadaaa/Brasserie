/** Le champ du bas et l'aperçu de ce qu'on tape (le cadre « avant / pendant », « Va dans », la bulle du critère qui tranche) ;
 *  sortis de CarnetsVue.tsx : une fonction de rendu appelée en place ; `cadre` reste une fonction, appelée là où le conteneur l’appelait. */
import type React from 'react';
import { estLienSeul, titreDePhrase, type CarnetDoc } from '../../domain/carnets/modele';
import { consequenceApercu, critereQuiTranche } from '../../domain/carnets/comparer';
import { analyserTexte, PUCES_VA_DANS, vaDansDe, type LigneLocale, type RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import { aucunCarnetNEnParle, nommeLeCarnet, rattacher } from '../../domain/carnets/rattacher';
import { doublonsDe } from '../../domain/carnets/doublons';
import type { lireCarnets, lireMessages } from '../../domain/carnets/modele';
import type { AidesCarnet, ModeCarnetIA } from '../../config/carnetIA';
import { AVIS, planVrac, type EtatRangement, type Rangement as Envoi } from './rangement';
import { ChampCarnet } from './ChampCarnet';
import { CadreArrivee, type CadreV } from './CadreArrivee';
import { NoteEnVrac } from './NoteEnVrac';
import { dateCourte, EtatIA, type ArticleV } from './EtatIA';
import { BarreLecture, LectureLien, type SaisieLienMort } from './LectureLien';
import { CARNET_NEUF, destinationDans, estLaPhrase, memeTexte, prefixeDe, rappelVers, sansAutreSujet } from './envoiRegles';
import { AIDE_AVANT_JUSQU_A, AVIS_IA, EXEMPLES_CREER, exemplesNeufs, vuesVrac } from './lignesRegles';
import type { Annonce, Boite, Etat, Jointe, Retour, Supprime, Vue } from './carnetsTypes';

/** G14 : le lien que tient le presse-papier, seulement si c'est un lien seul ; sans permission ou sans API, rien (refus silencieux). */
async function lirePresse(): Promise<string | undefined> {
  try {
    const t = (await navigator.clipboard?.readText?.())?.trim();
    if (!t) return undefined;
    const l = analyserTexte(t);
    return l.length === 1 && l[0].url ? l[0].url : undefined;
  } catch { return undefined; }
}

export interface ApercuV {
  ouvert: CarnetDoc | null; vue: Vue; setVue: Etat<Vue>; retour: Retour | null; etatR: EtatRangement<LigneLocale>; edition: string | null; feuille: string | null;
  lignesApercu: ReturnType<typeof analyserTexte>; texte: string; setTexte: Etat<string>; carnets: ReturnType<typeof lireCarnets>; tous: ReturnType<typeof lireCarnets>;
  messages: ReturnType<typeof lireMessages>; corrigeCarnet: string | null; setCorrigeCarnet: Etat<string | null>; corrige: RubriqueVaDans | null;
  setCorrige: Etat<RubriqueVaDans | null>; envoiActif: Boite<{ envoi: Envoi<LigneLocale>; depuis: string | null } | null>; depuis: string | null;
  couperEnvoi: () => void; aides: AidesCarnet; annonces: Boite<Map<string, Annonce>>; mode: ModeCarnetIA; enLigne: boolean; focusListe: boolean;
  setFocusListe: Etat<boolean>; supprime: Supprime | null; rangement: Envoi<LigneLocale>; champRef: Boite<HTMLTextAreaElement | null>;
  ajouterEnFacon: (brut: string, carnetId: string) => void; aPart: boolean; setAPart: Etat<boolean>; titreEdite: string; setTitreEdite: Etat<string>;
  renommerOuvert: (c: CarnetDoc, titre: string) => void; envoyer: () => Promise<void>; vientDEtreCree: string | null; plierApresToucher: () => void;
  photo: (fichier: File) => Promise<void>; jointe: Jointe | null; retirerJointe: () => void; pliage: Boite<ReturnType<typeof setTimeout> | undefined>;
  presse: string | undefined; setPresse: Etat<string | undefined>;
  lectureUi: LectureUi;
  /** D451 : la recherche de Résolus › Relecture, tapée dans le champ du bas (« Chercher dans les résolus… »). */
  requeteRelecture: string; setRequeteRelecture: Etat<string>;
  /** C56-5 : les messages en échec que le bandeau de reprise porte déjà (avec son Relire) : l'avis de l'aperçu ne le redit pas. */
  aReprendre: readonly { messageId: string; echec?: true }[];
}

/** IA-ETAPES-VISIBLES (D448) : ce que la carte des étapes et sa barre repliée lisent et font, fourni par CarnetsVue. */
export interface LectureUi {
  replie: boolean; setReplie: (v: boolean) => void;
  /** T30-1, T30-3 : la lecture est dans la vue du lien (carnet du collage) ; sinon la carte vit en barre repliée, en bas. */
  ici: boolean;
  /** La carte est en barre : repliée par le brasseur, ou hors de la vue du lien. */
  enBarre: boolean;
  /** Le message dont la carte de fin ou d'échec a été fermée. */
  fermee: string | null; setFermee: (messageId: string | null) => void;
  exemple: boolean;
  onEscalader: (messageId: string, texte: string) => void;
  /** T30-2 : « Compléter » un lien mort : le nom (et le prix) que le brasseur a écrits. */
  onCompleter: (messageId: string, saisie: SaisieLienMort) => void;
  /** T30-5 : les questions de la carte de fin déjà réglées d'un « C'est le bon », et le geste qui en règle une. */
  bons: (messageId: string) => readonly string[];
  marquerBon: (messageId: string, cle: string) => void;
  /** T28-2 : déplier la carte depuis la barre repliée ; ouvre le carnet du lien s'il n'est pas celui qu'on a sous les yeux. */
  deplier: (messageId: string) => void;
  onAutreLien: (messageId: string) => void;
  articleDe: (messageId: string) => { article: ArticleV; carnetId: string } | null;
  titreDe: (messageId: string) => string | undefined;
  ouvrirArticle: (carnetId: string, articleId: string) => void;
}

export function apercuCarnet(x: ApercuV) {
  const { ouvert, vue, setVue, retour, etatR, edition, feuille, lignesApercu, texte, setTexte, carnets, tous, messages, corrigeCarnet, setCorrigeCarnet, corrige,
    setCorrige, envoiActif, depuis, couperEnvoi, aides, annonces, mode, enLigne, focusListe, setFocusListe, supprime, rangement, champRef, ajouterEnFacon, aPart,
    setAPart, titreEdite, setTitreEdite, renommerOuvert, envoyer, vientDEtreCree, plierApresToucher, photo, jointe, retirerJointe, pliage, presse, setPresse, lectureUi, aReprendre, requeteRelecture, setRequeteRelecture } = x;
  const tranche = ouvert ? critereQuiTranche(ouvert) : null;
  /* n° 5 et 21 : la bulle G8 seulement pour « ajouter · avant » (carnet au repos, champ pris et vide : ChampCarnet tient le focus) ;
     jamais sous un retour, une IA en cours ou une modification */
  const suggestion = tranche && vue.sorte === 'carnet' && !retour && etatR.etape !== 'en-cours' && !edition && !feuille
    ? { critere: tranche.critere.texte, a: tranche.entre[0], b: tranche.entre[1] } : null;
  const consequence = ouvert && lignesApercu.length ? consequenceApercu(ouvert, lignesApercu) : null;
  const autoBrut = ouvert && vue.sorte === 'carnet' && !edition ? vaDansDe(texte) : null;
  /* n° 3 : le carnet visé pendant la frappe (même calcul qu'à l'envoi), corrigeable d'un toucher */
  const destCalculee = ouvert && vue.sorte === 'carnet' && !edition && texte.trim() ? destinationDans(texte, ouvert, carnets) : null;
  const destChoisie = destCalculee ? corrigeCarnet ?? destCalculee.carnetId : null;
  const titreDe = (id: string) => (id === CARNET_NEUF ? `Nouveau carnet ${destCalculee?.titre ?? ''}` : tous.find(c => c.id === id)?.title ?? '');
  const vers = ouvert && destChoisie && destChoisie !== ouvert.id ? titreDe(destChoisie) : undefined;
  /* tour 3, f5 (n° 1) : la phrase de renvoi (« autre projet, sans rapport : ») n'est jamais un critère : une note, citée sans elle */
  const horsSujetVu = vers ? sansAutreSujet(texte) : null;
  const auto: RubriqueVaDans | null = autoBrut && horsSujetVu ? 'note' : autoBrut;
  const vaDansCarnet = ouvert && destCalculee && (destCalculee.carnetId !== ouvert.id || (corrigeCarnet && corrigeCarnet !== ouvert.id))
    ? { options: [...new Set([destCalculee.carnetId, corrigeCarnet, ouvert.id].filter((x): x is string => !!x))].map(id => ({ id, libelle: id === ouvert.id ? 'Ici' : titreDe(id) })),
      choisi: destChoisie!, onChoisir: (id: string) => setCorrigeCarnet(id) }
    : null;
  const rubriqueChoisie = auto ? corrige ?? auto : null;
  const RUBRIQUE_LIBELLE = { critere: 'Ce qui compte', facon: 'Façons', note: 'Notes' } as const;
  /* P25, P26 : une seule ligne d'état à la fois. Le retour de ce message est affiché (créer, note en vrac, IA éteinte, hors ligne, échec) :
     il est l'état ; ni roue dessous, ni « ✓ Rangé » en double. Sinon l'IA en cours se dit, puis s'efface à sa réponse. */
  const retourDuMessage = (messageId: string) => !!retour && retour.messageId === messageId;
  const cadre = (): React.ReactNode => {
    if (etatR.etape === 'en-cours') {
      /* D448 : la lecture d'un lien montre ses étapes (début v05+v06, milieu v03) ; repliée, elle vit dans la barre au-dessus du champ (v01) */
      if (etatR.lecture) {
        /* T28-4 : la relecture « IA plus forte » garde la carte d'échec (bouton éteint, étape qui tourne) ; une lecture neuve montre ses étapes */
        if (lectureUi.enBarre) return null;
        return etatR.lecture.escalade
          ? <LectureLien lecture={etatR.lecture} phase="echec" relecture="en-cours" exemple={lectureUi.exemple} onReplier={() => lectureUi.setReplie(true)} />
          : <LectureLien lecture={etatR.lecture} phase="en-cours" exemple={lectureUi.exemple} onReplier={() => lectureUi.setReplie(true)} />;
      }
      /* n° 7 (g5:v01-15) : la note en vrac envoyée : « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », la découpe annoncée dessous */
      const an = annonces.current.get(etatR.messageId);
      if (an?.sorte === 'vrac' && !retourDuMessage(etatR.messageId)) {
        return <NoteEnVrac etat="pendant" enCours lignes={an.vues} texteOrigine={etatR.texte} origine={mode === 'production' ? 'ia' : 'exemple'} nbCarnets={an.carnets} onAnnuler={couperEnvoi} />;
      }
      if (!retourDuMessage(etatR.messageId)) return <EtatIA etat="en-cours" quoi={etatR.texte} onAnnuler={couperEnvoi} />;
    }
    /* D448 : la lecture finie (fin, v01+v03+v05) ou le lien mort (échec, base+v03, T26-4), tant que la carte n'est pas fermée ni la frappe reprise */
    if ((etatR.etape === 'range' || etatR.etape === 'echec') && etatR.lecture?.etapes?.length && lectureUi.fermee !== etatR.messageId && !texte.trim() && !edition) {
      const id = etatR.messageId, l = etatR.lecture;
      const fermer = () => lectureUi.setFermee(id);
      if (etatR.etape === 'echec' && l.statut === 'introuvable') {
        /* T30-1 : la carte d'échec (ses gestes mènent à ce carnet) n'est montrée que dans la vue du lien */
        if (!lectureUi.ici) return null;
        return <LectureLien lecture={l} phase="echec" relecture={l.escalade ? 'finie' : 'aucune'} exemple={lectureUi.exemple} onFermer={fermer} onEscalader={() => lectureUi.onEscalader(id, etatR.texte)}
          onAutreLien={() => lectureUi.onAutreLien(id)} onCompleter={s => lectureUi.onCompleter(id, s)} onRetirer={fermer} />;
      }
      if (etatR.etape === 'range' && !lectureUi.enBarre) {
        const a = lectureUi.articleDe(id);
        /* T28-2 : vue d'un autre carnet (ou de la liste, ou à la réouverture), la carte de fin nomme l'article et le carnet */
        const ailleurs = !!a && (!ouvert || ouvert.id !== a.carnetId);
        return <LectureLien lecture={l} phase="fin" exemple={lectureUi.exemple} article={l.reouverture || ailleurs ? a?.article ?? null : null} {...(ailleurs ? { carnet: lectureUi.titreDe(id) } : {})} onFermer={fermer}
          bons={lectureUi.bons(id)} onBon={cle => lectureUi.marquerBon(id, cle)}
          {...(a ? { onOuvrirArticle: () => lectureUi.ouvrirArticle(a.carnetId, a.article.id) } : {})} />;
      }
    }
    /* T28-3 : un lien mort a sa carte d'échec ; « L'IA n'a pas répondu : rangé sur place » serait faux (rien n'est rangé) */
    if ((etatR.etape === 'echec' || etatR.etape === 'hors-ligne') && !(etatR.etape === 'echec' && etatR.lecture?.statut === 'introuvable') && !retourDuMessage(etatR.messageId) && !texte.trim()
      /* C56-5 (R28) : UN seul avis d'échec : le bandeau de reprise (« L'IA n'a pas répondu : … [Relire] ») le porte déjà, en ligne */
      && !(etatR.etape === 'echec' && enLigne && aReprendre.some(x => x.echec && x.messageId === etatR.messageId))) {
      return <EtatIA etat={etatR.etape} quoi={etatR.etape === 'echec' && etatR.avis === AVIS.pause ? etatR.avis : AVIS_IA[etatR.etape]} />;
    }
    if (edition) return null;
    if (!texte.trim()) {
      /* P28 (R09) : Créer · avant, le champ de la liste pris, vide (g5:v03-2 ; G1 puces exemples ; G2 « Une note en vrac marche aussi. ») */
      /* jamais sous un retour affiché (une note en vrac rangée, un carnet supprimé) : une chose à la fois */
      /* la liste vide (figé p2:i02-2, lot B) dit déjà tout cela : rien en double */
      const neufs = exemplesNeufs(EXEMPLES_CREER, carnets.map(c => c.title));
      if (!depuis && focusListe && carnets.length > 0 && carnets.length <= AIDE_AVANT_JUSQU_A && neufs.length > 0 && !retour && !supprime && etatR.etape !== 'en-cours') {
        return <CadreArrivee cadre={{ sorte: 'avant', exemples: neufs, onExemple: t => { setTexte(t); rangement.taper(t); champRef.current?.focus(); } }} onAnnuler={() => champRef.current?.blur()} aides={aides} />;
      }
      return null;
    }
    if (!depuis) {
      if (lignesApercu.length > 1) {
        /* la découpe annoncée : celle que l'envoi appliquera (même `planVrac`) ; le compteur compte le carnet neuf une fois */
        const plan = planVrac(lignesApercu, t => rattacher(t, carnets), prefixeDe(texte));
        return <NoteEnVrac etat="pendant" lignes={vuesVrac(plan)} texteOrigine={texte} origine="locale" nbCarnets={plan.carnets} onAnnuler={() => setTexte('')} />;
      }
      /* CRN-6 : un rappel dont un carnet parle : le cadre annonce une note de ce carnet */
      const rappel = rappelVers(texte, carnets);
      if (rappel) return <CadreArrivee cadre={{ sorte: 'texte', rubrique: 'Notes', texte, origine: 'locale', vers: rappel.titre }} onAnnuler={() => setTexte('')} aides={aides} />;
      const pr = rattacher(texte, carnets);
      /* tour 3, f5b n° 12 : un lien seul collé depuis la liste, quand un carnet parle déjà de l'objet : l'article va dans ce carnet (même
         calcul qu'à l'envoi), jamais un carnet titré du domaine ni une façon */
      if (pr && estLienSeul(texte)) {
        const url = lignesApercu.find(l => l.url)?.url ?? texte.trim();
        return <CadreArrivee cadre={{ sorte: 'lien', url, phase: 'avant', depuisListe: true, vers: pr.titre, lecturePossible: mode !== 'eteint' && enLigne }} onAnnuler={() => setTexte('')} aides={aides} />;
      }
      /* n° 2 : la phrase entière n'est pas son propre critère (« Ce qui compte » reste à l'IA), seulement un critère tiré d'elle */
      const critere = lignesApercu.find(l => l.sorte === 'critere' && !estLaPhrase(l.texte, texte));
      /* tour 3, f5b n° 3 : la phrase nomme le carnet proche lui-même (« Ventilation de la salle ») : « Ouvrir ce carnet », le champ se vide */
      const ouvrir = !!pr && nommeLeCarnet(texte, pr.titre);
      const c: CadreV = { sorte: 'creer', titre: titreDePhrase(texte),
        /* lot 11 (L-30, hors lot du lot 2) : « Y ajouter en façon » ajoute vraiment la phrase en façon du carnet proche, puis l'ouvre */
        proche: pr ? { titre: pr.titre, ...(ouvrir ? { ouvrir } : {}), onAjouter: () => { if (ouvrir) { setTexte(''); setVue({ sorte: 'carnet', id: pr.carnetId }); } else ajouterEnFacon(texte, pr.carnetId); } } : null,
        ...(pr ? {} : { raisonNeuf: !estLienSeul(texte)
          ? `${aucunCarnetNEnParle(carnets.length)} : nouveau carnet, votre phrase en titre`
          : mode !== 'eteint' && enLigne
            ? 'L’IA lit la page, puis range le lien dans le carnet qui en parle, sinon dans un nouveau, nommé d’après le besoin'
            : `${aucunCarnetNEnParle(carnets.length)} : nouveau carnet, le site en titre` }),
        ...(critere ? { ceQuiCompte: critere.texte } : {}) };
      return <CadreArrivee cadre={c} onAnnuler={() => setTexte('')} aides={aides} />;
    }
    const l0 = lignesApercu[0];
    if (l0?.url) return <CadreArrivee cadre={{ sorte: 'lien', url: l0.url, phase: 'avant', lecturePossible: mode !== 'eteint' && enLigne }} onAnnuler={() => setTexte('')} aides={aides} />;
    const rubrique = rubriqueChoisie ? RUBRIQUE_LIBELLE[rubriqueChoisie] : l0?.sorte === 'critere' ? 'Ce qui compte' : l0?.sorte === 'article' ? 'Articles' : 'Notes';
    /* P18 (G11) : la phrase répète une note du carnet (`doublons.ts`, pendant la frappe) : « Même chose que la note du … · Garder à part » */
    /* n° 10 : une phrase déjà gardée à part (message `gardeAPart`) ne repropose pas la fusion ; la note visée doit être dans le carnet
       où la phrase va (un autre carnet annoncé, n° 3 : pas de fusion proposée ici) */
    const dejaAPart = messages.some(m => m.carnetMessage.gardeAPart && memeTexte(m.carnetMessage.texte, texte));
    const dbl = aides.doublon && !aPart && !dejaAPart && !vers && ouvert ? doublonsDe(texte, ouvert.carnet.notes)[0] : undefined;
    const noteDbl = dbl && ouvert ? ouvert.carnet.notes.find(n => n.id === dbl.noteId) : undefined;
    const leDbl = noteDbl ? dateCourte(noteDbl.modifieeLe ?? messages.find(m => m.id === noteDbl.messageId)?.carnetMessage.le ?? ouvert?.carnet.creeLe) : null;
    const doublon = noteDbl ? { le: leDbl ?? '', texte: noteDbl.texte, onGarderAPart: () => setAPart(true) } : null;
    return <CadreArrivee cadre={{ sorte: 'texte', rubrique, texte: horsSujetVu ?? texte, origine: 'locale', ...(vers ? { vers } : {}), ...(vaDansCarnet && auto ? { rangeeGenre: true } : {}) }} onAnnuler={() => { setTexte(''); setAPart(false); setCorrigeCarnet(null); }} consequence={vers ? null : consequence} aides={aides} doublon={doublon} />;
  };
  const renomme = vue.sorte === 'renommer' && ouvert ? ouvert : null;
  const champ = vue.sorte === 'relecture' ? (
    <ChampCarnet valeur={requeteRelecture} inputRef={champRef} onChange={setRequeteRelecture} onEnvoyer={() => champRef.current?.blur()} invite="Chercher dans les résolus…" libelleEnvoi="Chercher" />
  ) : renomme ? (
    /* n° 26 (g4:v01-13) : le titre dans le champ du bas, « Renommer », puis « Annuler · Entrée = renommer » */
    <ChampCarnet valeur={titreEdite} inputRef={champRef} onChange={setTitreEdite} onEnvoyer={() => renommerOuvert(renomme, titreEdite)}
      titreCarnet={renomme.title} libelleEnvoi="Renommer"
      pied={<div className="cnf-renommer-pied"><button type="button" className="cn-lien" onClick={() => setVue({ sorte: 'carnet', id: renomme.id })}>Annuler</button><span className="cn-sp" /><span className="cn-mut cn-aide-clavier">Entrée = renommer</span></div>} />
  ) : (
    <ChampCarnet valeur={texte} inputRef={champRef}
      onChange={t => { setTexte(t); if (!t.trim()) { setCorrige(null); setCorrigeCarnet(null); } if (!edition) rangement.taper(t); }}
      onEnvoyer={() => void envoyer()}
      vaDansCarnet={vaDansCarnet}
      {...(ouvert && vue.sorte !== 'liste' ? { titreCarnet: ouvert.title, libelleEnvoi: edition ? 'Enregistrer' : 'Ajouter' } : {})}
      {...(/* f13 tour 3 (critique n° 4, g5:v04-4) : le carnet tout juste créé, son champ dit le texte de sa maquette */ ouvert && vue.sorte === 'carnet' && !edition && vientDEtreCree === ouvert.id && ouvert.status === 'idea' ? { invite: 'Écrire, ou coller un lien…' } : {})}
      onBlurChamp={plierApresToucher}
      onPhoto={f => void photo(f)}
      jointe={jointe ? { lecture: !jointe.jpeg, ...(jointe.jpeg ? { apercu: jointe.jpeg } : {}) } : null}
      onRetirerJointe={retirerJointe}
      suggestion={vue.sorte === 'carnet' ? suggestion : null}
      vaDans={auto ? { options: [...PUCES_VA_DANS], choisi: rubriqueChoisie!, onChoisir: id => setCorrige(id as RubriqueVaDans) } : null}
      coller={presse} onColler={() => { if (presse) { setTexte(presse); rangement.taper(presse); setPresse(undefined); } }}
      onFocusChamp={() => { clearTimeout(pliage.current); setFocusListe(true); void lirePresse().then(setPresse); }}
      desactive={vue.sorte === 'supprimer'} />
  );
  /* v01 : la barre repliée, au-dessus du champ, sur tous les écrans du carnet ; pendant la lecture, puis « Lu · … » jusqu'à fermer */
  const barreLecture = (() => {
    if (!lectureUi.enBarre) return null;
    if (etatR.etape === 'en-cours' && etatR.lecture) {
      return <BarreLecture lecture={etatR.lecture} phase="en-cours" titre={lectureUi.titreDe(etatR.messageId)} onDeplier={() => lectureUi.deplier(etatR.messageId)} />;
    }
    if (etatR.etape === 'range' && etatR.lecture?.etapes?.length && lectureUi.fermee !== etatR.messageId) {
      const id = etatR.messageId;
      return <BarreLecture lecture={etatR.lecture} phase="fin" titre={lectureUi.titreDe(id)} nom={lectureUi.articleDe(id)?.article.nom} {...(lectureUi.ici ? {} : { carnet: lectureUi.titreDe(id) })}
        onDeplier={() => lectureUi.deplier(id)} onFermer={() => lectureUi.setFermee(id)} />;
    }
    return null;
  })();
  return { cadre, champ: barreLecture ? <>{barreLecture}{champ}</> : champ };
}
