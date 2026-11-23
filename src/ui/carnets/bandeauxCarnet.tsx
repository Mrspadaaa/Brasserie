/** Les bandeaux du Carnet : reprise, ligne rangée, retour « après » (et la note en vrac), puces proposées par l'IA, Annuler ;
 *  sortis de CarnetsVue.tsx : une fonction de rendu appelée en place, au même moment du rendu. */
import React from 'react';
import { lireCarnets, lireMessages, nomArticle, type CarnetDoc } from '../../domain/carnets/modele';
import { accepterProposition, changerGenre, deplacer, type EcritureCarnet, type Resultat } from '../../domain/carnets/operations';
import { passe, tableau as tableauDe } from '../../domain/carnets/comparer';
import type { LigneLocale } from '../../domain/carnets/analyseLocale';
import type { AidesCarnet } from '../../config/carnetIA';
import type { MagasinCarnets } from '../../services/carnetsStore';
import type { EtatRangement } from './rangement';
import type { RangeeV } from './CarnetOuvert';
import { Bandeau } from './Bandeau';
import { bandeauNommantLeCarnet } from './lectureRegles';
import { NoteEnVrac, type LigneVracV } from './NoteEnVrac';
import type { GenreNote } from './EtatIA';
import { libelleProposee, pucesDuCarnet, rangDuLien } from './lignesRegles';
import type { Annonce, Appliquer, AReprendre, Attente, Boite, Etat, Proposee, Retour, RetourNeuf, Vue } from './carnetsTypes';

export interface BandeauxV {
  enLigne: boolean; aReprendre: AReprendre[]; retour: Retour | null; etatR: EtatRangement<LigneLocale>; rangerMaintenant: (seul?: string) => Promise<void>;
  ouvert: CarnetDoc | null; vue: Vue; idOuvert: string | null; depuis: string | null; messages: ReturnType<typeof lireMessages>;
  tous: ReturnType<typeof lireCarnets>; carnets: ReturnType<typeof lireCarnets>; tableauV: ReturnType<typeof tableauDe> | null;
  retourRef: Boite<Retour | null>; attente: Boite<Attente | null>; annonces: Boite<Map<string, Annonce>>; neDeListe: Boite<string | null>;
  couperEnvoi: () => void; annuler: (inverse: EcritureCarnet[]) => void; appliquer: Appliquer; magasin: MagasinCarnets; aides: AidesCarnet;
  setRetour: (r: RetourNeuf | null) => void; poserRetourEtat: (r: Retour | null) => void; setEnTete: Etat<string | undefined>;
  setVientDEtreCree: Etat<string | null>; setVue: Etat<Vue>; setRangeEnCours: Etat<string | null>;
  ajouterAuSuggere: (rt: Retour, versId: string) => void; deplacerVersSuggere: (rt: Retour, versId: string) => void; ecartees: ReadonlySet<string>; setEcartees: Etat<ReadonlySet<string>>;
}

