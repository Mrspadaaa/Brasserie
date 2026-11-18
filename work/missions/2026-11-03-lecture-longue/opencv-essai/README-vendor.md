# OpenCV.js 5.0.0 (Apache-2.0) — copie non modifiée

Build officielle `https://docs.opencv.org/5.0.0/opencv.js`, prise du paquet npm `@techstark/opencv-js@5.0.0-release.1` (md5 ad24594c6ea6…).
Usage dans L'Affinée (D381, L29) : la découpe des longues pièces — coins du ticket, redressement 4 points, cartes d'encre —, dans un worker à part
(`src/services/decoupePerspective.worker.ts`), chargé seulement quand une longue pièce est découpée.
OpenCV.js crée ses liaisons par `new Function` (embind) : la CSP de ce seul worker autorise `'unsafe-eval'` (firebase.json, accord du brasseur du
03.11 « Je peux l'autoriser pour ce cas particulier ») ; la page garde sa CSP stricte.
