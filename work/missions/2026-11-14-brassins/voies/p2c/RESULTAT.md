OK — s3b2 : frise du plan corrigée, calendrier 12 cases, dry hop J+6→J+5, liste à mini-courbes

Fichiers écrits (OWNS seul) :
- `voies/p2c/s3b2/etat.html` (base s3b copiée puis refaite, classes `s3b2-`), `s3b2/NOTE.md`, `s3b2/capture.mjs` (outil de capture)
- `s3b2/s3b2-{repos-390-clair, geste-390-clair, dryhop-390-clair, liste-390-clair, repos-390-cave, repos-1280-clair}.png`
- `voies/p2c/tests.txt`, ce RESULTAT.md

Défauts t1 corrigés (s3b) : 1 chaque densité chiffrée sur son point (1,062 · 1,058 · 1,030 · 1,018) · 2 19,6 gris, tolérance écrite une
fois (« consigne 19 °C (18 à 20) ») · 3 repos 21 °C en tuiles J+7 à J+9 · 4 bas rempli (calendrier, Stock, Carnet, Dossier en boutons
de 48 px) · 5 bande du curseur 18 à 20 °C. Retouches communes 1 à 5 et 7 tenues (6 : s.o.).
Greffes intégrées : calendrier 12 cases (s3e) fusionné avec les cases °C /19 (s1c) ; pastilles datées (s2e) ; dry hop J+6 barré → J+5,
1 j d'avance, stock −180 g, Annuler (s3d) ; barre des phases (s2a) ; liste à mini-courbes, Pils sur la seule partie connue (s1a) ; Pale Ale
« Brasser / Replanifier » en tête ; relevé dans la rangée (s1b).

Critères :
- G1 : `PASSE OK`
- G2 : `MESURE OK` (tests.txt porte `PANEL ECHEC` : remplissage médian 0,61, 0 sous 0,50 ; seule la DIVERSITÉ échoue, 0,91 sur 2 captures
  d'une même variante, repos et geste partageant la frise : échec structurel de la mesure à une seule variante)
- controle-commun --sans=mots --profil=sans-houblons : `COMMUN OK` (standard corrigé : rayons 6 px → 10 px)
- Aucun bouton sous 44 px, scrollWidth 390 à 390 px, `type="number"` : 0.

Images ouvertes et jugées (toutes) : repos, geste, dryhop, liste en 390 clair ; repos 390 cave ; repos 1280 clair. Corrigé après regard :
collisions « dry hop J+6 » / « 21 °C repos », « FG » / « J+10 » puis « J0 », étiquettes de la mini-courbe, espace perdue dans les pastilles,
1280 rééquilibré (frise à gauche, relevés et calendrier à droite).

Prédiction : « Là je vois où en est la cuve et ce qui reste, et je relève au doigt ; la grille jour par jour me parle. »

DÉCISION À PRENDRE : aucune (G2 lit la présence d'une ligne PANEL ; le pilote juge si la diversité à 2 captures compte).
CONNAISSANCE : `controle-standard --profil=sans-houblons` n'admet que les rayons 10, 16, 24 px (pilule et rond compris) : 6 et 8 px échouent.
LEÇON PROPOSÉE : aucune
