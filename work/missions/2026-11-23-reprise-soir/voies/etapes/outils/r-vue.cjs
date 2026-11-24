module.exports = [
[`import { creerRangementCarnets } from './rangementCarnets';`,
`import { creerRangementCarnets } from './rangementCarnets';
import { suiviLocal } from '../../domain/carnets/lecture';
import type { ArticleV } from './EtatIA';
import type { LectureUi } from './apercuCarnet';`],

[`  const [etatR, setEtatR] = useState<EtatRangement<LigneLocale>>({ etape: 'repos' });`,
`  const [etatR, setEtatR] = useState<EtatRangement<LigneLocale>>({ etape: 'repos' });
  /** D448 : la carte des étapes repliée en barre (v01) ; la carte de fin ou d'échec fermée (par son message). */
  const [lectureRepliee, setLectureRepliee] = useState(false);
  const [lectureFermee, setLectureFermee] = useState<string | null>(null);
  /** T26-4 : l'inverse du retrait d'un lien mort, par message (« Compléter » rend l'article). */
  const inversesLiens = useRef(new Map<string, EcritureCarnet[]>());
  /** IA-ETAPES-VISIBLES : les lectures lancées, gardées sur l'appareil jusqu'à leur fin (réouverture). Sans IA : rien. */
  const suivi = useMemo(() => (mode === 'eteint' ? undefined : p.suiviLectures ?? suiviLocal()), [mode, p.suiviLectures]);`],

[`    retourRef, vueRef, neDeListe }), [mode, depuis, enLigne, magasin, appliquer, maintenant, p.appels, retourDe, setRetour, poserRetourEtat, poserAvis]); // eslint-disable-line react-hooks/exhaustive-deps`,
`    retourRef, vueRef, neDeListe, suivi, inversesLiens }), [mode, depuis, enLigne, magasin, appliquer, maintenant, p.appels, retourDe, setRetour, poserRetourEtat, poserAvis, suivi]); // eslint-disable-line react-hooks/exhaustive-deps

  /* IA-ETAPES-VISIBLES : à l'ouverture, une lecture lancée avant la fermeture de l'app est reprise par son jeton (une fois) */
  const lecturesReprises = useRef(false);
  useEffect(() => {
    if (lecturesReprises.current || !suivi) return;
    lecturesReprises.current = true;
    void rangement.reprendreLectures();
  }, [rangement, suivi]);
  /* une lecture neuve (son jeton) se montre dépliée */
  const jetonLecture = etatR.etape === 'en-cours' ? etatR.lecture?.jeton ?? null : null;
  useEffect(() => { if (jetonLecture) { setLectureRepliee(false); setLectureFermee(null); } }, [jetonLecture]);
  const carnetDuMessage = (messageId: string) => {
    const m = lireMessages(magasin.lire()).find(x => x.id === messageId);
    return m?.carnetMessage.effets.find(e => e.cible === 'article')?.carnetId ?? m?.carnetMessage.effets[0]?.carnetId;
  };
  const lectureUi: LectureUi = {
    replie: lectureRepliee, setReplie: setLectureRepliee, fermee: lectureFermee, setFermee: setLectureFermee, exemple: mode === 'simule',
    onEscalader: (id, t) => { setLectureFermee(null); void rangement.escalader(id, t); },
    onCompleter: id => {
      const inv = inversesLiens.current.get(id);
      if (inv) { annuler(inv); inversesLiens.current.delete(id); }
      setLectureFermee(id);
    },
    onAutreLien: id => { setLectureFermee(id); setTexte(''); champRef.current?.focus(); },
    articleDe: id => {
      for (const c of lireCarnets(magasin.lire(), { archives: true })) {
        const a = c.carnet.articles.find(x => x.messageId === id);
        if (a) return { article: a as unknown as ArticleV, carnetId: c.id };
      }
      return null;
    },
    titreDe: id => { const cid = carnetDuMessage(id); return cid ? tous.find(c => c.id === cid)?.title : undefined; },
    ouvrirArticle: (carnetId, articleId) => { setLectureFermee(null); setVue({ sorte: 'article', id: carnetId, articleId }); }
  };`],

[`    ajouterEnFacon, aPart, setAPart, titreEdite, setTitreEdite, renommerOuvert, envoyer, vientDEtreCree, plierApresToucher, photo, jointe, retirerJointe, pliage, presse,
    setPresse });`,
`    ajouterEnFacon, aPart, setAPart, titreEdite, setTitreEdite, renommerOuvert, envoyer, vientDEtreCree, plierApresToucher, photo, jointe, retirerJointe, pliage, presse,
    setPresse, lectureUi });`]
];
