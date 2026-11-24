/** Le fil : un champ, l'IA met en forme et range. L'écriture locale, l'avis, puis l'écriture de l'IA ; sorti de CarnetsVue.tsx (code tel quel). */
import { estLienSeul, lireCarnets, lireMessages, nouvelIdCarnet, titreDePhrase } from '../../domain/carnets/modele';
import type { SuiviLectures } from '../../domain/carnets/lecture';
import type { EcritureCarnet } from '../../domain/carnets/operations';
import { appliquerEcritures, creerCarnet, fusionnerNotes, garderAPart, ranger, remplacerRangement, type Destination, type LigneARanger, type Resultat } from '../../domain/carnets/operations';
import { analyserTexte, normaliser, quantitesDe, vaDansDe, type LigneLocale, type RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import { rattacher } from '../../domain/carnets/rattacher';
import type { LigneCarnet } from '../../domain/carnets/ia';
import { comportementSimule, type AidesCarnet, type ModeCarnetIA } from '../../config/carnetIA';
import type { MagasinCarnets } from '../../services/carnetsStore';
import { AVIS, appelsSimules, creerRangement, planVrac, prixEcrits, versLignesAnnoncees, type EtatRangement } from './rangement';
import { CARNET_NEUF, estLaPhrase, genreSousNote, ligneBrute, memeTexte, morceauxPerdus, prefixeDe } from './envoiRegles';
import { depuisIA, depuisLocale, pourIA, vuesVrac } from './lignesRegles';
import type { RetourDe } from './retourCarnet';
import type { Annonce, Appliquer, AReprendre, Attente, AvisIA, Boite, CarnetsVueProps, Etat, Retour, RetourNeuf, Vue } from './carnetsTypes';

export interface RangementV {
  p: Pick<CarnetsVueProps, 'appels'>; mode: ModeCarnetIA; depuis: string | null; enLigne: boolean; magasin: MagasinCarnets; appliquer: Appliquer;
  maintenant: () => Date; retourDe: RetourDe; setRetour: (r: RetourNeuf | null) => void; poserRetourEtat: (r: Retour | null) => void;
  poserAvis: (messageId: string, sorte: AvisIA['sorte'], enReserve?: RetourNeuf | null, texte?: string) => void; setEtatR: Etat<EtatRangement<LigneLocale>>;
  setRangeEnCours: Etat<string | null>; setEnTete: Etat<string | undefined>; setVientDEtreCree: Etat<string | null>; setVue: Etat<Vue>; setAReprendre: Etat<AReprendre[]>;
  attente: Boite<Attente | null>; annonces: Boite<Map<string, Annonce>>; aForcer: Boite<RubriqueVaDans | null>; forcee: Boite<string | null>;
  destEnvoi: Boite<string | null>; titreNeufEnvoi: Boite<string | null>; carnetChoisi: Boite<boolean>; gardeAPartRef: Boite<boolean>;
  aidesRef: Boite<AidesCarnet>; retourRef: Boite<Retour | null>; vueRef: Boite<Vue>; neDeListe: Boite<string | null>;
  /** IA-ETAPES-VISIBLES : les lectures gardées sur l'appareil ; T26-4 : l'inverse du retrait d'un lien mort (« Compléter » le rend). */
  suivi?: SuiviLectures; inversesLiens: Boite<Map<string, EcritureCarnet[]>>;
}

/** Appelé dans le `useMemo` du conteneur, avec les mêmes dépendances : le rangement est recréé quand elles changent, jamais autrement. */
export function creerRangementCarnets(x: RangementV) {
  const { p, mode, depuis, enLigne, magasin, appliquer, maintenant, retourDe, setRetour, poserRetourEtat, poserAvis, setEtatR, setRangeEnCours, setEnTete,
    setVientDEtreCree, setVue, setAReprendre, attente, annonces, aForcer, forcee, destEnvoi, titreNeufEnvoi, carnetChoisi, gardeAPartRef, aidesRef, retourRef, vueRef, neDeListe,
    suivi, inversesLiens } = x;
  return creerRangement<LigneLocale>({
    mode, depuis,
    carnets: () => pourIA(lireCarnets(magasin.lire())),
    enLigne: () => enLigne,
    analyseLocale: analyserTexte,
    appels: p.appels ?? (mode === 'simule' ? appelsSimules(comportementSimule()) : undefined),
    maintenant,
    ...(suivi ? { suivi } : {}),
    /* T26-4 : le lien mort retiré comme l'IA remplacerait le rangement local, sans aucune ligne ; son inverse est gardé pour « Compléter » */
    retirerLien: messageId => {
      const r = appliquer(remplacerRangement(magasin.lire(), { messageId, lignes: [], rangement: 'locale' }));
      if (r) inversesLiens.current?.set(messageId, r.inverse);
    },
    messageExiste: messageId => lireMessages(magasin.lire()).some(m => m.id === messageId),
    /* T28-1 : le carnet où ce message a été écrit, lu sur le message lui-même (rouvert l'app ailleurs, le lien y revient) */
    depuisDuMessage: messageId => {
      const m = lireMessages(magasin.lire()).find(x => x.id === messageId);
      return m ? (m.carnetMessage.depuis === 'liste' ? null : m.carnetMessage.depuis) : undefined;
    },
    surEtat: e => {
      setEtatR(e);
      const enPause = e.etape === 'echec' && e.avis === AVIS.pause;
      /* T26-4 : lien mort : rien n'est gardé ; ni retour local, ni avis, ni « Relire » : la carte d'échec des étapes le dit seule */
      if (e.etape === 'echec' && e.lecture?.statut === 'introuvable') {
        if (attente.current?.messageId === e.messageId) attente.current = null;
        annonces.current.delete(e.messageId);
        setRangeEnCours(null);
        if (retourRef.current?.messageId === e.messageId) setRetour(null);
        return;
      }
      /* l'IA a échoué ou a été coupée : l'écriture locale reste, son retour paraît enfin (avec son Annuler) ; un échec le dit (P36) */
      if ((e.etape === 'echec' || e.etape === 'annule') && attente.current?.messageId === e.messageId) {
        const { retour: local, montre, neuf } = attente.current;
        attente.current = null;
        annonces.current.delete(e.messageId);
        /* PCN-184 : sans réponse de l'IA, l'aperçu local fait foi : le carnet neuf tenu en réserve s'ouvre enfin */
        setRangeEnCours(null);
        if (neuf) { setEnTete(neuf); setVientDEtreCree(neuf); setVue({ sorte: 'carnet', id: neuf }); }
        if (e.etape === 'echec') poserAvis(e.messageId, 'echec', montre ? null : local, enPause ? e.avis : undefined);
        else if (!montre) setRetour(local);
      } else if (e.etape === 'echec') poserAvis(e.messageId, 'echec', undefined, enPause ? e.avis : undefined);
      /* lot 11 (L-1, hors lot) : un échec garde le message à relire, d'un toucher (« Relire »), comme un message gardé hors ligne */
      if (e.etape === 'echec' && e.texte?.trim()) setAReprendre(l => [...l.filter(x => x.messageId !== e.messageId), { messageId: e.messageId, texte: e.texte, echec: true, ...(enPause ? { pause: true as const } : {}) }]);
      /* P22 : IA éteinte ou hors ligne : le retour local est déjà affiché ; l'avis s'y ajoute, avec ce qui a été rangé et où */
      if (e.etape === 'hors-ligne') { poserAvis(e.messageId, 'hors-ligne'); setAReprendre(l => [...l.filter(x => x.messageId !== e.messageId), { messageId: e.messageId, texte: e.texte }]); }
      /* T28-17 : un lien déjà dans le carnet n'est pas « IA éteinte » : le bandeau « Déjà dans ce carnet » suffit */
      if (e.etape === 'range' && e.rangement === 'locale' && !e.dejaRange) poserAvis(e.messageId, 'eteint');
    },
    ecrireLocal: (txt, lignes, { iaAttendue: iaPrevue }) => {
      const etat = magasin.lire();
      const le = maintenant().toISOString();
      const message = { id: nouvelIdCarnet('MSG'), texte: txt, le, depuis: depuis ?? 'liste', rangement: 'locale' as const };
      let r: Resultat;
      let neuf: string | null = null;
      const force = aForcer.current; aForcer.current = null;
      /* n° 3 : le carnet annoncé par le cadre (l'ouvert, ou celui qu'il a nommé, corrigé ou non d'un toucher) */
      const titreNeuf = destEnvoi.current === CARNET_NEUF ? titreNeufEnvoi.current : null;
      /* f5b n° 12 : depuis la liste, seul un lien seul a un carnet annoncé (`envoyer`) */
      const ici = depuis ? (!titreNeuf ? destEnvoi.current ?? depuis : null) : destEnvoi.current;
      destEnvoi.current = null; titreNeufEnvoi.current = null;
      const rubrique = ici && !force ? vaDansDe(txt) : null;
      const choisi = carnetChoisi.current; carnetChoisi.current = false;
      const noteChoisie = !!depuis && (rubrique === 'note' || force === 'note');
      let annonce: Annonce | null = ici ? { sorte: 'ici', carnetId: ici, ...(rubrique ? { rubrique } : {}), ...(choisi ? { choisi: true as const } : {}), ...(noteChoisie ? { noteChoisie: true as const } : {}) } : null;
      if (noteChoisie) lignes = lignes.map(l => genreSousNote(l, l.phrase));
      if (ici && force && lignes.length === 1 && lignes[0].sorte !== 'article') {
        const l0 = lignes[0];
        const ligne: LigneARanger = force === 'critere' ? { carnetId: ici, sorte: 'critere', texte: l0.texte, origine: 'vous' }
          : force === 'facon' ? { carnetId: ici, sorte: 'facon', nom: l0.texte, origine: 'vous' }
          : { carnetId: ici, sorte: 'note', texte: l0.texte, ...(l0.sorte === 'note' ? { genre: l0.genre } : {}) };
        r = ranger(etat, { message, lignes: [ligne] });
        forcee.current = message.id;
      } else if (ici) r = ranger(etat, { message, lignes: lignes.map(l => depuisLocale(l, { carnetId: ici })) });
      if (ici) { /* rangé ci-dessus */ } else if (lignes.length <= 1) {
        neuf = nouvelIdCarnet('CARNET');
        const titre = titreNeuf ?? titreDePhrase(txt);
        /* n° 2 : la phrase entière n'est pas un critère d'elle-même (« Ce qui compte : Moulin à malt… ») ; elle est déjà le titre */
        r = creerCarnet(etat, { id: neuf, message, lignes: lignes.filter(l => l.sorte !== 'note' && !(l.sorte !== 'article' && estLaPhrase(l.texte, txt))).map(l => depuisLocale(l, { carnetNeuf: { id: neuf!, titre } })) });
        if (!estLienSeul(txt)) annonce = { sorte: 'cree', carnetId: neuf, titre, phrase: txt };
      } else {
        /* la découpe annoncée par le cadre (même `planVrac`, mêmes carnets) : chaque ligne là où elle a été annoncée */
        const cs = lireCarnets(etat);
        const plan = planVrac(lignes, t => rattacher(t, cs), prefixeDe(txt));
        /* critique 6, n° 1 : un carnet neuf par objet, titré par sa ligne */
        const neufsVrac = plan.neufs.map((titre, k) => ({ id: nouvelIdCarnet('CARNET'), titre,
          phrase: lignes.filter((_, i) => plan.lignes[i].neufIndex === k).map(l => l.phrase.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '')).join('\n') }));
        const dests: Destination[] = plan.lignes.map(x => (x.carnetId ? { carnetId: x.carnetId } : { carnetNeuf: neufsVrac[x.neufIndex ?? 0] }));
        r = ranger(etat, { message, lignes: lignes.map((l, i) => depuisLocale(l, dests[i])) });
        annonce = { sorte: 'vrac', lignes: lignes.map((l, i) => ({ texte: l.texte, dest: dests[i], sorte: l.sorte })), vues: vuesVrac(plan), carnets: plan.carnets };
      }
      const fait = appliquer(r!);
      if (!fait) throw new Error((r! as { raison?: string }).raison ?? 'refus');
      /* P18 (G11) : « Garder à part » touché pendant la frappe : le message le retient, la fusion ne sera pas proposée ni faite */
      /* BL-2 (GH-4) : l'état juste après l'écriture ; le magasin Firestore ne la montre qu'à son instantané suivant */
      let vu = appliquerEcritures(etat, fait.ecritures);
      if (gardeAPartRef.current) {
        gardeAPartRef.current = false;
        const g = appliquer(garderAPart(vu, { messageId: message.id }));
        if (g) { fait.inverse.unshift(...g.inverse); vu = appliquerEcritures(vu, g.ecritures); }
      }
      /* T28-17 : tout ce que ce message « range » est déjà là (même adresse canonique, même carnet) : l'IA ne passe pas, aucune lecture */
      const effetsMsg = lireMessages(vu).find(m => m.id === message.id)?.carnetMessage.effets ?? [];
      const dejaRange = effetsMsg.length > 0 && effetsMsg.every(e => e.cible === 'article' && e.existant === true);
      const iaAttendue = iaPrevue && !dejaRange;
      const local = retourDe(message.id, txt, depuis, fait.inverse, undefined, undefined, vu) ?? { bandeau: { sorte: 'range' }, inverse: fait.inverse, messageId: message.id };
      /* L'IA va tourner : son rangement peut remplacer celui-ci (P1, P2) ; le retour attend la fin, rien n'est annoncé qui pourrait mentir.
         Sauf à la création, où la cible est tenue : l'IA ne fait que mettre en forme, « Carnet créé » paraît tout de suite. La note en vrac
         montre pendant ce temps « ✻ L'IA découpe votre note » (n° 7), puis « ✓ n lignes rangées dans m carnets ». */
      if (annonce && iaAttendue) annonces.current.set(message.id, annonce);
      /* Paquet 1, PCN-184 (test en ligne 3) : écrit dans un carnet ouvert, le carnet neuf n'est qu'une supposition locale tant que l'IA
         range : l'écran reste sur le carnet ouvert, rien n'est annoncé « créé » ; la réponse dit où c'est allé (D383). */
      const definitif = annonce?.sorte === 'cree' && !(depuis && iaAttendue);
      if (iaAttendue) attente.current = { messageId: message.id, retour: local, montre: definitif, ...(neuf && (!definitif || !depuis) ? { neuf } : {}) };
      /* D417 : depuis la liste, la fiche du carnet neuf ne s'ouvre pas pendant que l'IA range ; elle s'ouvre une fois, à la fin */
      if (!depuis) neDeListe.current = message.id;
      if (neuf && !depuis && iaAttendue) setRangeEnCours(neuf);
      if (!iaAttendue || definitif) setRetour(local);
      if (neuf && !(depuis && iaAttendue)) { setEnTete(neuf); setVientDEtreCree(neuf); if (!iaAttendue) setVue({ sorte: 'carnet', id: neuf }); }
      return { messageId: message.id, ...(dejaRange ? { dejaRange: true } : {}) };
    },
    ecrireIA: (messageId, lignes, mode2, depuisPasse) => ((depuis: string | null) => {
      setRangeEnCours(null);
      if (forcee.current === messageId) {
        /* sa correction « Va dans » est un choix : l'IA ne la défait pas ; le retour local, tenu en réserve, paraît */
        forcee.current = null;
        const local = attente.current?.messageId === messageId ? attente.current.retour : null;
        attente.current = null;
        if (local) setRetour(local);
        return;
      }
      const etat = magasin.lire();
      const msg = lireMessages(etat).find(m => m.id === messageId);
      const creePar = msg?.carnetMessage.effets.find(e => e.cible === 'carnet')?.carnetId;
      /* T28-1 : à la réouverture, l'annonce de l'envoi est perdue ; un lien collé dans un carnet y reste (comme l'annonce « ici » l'aurait dit) */
      const an = annonces.current.get(messageId) ?? (depuisPasse !== undefined && depuis ? ({ sorte: 'ici', carnetId: depuis } as Annonce) : undefined);
      annonces.current.delete(messageId);
      const txt = msg?.carnetMessage.texte ?? '';
      /* Test en ligne 2 (bloquant 5) : un prix écrit dans le message que l'IA n'a pas rendu reste sur son article */
      lignes = prixEcrits(lignes, analyserTexte(txt));
      let aRanger: LigneARanger[];
      let propose: { carnetId: string; titre: string } | undefined;
      /*
       * Test en ligne 2 (18.11) : quand l'IA a répondu, son rangement fait foi : le carnet (connu, ou neuf qu'elle nomme), la sorte et le
       * critère. L'annonce locale n'a été qu'un aperçu en attendant ; elle ne sert plus que quand l'IA ne dit pas où (aucun carnet rendu).
       * Les carnets neufs que l'IA nomme portent la marque des données de test du message (L05).
       */
      const neufsIA = new Map<string, Destination>();
      /* D437 : le domaine que l'IA pose sur le carnet neuf suit sa destination (posé à la création, ou sur le carnet de l'annonce) */
      const versNeufIA = (titre: string, domaine?: LigneCarnet['domaine']): Destination => {
        const t = prefixeDe(txt) && !/^\s*ZZ TEST/i.test(titre) ? `${prefixeDe(txt)}${titre}` : titre;
        const cle = normaliser(t);
        if (!neufsIA.has(cle)) neufsIA.set(cle, { carnetNeuf: { id: nouvelIdCarnet('CARNET'), titre: t, ...(domaine ? { domaine } : {}) } });
        return neufsIA.get(cle)!;
      };
      const connu = (id: string | undefined) => !!id && lireCarnets(etat, { archives: true }).some(c => c.id === id);
      if (an?.sorte === 'cree') {
        /* m390-1, d1280-1, L4-7 : ce qui n'a pas d'autre carnet reste dans SON carnet, sous sa phrase ; un autre titre de l'IA devient un
           titre proposé (G29). Test en ligne 2 (bloquants 3 et 4) : une ligne que l'IA range dans un carnet connu y va ; le carnet créé
           pendant l'attente, resté vide, disparaît. */
        const domIA = lignes.find(l => l.domaine && !connu(l.carnetId))?.domaine;
        const dest: Destination = { carnetNeuf: { id: an.carnetId, titre: an.titre, ...(domIA ? { domaine: domIA } : {}) } };
        const ailleurs = (l: LigneCarnet) => l.sorte !== 'idee' && connu(l.carnetId) && l.carnetId !== an.carnetId;
        const ici = lignes.filter(l => !ailleurs(l));
        /* n° 2 : la phrase recopiée telle quelle (en note ou en critère) n'est pas une mise en forme : elle est déjà le titre ; sauf si elle
           porte une quantité ou un prix (« tuyau silicone 8 mm, 5 m » à acheter : rien n'est perdu) */
        const recopie = (l: LigneCarnet) => l.sorte !== 'article' && memeTexte(l.texte, an.phrase) && l.quantite === undefined && l.prixCentimes === undefined;
        /* C55-2 (R24) : l'aperçu a promis « Ce qui compte · … » (la mesure que la phrase porte, lue en local). Une IA qui ne rend que l'idée, ou
           pas cette mesure, ne la défait pas : le critère local reste, comme l'aperçu l'a dit. Même règle que l'aperçu : la phrase entière
           n'est pas son propre critère (memeTexte), et une mesure que l'IA a reprise dans un critère (« Volume de 50 L ») n'est pas doublée. */
        const dejaDite = (q: { valeur: number; unite: string }) => ici.some(l => l.sorte === 'critere' && quantitesDe(l.texte).some(y => y.valeur === q.valeur && y.unite === q.unite));
        const promis = analyserTexte(txt).filter(l => l.sorte === 'critere' && l.quantites.length > 0 && !estLaPhrase(l.texte, an.phrase) && !l.quantites.every(dejaDite));
        aRanger = [
          ...(ici.length || !lignes.some(ailleurs) ? [{ ...dest, sorte: 'idee' } as LigneARanger] : []),
          ...ici.filter(l => l.sorte !== 'idee' && !recopie(l)).map(l => depuisIA(l, dest)),
          ...promis.map(l => depuisLocale(l, dest)),
          ...lignes.filter(ailleurs).map(l => depuisIA(l, { carnetId: l.carnetId! }))];
        const titreIA = lignes.find(l => l.sorte === 'idee')?.titre ?? lignes.find(l => l.carnetNeuf)?.carnetNeuf ?? lignes.find(l => l.titrePropose)?.titrePropose;
        if (aRanger.some(l => l.sorte === 'idee') && titreIA && !memeTexte(titreIA, an.titre)) propose = { carnetId: an.carnetId, titre: titreIA };
      } else if (an?.sorte === 'vrac') {
        /* Test en ligne 2 (bloquants 1 et 2) : chaque ligne va où l'IA la range (un carnet connu, ou le carnet neuf qu'elle nomme, une idée
           comprise : « Pompe » n'est plus annoncée puis perdue), avec la sorte qu'elle lui donne. Sans carnet rendu : la ligne annoncée. */
        const sansIdee = lignes.filter(l => l.sorte !== 'idee');
        const idx = versLignesAnnoncees(sansIdee.map(l => l.texte), an.lignes.map(x => x.texte));
        const annonceDe = (l: LigneCarnet): Destination => {
          const i = sansIdee.indexOf(l);
          return (i >= 0 ? an.lignes[idx[i]]?.dest : undefined) ?? an.lignes[0].dest;
        };
        const brutes = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const destParBrute = new Map<number, Destination>();
        aRanger = lignes.flatMap(l => {
          const dest = connu(l.carnetId) ? { carnetId: l.carnetId! } : l.carnetNeuf ? versNeufIA(l.carnetNeuf, l.domaine) : l.sorte === 'idee' ? null : annonceDe(l);
          const i = ligneBrute(`${l.texte} ${l.titre ?? ''}`, brutes);
          if (dest && i >= 0 && !destParBrute.has(i)) destParBrute.set(i, dest);
          return dest ? [depuisIA(l, dest)] : [];
        });
        /* PCN-188 (test en ligne 4) : un morceau de la note que l'IA n'a repris nulle part (« voir s'il existe avec double paroi », « 60 L »)
           reste, tel que l'analyse locale le lit, dans le carnet où va sa ligne ; aucune ligne du brasseur ne se perd. */
        for (const m of morceauxPerdus(txt, lignes)) {
          const dest = destParBrute.get(m.brute) ?? an.lignes[Math.max(0, ligneBrute(m.texte, an.lignes.map(x => x.texte)))]?.dest ?? an.lignes[0].dest;
          for (const l of analyserTexte(m.texte)) aRanger.push(depuisLocale(l, dest));
        }
        /* Paquet 1, PCN-186 (test en ligne 3) : chaque carnet neuf de l'IA cite ses lignes de la note, pas la note entière */
        for (const [cle, d] of neufsIA) {
          const siennes = lignes.filter(l => l.carnetNeuf && normaliser(prefixeDe(txt) && !/^\s*ZZ TEST/i.test(l.carnetNeuf) ? `${prefixeDe(txt)}${l.carnetNeuf}` : l.carnetNeuf) === cle);
          const idx = new Set(siennes.map(l => ligneBrute(l.texte, brutes)).filter(i => i >= 0));
          if (idx.size && d.carnetNeuf) d.carnetNeuf.phrase = brutes.filter((_, i) => idx.has(i)).map(s => s.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '')).join('\n');
        }
      } else if (an?.sorte === 'ici') {
        /* n° 3 et 6 : écrit dans un carnet ouvert, l'IA met en forme (critère, façon, article lu, note). Test en ligne 2 (bloquant 2) : le
           carnet qu'elle rend fait foi (« doit tenir 80 °C » écrit dans Pompe reste dans Pompe, même si un carnet porte ce titre), et la
           sorte qu'elle donne aussi ; sans carnet rendu, le carnet annoncé. */
        const dest = (l: LigneCarnet): Destination => (an.choisi ? { carnetId: an.carnetId } : connu(l.carnetId) ? { carnetId: l.carnetId! } : l.carnetNeuf ? versNeufIA(l.carnetNeuf, l.domaine) : { carnetId: an.carnetId });
        /* Paquet 1, PCN-183 (test en ligne 3) : une idée que l'IA range dans un carnet neuf (« Réfractomètre », écrit dans le Fermenteur)
           ouvre ce carnet ; elle n'est plus jetée, la phrase brute ne reste pas en note ici (D383). */
        const ideeNeuve = (l: LigneCarnet) => l.sorte === 'idee' && !an.choisi && !connu(l.carnetId) && !!(l.carnetNeuf ?? l.titre);
        aRanger = lignes.filter(l => l.sorte !== 'idee' || ideeNeuve(l))
          .map(l => depuisIA(an.noteChoisie ? genreSousNote(l, txt) : l, ideeNeuve(l) ? versNeufIA((l.carnetNeuf ?? l.titre)!, l.domaine) : dest(l)));
        const p2 = lignes.find(l => l.titrePropose && l.carnetId === an.carnetId);
        if (p2) propose = { carnetId: an.carnetId, titre: p2.titrePropose! };
        if (!aRanger.length) {
          const local = attente.current?.messageId === messageId ? attente.current.retour : null;
          attente.current = null;
          if (local) setRetour(local);
          return;
        }
      } else {
        const neufs = new Map<string, string>();
        /* un lien seul qui ouvre un carnet : le nom lu sur sa page, sinon son domaine (R16, R17 ; g5:v03-10, g5:v06-10) */
        const pageLue = lignes.find(l => l.sorte === 'article' && l.page)?.page;
        const titreLien = !depuis && estLienSeul(txt) ? (pageLue?.statut === 'lue' && pageLue.nom ? pageLue.nom : titreDePhrase(txt)) : null;
        const dest = (l: LigneCarnet): Destination => {
          if (l.carnetId) return { carnetId: l.carnetId };
          if (depuis && !l.carnetNeuf) return { carnetId: depuis };
          /* critique 6, n° 13 : le besoin que l'IA nomme (« Pompe pour le moût ») d'abord ; le nom lu sur la page à défaut */
          const titre = l.carnetNeuf ?? titreLien ?? l.titre ?? titreDePhrase(l.texte);
          if (!neufs.has(titre)) neufs.set(titre, neufs.size === 0 && creePar ? creePar : nouvelIdCarnet('CARNET'));
          return { carnetNeuf: { id: neufs.get(titre)!, titre } };
        };
        aRanger = lignes.map(l => depuisIA(l, dest(l)));
        const p2 = lignes.find(l => l.titrePropose && l.carnetId);
        if (p2) propose = { carnetId: p2.carnetId!, titre: p2.titrePropose! };
      }
      const r = remplacerRangement(etat, { messageId, rangement: mode2, lignes: aRanger, ...(propose ? { titrePropose: propose } : {}) });
      const fait = appliquer(r);
      const enAttente = attente.current?.messageId === messageId ? attente.current : null;
      const local = enAttente?.retour ?? null;
      attente.current = null;
      if (!fait) { if (local && !enAttente?.montre) setRetour(local); return; }
      /* P18 (G11) : la note qui répète une note connue y est fusionnée (« elles seront fusionnées »), sauf « Garder à part » */
      /* n° 10 : une phrase déjà gardée à part ne se fusionne pas en douce à son retour (la proposition n'est plus montrée, cf. `cadre`) */
      /* BL-2 (GH-4, BL-4) : l'état juste après l'écriture de l'IA ; relu dans le magasin Firestore, c'était encore l'écriture locale
         (article « à lire » dans le carnet ouvert) : « Lien rangé ici · page non lue » pour un lien lu, ou parti ailleurs */
      let vu = appliquerEcritures(etat, fait.ecritures);
      const tousMsg = lireMessages(vu);
      const garde = tousMsg.find(m => m.id === messageId)?.carnetMessage.gardeAPart
        || tousMsg.some(m => m.id !== messageId && m.carnetMessage.gardeAPart && memeTexte(m.carnetMessage.texte, txt));
      if (aidesRef.current.doublon && !garde) {
        for (const l of lignes) {
          if (l.sorte !== 'note' || !l.doublonDe) continue;
          const cid = an?.sorte === 'ici' ? an.carnetId : l.carnetId ?? depuis;
          const eff = lireMessages(vu).find(m => m.id === messageId)?.carnetMessage.effets
            .find(e => e.cible === 'note' && e.carnetId === cid && e.id !== l.doublonDe);
          if (!cid || !eff) continue;
          const fu = appliquer(fusionnerNotes(vu, { carnetId: cid, garderId: l.doublonDe, fusionnerId: eff.id, le: maintenant().toISOString() }));
          if (fu) { fait.inverse.unshift(...fu.inverse); vu = appliquerEcritures(vu, fu.ecritures); }
        }
      }
      /* Annuler défait le rangement réel : l'écriture de l'IA, puis l'écriture locale qu'elle a remplacée. */
      /* Seule la branche où l'IA choisit le carnet neuf lui doit son titre ; ailleurs (créer, annoncé) le titre reste celui de la règle locale. */
      const titresIA = an ? undefined : lignes.flatMap(l => [l.carnetNeuf, l.titre]);
      const final = retourDe(messageId, txt, depuis, [...fait.inverse, ...(local?.inverse ?? [])], lignes, titresIA, vu);
      /* le retour tenu en réserve paraît aussi quand l'IA réussit sans rien d'autre à dire (d1280-1) */
      if (!final) { if (local && !enAttente?.montre) setRetour(local); return; }
      /* P8 (tour 3) : le retour de ce message est déjà affiché (créer, note en vrac) : il n'est pas remplacé ; même clé, même bandeau,
         seul ce qu'Annuler défait s'étend à l'écriture de l'IA. Un toucher sur Annuler pendant que l'IA finit agit donc toujours. */
      const affiche = retourRef.current;
      if (affiche && affiche.messageId === messageId) {
        /* même sorte : le texte suit la réponse (d'où vient le titre), sous la même clé ; la ligne « Annuler » ne bouge pas. Test en
           ligne 2 : l'IA a rangé ailleurs que le carnet créé pendant l'attente : le retour dit où, sous la même clé */
        poserRetourEtat({ ...affiche, inverse: final.inverse, bandeau: final.bandeau, detail: final.detail,
          ...(final.bandeau.sorte !== affiche.bandeau.sorte ? { carnetId: final.carnetId } : {}) });
      }
      else setRetour(final);
      /* Test en ligne 2 (bloquant 4) : le carnet créé pendant l'attente a disparu (l'IA a rangé dans le carnet ouvert) : on y revient */
      if (enAttente?.montre && final.bandeau.sorte !== 'cree') {
        setEnTete(undefined); setVientDEtreCree(null);
        if (depuis) setVue({ sorte: 'carnet', id: final.carnetId ?? depuis });
      }
      if (final.bandeau.sorte === 'cree' && final.carnetId) {
        setEnTete(final.carnetId); setVientDEtreCree(final.carnetId);
        /* PCN-183/184 : écrit dans un carnet, le carnet neuf que l'IA confirme s'ouvre : on voit où la phrase est allée */
        if ((!enAttente?.montre || (!depuis && enAttente?.neuf)) && final.carnetId !== depuis && (depuis || vueRef.current.sorte === 'liste')) setVue({ sorte: 'carnet', id: final.carnetId });
      } else if (final.bandeau.sorte === 'vrac') {
        /* la note en vrac reste sur la liste, avec ses lignes rangées (g5:v01-16) */
      } else if (!depuis) {
        /* rangé dans un carnet existant (ou en vrac) : le carnet local a disparu ; retour à la liste, sans carte « créée » en tête */
        setEnTete(undefined); setVientDEtreCree(null);
        /* D417 : née de la liste, la fiche où l'IA a rangé s'ouvre une fois ; sinon la liste reste */
        if (enAttente?.neuf && final.carnetId && connu(final.carnetId) && vueRef.current.sorte === 'liste') setVue({ sorte: 'carnet', id: final.carnetId });
        else setVue({ sorte: 'liste' });
      }
    })(depuisPasse === undefined ? depuis : depuisPasse)
  });
}
