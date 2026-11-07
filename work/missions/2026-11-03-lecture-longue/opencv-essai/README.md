# Essai OpenCV.js (D381, 03 au 07.11) — écarté, archivé

La découpe d'une photo par la chaîne d'école (OpenCV.js 5.0.0, build officielle docs.opencv.org, md5 ad24594c… ; coins du papier par Canny et
Otsu, `approxPolyDP` / `minAreaRect`, côtés affinés par `fitLine`, redressement 4 points `warpPerspective`, marges adaptées, option « division par le
fond »), dans un worker à CSP propre (`'unsafe-eval'` pour ce seul fichier, accord du brasseur). Code tel qu'essayé : `decoupePerspective.ts`,
`decoupePerspective.worker.ts`, `decoupe.avec-opencv.ts`, `harnais.avec-opencv.ts`, `controler.avec-opencv.mjs`, `firebase.json.diff`.

Verdict sur 200 pièces NEUVES (graine 2, jamais vues au réglage ; banc à masque exact, CSP de production) :

| Voie | Coupes silencieuses | Lignes perdues | Rognées | Plan médian |
|---|---|---|---|---|
| Voie de l'app (F) | 88 | 0 | 0 | 995 ms |
| OpenCV | 114 | 143 | 78 | 847 ms |
| OpenCV + division par le fond | 73 | 219 | 12 | 1 544 ms |

Ses 5 tickets réels : OpenCV 2 à 3 fois plus lent, 2 refusés sur 5 ; son ticket du 07.11 (métal gaufré à reflets) : aucune des deux voies ne trouve
le papier, il se lit entier comme avant. Les coins trouvés sur des photos réelles (ombre, coin replié, reflets, texture) sont faux trop souvent ; un
cadre faux PERD des lignes, ce que la voie de l'app ne fait jamais (son recadrage grandit sur le texte). Écarté : la voie F reste servie.
