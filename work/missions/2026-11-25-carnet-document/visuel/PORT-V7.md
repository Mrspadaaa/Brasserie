# Port de la v7 dans un 2e jouable (nuit du 25.11)

Tour 3 final : v7 8 (critique) · 8,5 (TDAH + action) · 8,3 (UX + IA + novice), « répond au besoin : oui » chez les trois ; v6 6,5–7,5, v2 6,5–7.
Son accord de nuit : « si maquettes il y a et que d'après les critiques elles répondent toutes aux besoins tu peux en faire le portage aussi ».

## 1. Retouches de la v7 (listes en fin de juge-critique-3.md, juge-action-3.md, juge-produit-3.md)
Un seul vert « meilleur » (celui de 👑) ; « Prendre » suit 👑, jamais « ✦ conseillé » ; après « Prendre », le héros devient « Commander chez B · J-n » et
la colonne choisie ressort ; la jauge dit « total » ; « Raccord changé » (déjà fait) sort des pistes et du compte n/m ; une seule icône 🛒, pas de
légende qui répète la valeur ; « 20 L / fût » ; picto de lien sur « Ouvrir les liens » ; CO2 sous 30 mots avec 2 à 3 mots de marge ; sans IA :
ses lignes en entier (jamais « … ») et sa date avec ses mots (pas « semaine du ») ; barres horizontales de v2 en repli à 4 offres ou plus.

## 2. Le jouable
Nouveau fichier `work/missions/2026-11-25-carnet-document/jouable/m4b-v7.html` : copie de `jouable/m4b.html` (moteur intact : Claude par
sample, journal db, consigne et validation des citations, lecture auto, Organisé par défaut, Mes notes = vraie note, liste v01, exemples,
« + », Aide), dont la vue Organisé est remplacée par la v7 retouchée. Ajoute à la consigne les champs dont la v7 a besoin (héros = une tâche
du brasseur avec sa date / compte à rebours, ou « ✓ Réglé » ; état réglé ; coût total des offres ; ce qui est déjà fait) et valide-les côté page
(citations exactes, rien d'inventé). Pas de frise. `m4b.html` reste tel quel (c'est le jouable publié).
Joue l'IA toi-même sur les 14 exemples + 5 cas fictifs (visuel/cas-fictifs.json), rends par un window.claude simulé, capture Organisé de
chacun, juge contre les règles (DEFAUTS-RECURRENTS § ORGANISE-TROP-TEXTUEL, FRISE-GENERIQUE, ENTETE-PEU-UTILE), corrige, rejoue.

## Contrat
Possède : jouable/m4b-v7.html, jouable/cap-v7/, jouable/reponses-v7/, jouable/CAS-V7.md, visuel/v7.html (retouches). Rien d'autre.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : liste, ouvrir, Organisé de chaque cas, héros ✓ / plus tard / Prendre / Rouvrir, toucher → sa ligne, Aide, refuser, IA absente,
écrire depuis Organisé.
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core connecté au Chrome de débug port 9222, ton propre onglet, page.close() puis
browser.disconnect(), jamais browser.close(). Captures 1280 : aucune. Les id d'éléments ne croisent jamais les id des <symbol>.
Mots au repos et px de la 1re info utile par cas dans CAS-V7.md. Ouvre chaque capture. Commit local de tes seuls chemins (git add -f).
Si ton contexte approche 350 k : écris jouable/REPRISE-V7.md et rends « REPRISE : <fichier> ».
