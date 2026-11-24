import { R } from './r.mjs';
R('src/ui/carnets/apercuCarnet.tsx', [
 ['  replie: boolean; setReplie: (v: boolean) => void;\n', '  replie: boolean; setReplie: (v: boolean) => void;\n  /** T30-1, T30-3 : la lecture est dans la vue du lien (carnet du collage) ; sinon la carte vit en barre repliée, en bas. */\n  ici: boolean;\n  /** La carte est en barre : repliée par le brasseur, ou hors de la vue du lien. */\n  enBarre: boolean;\n'],
 ['        if (lectureUi.replie) return null;', '        if (lectureUi.enBarre) return null;'],
 ["if (etatR.etape === 'echec' && l.statut === 'introuvable') {", "if (etatR.etape === 'echec' && l.statut === 'introuvable') {\n        /* T30-1 : la carte d'échec (ses gestes mènent à ce carnet) n'est montrée que dans la vue du lien */\n        if (!lectureUi.ici) return null;"],
 ["if (etatR.etape === 'range' && !lectureUi.replie) {", "if (etatR.etape === 'range' && !lectureUi.enBarre) {"],
 ["    if (!lectureUi.replie) return null;\n    if (etatR.etape === 'en-cours'", "    if (!lectureUi.enBarre) return null;\n    if (etatR.etape === 'en-cours'"],
 ['phase="fin" titre={lectureUi.titreDe(id)} nom={lectureUi.articleDe(id)?.article.nom}\n', 'phase="fin" titre={lectureUi.titreDe(id)} nom={lectureUi.articleDe(id)?.article.nom} {...(lectureUi.ici ? {} : { carnet: lectureUi.titreDe(id) })}\n'],
]);
R('src/ui/carnets/LectureLien.tsx', [
 ["export function BarreLecture(p: { lecture: LectureEnCours; phase: 'en-cours' | 'fin'; titre?: string; nom?: string;", "export function BarreLecture(p: { lecture: LectureEnCours; phase: 'en-cours' | 'fin'; titre?: string; nom?: string; carnet?: string;"],
 ['  return (\n    <div className="cnl-dock" data-phase={p.phase}>\n      <button type="button" className="cnl-barre" data-lecture-barre data-booster="barre-lecture" onClick={p.onDeplier}\n        aria-label={`${quoi}, ${c.faites} étapes sur ${c.total} : déplier`} aria-live="polite">',
  '  /* T30-3 : vue d\'un autre carnet, la fin dit le carnet du lien sur une seconde ligne (jamais tronquée par le nom de l\'article) */\n  const deuxLignes = !enCours && !!p.carnet;\n  return (\n    <div className="cnl-dock" data-phase={p.phase}>\n      <button type="button" className="cnl-barre" data-lecture-barre data-booster="barre-lecture" data-deux={deuxLignes || undefined} onClick={p.onDeplier}\n        aria-label={`${quoi}${deuxLignes ? `, dans « ${p.carnet} »` : \'\'}, ${c.faites} étapes sur ${c.total} : déplier`} aria-live="polite">'],
 ['        <b className="cnl-barre-quoi">{quoi}</b>\n', '        {deuxLignes\n          ? <span className="cnl-barre-quoi cnl-barre-deux"><b>{quoi}</b><span className="cn-mut">dans « {p.carnet} »</span></span>\n          : <b className="cnl-barre-quoi">{quoi}</b>}\n'],
]);
R('src/ui/carnets/lecture-lien.css', [
 [".cnl-barre-quoi { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n", ".cnl-barre-quoi { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.cnl-barre[data-deux] { height: 40px; }\n.cnl-barre-deux { display: flex; flex-direction: column; line-height: 16px; }\n.cnl-barre-deux > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n"],
]);
R('src/ui/carnets/CarnetsVue.tsx', [
 ["import { carnetAOuvrirDepuisBarre } from './lectureRegles';", "import { carnetAOuvrirDepuisBarre, carteEnBarre, lectureIci } from './lectureRegles';"],
 ["  const lectureUi: LectureUi = {\n    replie: lectureRepliee, setReplie: setLectureRepliee,", "  /* T30-1 : la carte entière n'est que dans la vue du lien ; quitter cette vue la replie en barre (v01) sans toucher « Replier » */\n  const lectureVue = 'lecture' in etatR && 'messageId' in etatR ? etatR : undefined;\n  const lectureIciVue = !lectureVue?.lecture || lectureIci({ carnetDuLien: lectureVue.lecture.carnetId, carnetDuMessage: carnetDuMessage(lectureVue.messageId), idOuvert });\n  useEffect(() => { if (!lectureIciVue) setLectureRepliee(true); }, [lectureIciVue]);\n  const lectureUi: LectureUi = {\n    replie: lectureRepliee, setReplie: setLectureRepliee, ici: lectureIciVue, enBarre: carteEnBarre(lectureRepliee, lectureIciVue),"],
]);