export function bandeauxCarnet(x: BandeauxV) {
  const { enLigne, aReprendre, retour, etatR, rangerMaintenant, ouvert, vue, idOuvert, depuis, messages, tous, carnets, tableauV, retourRef, attente, annonces,
    neDeListe, couperEnvoi, annuler, appliquer, magasin, aides, setRetour, poserRetourEtat, setEnTete, setVientDEtreCree, setVue, setRangeEnCours, ajouterAuSuggere, deplacerVersSuggere,
    ecartees, setEcartees } = x;
  /* le message dont le bandeau « L'IA n'a pas répondu » est affiché porte son « Relire » dans ce bandeau ; la ligne durable prend le relais */
  const aReprendreVus = aReprendre.filter(x => !(x.echec && retour?.messageId === x.messageId));
  const toutEchec = aReprendreVus.every(x => x.echec);
  const repriseNode = enLigne && aReprendreVus.length > 0 && etatR.etape !== 'en-cours' ? (
    <div className="cn-bandeau cnf-reprise" role="status" data-sorte="reprise">
      <div className="cn-bandeau-tete">
        <span className="cn-sp">{toutEchec ? 'L’IA n’a pas répondu' : 'De retour en ligne'} : {aReprendreVus.length} message{aReprendreVus.length > 1 ? 's' : ''} rangé{aReprendreVus.length > 1 ? 's' : ''} tel quel</span>
        <button type="button" className="cn-puce" data-relire onClick={() => void rangerMaintenant()}>{toutEchec ? 'Relire' : 'Ranger maintenant'}</button>
      </div>
    </div>
  ) : null;
  /** P23 : la puce proposée par l'IA, touchée : la ligne est rangée dans son carnet, sans `propose` (un message court la garde au fil). */
  const accepterProposee = (pr: Proposee) => {
    const r = appliquer(accepterProposition(magasin.lire(), { messageId: pr.messageId, index: pr.index }));
    if (r) setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse, carnetId: pr.carnetId });
  };
  /**
   * R14, R17, R25 : la ligne qu'un message vient de ranger dans le carnet ouvert s'éclaire à sa place, sa phrase citée dessous ; pour un
   * article lu sur sa page, la carte complète (« lu sur la page : … », « tient 80 °C : oui »). Un seul effet dans ce carnet, sinon le
   * bandeau seul (note en vrac, critère fusionné).
   */
  const rangee: RangeeV | null = (() => {
    /* avec un avis (IA éteinte, hors ligne, échec), le bandeau seul : il porte l'avis et ce qui a été rangé, où (P22) */
    if (!retour?.messageId || retour.avis || !ouvert || vue.sorte !== 'carnet' || retour.bandeau.sorte !== 'range') return null;
    const msg = messages.find(m => m.id === retour.messageId);
    const effets = (msg?.carnetMessage.effets ?? []).filter(e => e.carnetId === ouvert.id && e.cible !== 'carnet' && e.cible !== 'photo');
    if (effets.length !== 1) return null;
    const e = effets[0];
    const base = { cible: e.cible as RangeeV['cible'], id: e.id, phrase: msg!.carnetMessage.texte, onAnnuler: () => annulerRetour(retour) };
    /* BL-1 : le lien resté ici ; le carnet que l'IA voyait se propose, « Déplacer vers … ? » */
    const sug = retour.suggestion;
    const vers = sug ? { versSuggere: { titre: sug.titre, onDeplacer: () => deplacerVersSuggere(retour, sug.carnetId) } } : {};
    if (e.cible !== 'article') return ['critere', 'facon', 'note'].includes(e.cible) && ouvert.carnet[e.cible === 'critere' ? 'criteres' : e.cible === 'facon' ? 'facons' : 'notes'].some(x => x.id === e.id) ? base : null;
    const a = ouvert.carnet.articles.find(x => x.id === e.id);
    if (!a || a.lecture !== 'lue' || !a.url) return null;
    const luSurPage = [a.nom && 'nom', a.prixCentimes !== undefined && 'prix', a.photo && 'photo', ...Object.keys(a.valeurs)].filter((x): x is string => !!x);
    const k = ouvert.carnet.criteres.find(x => x.caracteristique?.sens === 'oui-non' && passe(a, x) !== null);
    const verdict = k ? `${k.caracteristique!.nom} : ${passe(a, k) ? 'oui' : 'non'}` : undefined;
    /* critique 6, n° 12 (R26, G20) : le bandeau dit le rang (« 1re de sa façon, devant Hotte inox 120 cm ») ; `rang` suit la ligne (LigneRangee) */
    const rang = tableauV ? rangDuLien(tableauV, a.id, ouvert.carnet.articles) : null;
    return Object.assign({ ...base, luSurPage, ...(verdict ? { verdict } : {}), ...vers }, rang ? { rang } : {});
  })();
  /** Annuler un retour : l'IA encore en route pour ce message est coupée d'abord (rien n'est réécrit après), puis tout est défait. */
  function annulerRetour(vu: Retour) {
    /* P8 : le retour tel qu'il est maintenant (l'IA a pu l'étendre pendant le toucher), sous la même clé */
    const rt = retourRef.current && retourRef.current.id === vu.id ? retourRef.current : vu;
    if (rt.messageId && attente.current?.messageId === rt.messageId) {
      attente.current = null;
      annonces.current.delete(rt.messageId);
      couperEnvoi();
    }
    annuler(rt.inverse); setRetour(null);
    /* le carnet créé n'existe plus : retour à la liste (s'il était ouvert, l'effet « carnet disparu » le fait aussi) */
    if (rt.bandeau.sorte === 'cree') { setEnTete(undefined); setVientDEtreCree(null); if (!depuis || depuis === rt.carnetId) setVue({ sorte: 'liste' }); }
    else if (rt.messageId && neDeListe.current === rt.messageId) setVue({ sorte: 'liste' });
    setRangeEnCours(null);
  };
  /**
   * R19 (g5:v01-16) : la note en vrac, après. « ✓ n lignes rangées dans m carnets · Annuler », chaque ligne avec son type et son carnet,
   * « › Texte d'origine ». Lu sur les effets du message tels qu'ils sont (n et m comptés là, les mêmes que pendant quand l'IA a suivi
   * l'annonce).
   */
  const vracApres = (rt: Retour): React.ReactNode => {
    const msg = messages.find(m => m.id === rt.messageId);
    if (!msg) return null;
    const effets = msg.carnetMessage.effets;
    const crees = new Set(effets.filter(e => e.cible === 'carnet').map(e => e.carnetId));
    const lignes: LigneVracV[] = effets.filter(e => e.cible !== 'carnet' && e.cible !== 'photo').flatMap(e => {
      const c = tous.find(x => x.id === e.carnetId);
      if (!c) return [];
      const d = c.carnet;
      const el = e.cible === 'note' ? d.notes.find(x => x.id === e.id) : undefined;
      const texteL = el?.texte ?? (e.cible === 'critere' ? d.criteres.find(x => x.id === e.id)?.texte
        : e.cible === 'facon' ? d.facons.find(x => x.id === e.id)?.nom
          : e.cible === 'article' ? (() => { const a = d.articles.find(x => x.id === e.id); return a ? nomArticle(a) : undefined; })() : undefined);
      if (!texteL) return [];
      const genre = (el?.genre ?? (e.cible === 'article' ? 'a-acheter' : e.cible === 'critere' ? 'critere' : e.cible === 'facon' ? 'facon' : 'note')) as LigneVracV['genre'];
      return [{ id: e.id, cible: e.cible as LigneVracV['cible'], texte: texteL, genre, carnetId: c.id, carnetTitre: c.title, neuf: crees.has(c.id) }];
    });
    const origine = msg.carnetMessage.rangement === 'ia' ? 'ia' : msg.carnetMessage.rangement === 'simulee' ? 'exemple' : 'locale';
    /* P11 (g5:v01-16) : chaque ligne se corrige d'un toucher, type ▾ et carnet ▾ ; Annuler défait aussi ces corrections */
    const etendre = (r: (Resultat & { ok: true }) | null) => {
      const cur = retourRef.current;
      if (r && cur && cur.id === rt.id) poserRetourEtat({ ...cur, inverse: [...r.inverse, ...cur.inverse] });
    };
    return <NoteEnVrac etat="apres" lignes={lignes} texteOrigine={msg.carnetMessage.texte} origine={origine} avis={rt.avis ?? null}
      nbCarnets={new Set(lignes.map(l => l.carnetId)).size} onAnnuler={() => annulerRetour(rt)}
      carnets={carnets.map(c => ({ id: c.id, titre: c.title }))}
      onChangerGenre={(id, g) => { const l = lignes.find(x => x.id === id); if (l?.carnetId) etendre(appliquer(changerGenre(magasin.lire(), { carnetId: l.carnetId, noteId: id, genre: g as GenreNote }))); }}
      onChangerCarnet={(id, vers) => { const l = lignes.find(x => x.id === id); if (l?.carnetId && l.cible) etendre(appliquer(deplacer(magasin.lire(), { cible: l.cible, id, depuis: l.carnetId, vers }))); }} />;
  };
  const bandeauNode = retour && !rangee && (!retour.carnetId || retour.carnetId === idOuvert || vue.sorte === 'liste')
    ? retour.bandeau.sorte === 'vrac' && retour.messageId && vue.sorte === 'liste'
      ? <React.Fragment key={retour.id}>{vracApres(retour)}</React.Fragment>
      : <Bandeau key={retour.id} bandeau={vue.sorte === 'liste' || (retour.carnetId && retour.carnetId !== idOuvert) ? bandeauNommantLeCarnet(retour.bandeau, retour.carnetId ? tous.find(c => c.id === retour.carnetId)?.title : undefined) : retour.bandeau} onAnnuler={() => annulerRetour(retour)} aideConsequence={aides.consequence}
        suggestion={retour.suggestion && retour.carnetId ? { titre: retour.suggestion.titre, onAjouter: () => (retour.bandeau.sorte === 'cree' ? ajouterAuSuggere : deplacerVersSuggere)(retour, retour.suggestion!.carnetId) } : null}
        onRelire={retour.avis?.sorte === 'echec' && enLigne && retour.messageId && aReprendre.some(x => x.messageId === retour.messageId) ? () => { const id = retour.messageId!; setRetour(null); void rangerMaintenant(id); } : null}
        {...(retour.avis ? { avis: retour.avis, ...(retour.detail ? { detail: retour.detail } : {}) } : {})} />
    : null;
  /* D417 / P8 : le retour d'un envoi parti de la liste tient un emplacement stable (index 0 du défilement), que la liste ou la fiche de destination soit dessous : le bouton Annuler reste le même nœud */
  const fixe = retour?.messageId && retour.messageId === neDeListe.current && retour.bandeau.sorte !== 'vrac' && (vue.sorte === 'liste' || vue.sorte === 'carnet') ? bandeauNode : null;
  const bandeauIci = fixe ? null : bandeauNode;
  /* P23 (D-35) : les puces proposées par l'IA pour le carnet ouvert, sous le bandeau ; elles restent jusqu'au toucher ou au ✕ */
  const pucesProposees: Proposee[] = ouvert && vue.sorte === 'carnet'
    ? pucesDuCarnet(messages, ouvert, ecartees)
    : [];
  const proposeesNode = pucesProposees.length ? (
    <div className="cnf-proposees" role="group" aria-label="Proposé par l’IA">
      {pucesProposees.map(x => (
        <span key={x.cle} className="cnf-proposee">
          <span className="cnf-proposee-ia" aria-hidden>✻</span>
          <span className="cnf-proposee-texte">{libelleProposee(x.ligne)}{x.ligne.origine === 'exemple' && <span className="cn-exemple"> exemple</span>}</span>
          <button type="button" className="cn-puce cn-puce-ia" onClick={() => accepterProposee(x)}>Ajouter</button>
          <button type="button" className="cn-x" aria-label={`Écarter « ${libelleProposee(x.ligne)} »`} onClick={() => setEcartees(s => new Set(s).add(x.cle))}>×</button>
        </span>
      ))}
    </div>
  ) : null;
  return { repriseNode, rangee, fixe, bandeauIci, proposeesNode };
}
