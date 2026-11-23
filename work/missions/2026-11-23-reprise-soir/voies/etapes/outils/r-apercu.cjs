module.exports = [
[`import { dateCourte, EtatIA } from './EtatIA';`,
`import { dateCourte, EtatIA, type ArticleV } from './EtatIA';
import { BarreLecture, LectureLien } from './LectureLien';`],

[`  presse: string | undefined; setPresse: Etat<string | undefined>;
}`,
`  presse: string | undefined; setPresse: Etat<string | undefined>;
  lectureUi: LectureUi;
}

/** IA-ETAPES-VISIBLES (D448) : ce que la carte des étapes et sa barre repliée lisent et font, fourni par CarnetsVue. */
export interface LectureUi {
  replie: boolean; setReplie: (v: boolean) => void;
  /** Le message dont la carte de fin ou d'échec a été fermée. */
  fermee: string | null; setFermee: (messageId: string | null) => void;
  exemple: boolean;
  onEscalader: (messageId: string, texte: string) => void;
  onCompleter: (messageId: string) => void;
  onAutreLien: (messageId: string) => void;
  articleDe: (messageId: string) => { article: ArticleV; carnetId: string } | null;
  titreDe: (messageId: string) => string | undefined;
  ouvrirArticle: (carnetId: string, articleId: string) => void;
}`],

[`    setAPart, titreEdite, setTitreEdite, renommerOuvert, envoyer, vientDEtreCree, plierApresToucher, photo, jointe, retirerJointe, pliage, presse, setPresse } = x;`,
`    setAPart, titreEdite, setTitreEdite, renommerOuvert, envoyer, vientDEtreCree, plierApresToucher, photo, jointe, retirerJointe, pliage, presse, setPresse, lectureUi } = x;`],

[`      if (etatR.lecture) {
        const c: CadreV = { sorte: 'lien', url: etatR.lecture.url, phase: 'lecture', depuisListe: (envoiActif.current?.depuis ?? depuis) === null };
        return <CadreArrivee cadre={c} onAnnuler={couperEnvoi} aides={aides} />;
      }`,
`      /* D448 : la lecture d'un lien montre ses étapes (début v05+v06, milieu v03) ; repliée, elle vit dans la barre au-dessus du champ (v01) */
      if (etatR.lecture) {
        return lectureUi.replie ? null : <LectureLien lecture={etatR.lecture} phase="en-cours" exemple={lectureUi.exemple} onReplier={() => lectureUi.setReplie(true)} />;
      }`],

[`    if ((etatR.etape === 'echec' || etatR.etape === 'hors-ligne') && !retourDuMessage(etatR.messageId) && !texte.trim()) {`,
`    /* D448 : la lecture finie (fin, v01+v03+v05) ou le lien mort (échec, base+v03, T26-4), tant que la carte n'est pas fermée ni la frappe reprise */
    if ((etatR.etape === 'range' || etatR.etape === 'echec') && etatR.lecture?.etapes?.length && lectureUi.fermee !== etatR.messageId && !texte.trim() && !edition) {
      const id = etatR.messageId, l = etatR.lecture;
      const fermer = () => lectureUi.setFermee(id);
      if (etatR.etape === 'echec' && l.statut === 'introuvable') {
        return <LectureLien lecture={l} phase="echec" exemple={lectureUi.exemple} onFermer={fermer} onEscalader={() => lectureUi.onEscalader(id, etatR.texte)}
          onAutreLien={() => lectureUi.onAutreLien(id)} onCompleter={() => lectureUi.onCompleter(id)} onRetirer={fermer} />;
      }
      if (etatR.etape === 'range' && !lectureUi.replie) {
        const a = lectureUi.articleDe(id);
        return <LectureLien lecture={l} phase="fin" exemple={lectureUi.exemple} article={l.reouverture ? a?.article ?? null : null} onFermer={fermer}
          {...(a ? { onOuvrirArticle: () => lectureUi.ouvrirArticle(a.carnetId, a.article.id) } : {})} />;
      }
    }
    if ((etatR.etape === 'echec' || etatR.etape === 'hors-ligne') && !retourDuMessage(etatR.messageId) && !texte.trim()) {`],

[`  return { cadre, champ };
}`,
`  /* v01 : la barre repliée, au-dessus du champ, sur tous les écrans du carnet ; pendant la lecture, puis « Lu · … » jusqu'à fermer */
  const barreLecture = (() => {
    if (!lectureUi.replie) return null;
    if (etatR.etape === 'en-cours' && etatR.lecture) {
      return <BarreLecture lecture={etatR.lecture} phase="en-cours" titre={lectureUi.titreDe(etatR.messageId)} onDeplier={() => lectureUi.setReplie(false)} />;
    }
    if (etatR.etape === 'range' && etatR.lecture?.etapes?.length && lectureUi.fermee !== etatR.messageId) {
      const id = etatR.messageId;
      return <BarreLecture lecture={etatR.lecture} phase="fin" titre={lectureUi.titreDe(id)} nom={lectureUi.articleDe(id)?.article.nom}
        onDeplier={() => lectureUi.setReplie(false)} onFermer={() => lectureUi.setFermee(id)} />;
    }
    return null;
  })();
  return { cadre, champ: barreLecture ? <>{barreLecture}{champ}</> : champ };
}`]
];
