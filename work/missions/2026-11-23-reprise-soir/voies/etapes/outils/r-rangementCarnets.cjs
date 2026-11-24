module.exports = [
[`import { appliquerEcritures, creerCarnet, fusionnerNotes, garderAPart, ranger, remplacerRangement,`,
`import type { SuiviLectures } from '../../domain/carnets/lecture';
import type { EcritureCarnet } from '../../services/carnetsStore';
import { appliquerEcritures, creerCarnet, fusionnerNotes, garderAPart, ranger, remplacerRangement,`],

[`  aidesRef: Boite<AidesCarnet>; retourRef: Boite<Retour | null>; vueRef: Boite<Vue>; neDeListe: Boite<string | null>;
}`,
`  aidesRef: Boite<AidesCarnet>; retourRef: Boite<Retour | null>; vueRef: Boite<Vue>; neDeListe: Boite<string | null>;
  /** IA-ETAPES-VISIBLES : les lectures gardées sur l'appareil ; T26-4 : l'inverse du retrait d'un lien mort (« Compléter » le rend). */
  suivi?: SuiviLectures; inversesLiens: Boite<Map<string, EcritureCarnet[]>>;
}`],

[`    setVientDEtreCree, setVue, setAReprendre, attente, annonces, aForcer, forcee, destEnvoi, titreNeufEnvoi, carnetChoisi, gardeAPartRef, aidesRef, retourRef, vueRef, neDeListe } = x;`,
`    setVientDEtreCree, setVue, setAReprendre, attente, annonces, aForcer, forcee, destEnvoi, titreNeufEnvoi, carnetChoisi, gardeAPartRef, aidesRef, retourRef, vueRef, neDeListe,
    suivi, inversesLiens } = x;`],

[`    maintenant,
    surEtat: e => {
      setEtatR(e);`,
`    maintenant,
    ...(suivi ? { suivi } : {}),
    /* T26-4 : le lien mort retiré comme l'IA remplacerait le rangement local, sans aucune ligne ; son inverse est gardé pour « Compléter » */
    retirerLien: messageId => {
      const r = appliquer(remplacerRangement(magasin.lire(), { messageId, lignes: [], rangement: 'locale' }));
      if (r) inversesLiens.current?.set(messageId, r.inverse);
    },
    messageExiste: messageId => lireMessages(magasin.lire()).some(m => m.id === messageId),
    surEtat: e => {
      setEtatR(e);
      /* T26-4 : lien mort : rien n'est gardé ; ni retour local, ni avis, ni « Relire » : la carte d'échec des étapes le dit seule */
      if (e.etape === 'echec' && e.lecture?.statut === 'introuvable') {
        if (attente.current?.messageId === e.messageId) attente.current = null;
        annonces.current.delete(e.messageId);
        setRangeEnCours(null);
        if (retourRef.current?.messageId === e.messageId) setRetour(null);
        return;
      }`]
];
