# Voie v2 — mini maquettes, passe 2 : un curseur plutôt qu'un champ chiffré (mission 2026-11-10-brassin-mesures)

- Agent : concepteur · Modèle : opus · Plafond : 50 tours · Décideur : le brasseur
- Lis : `CLAUDE.md` (règle n° 1), `cerveau/LECONS.md` (L01, L03, L12, L24, L26), `.claude/rules/affinee-frontend.md`, `DESIGN.md`,
  `cerveau/produit/saisie-mobile.md` ; la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (10.11 : « Ça invite pas au mesures… » et
  « utilise des slider plutot que de chiffre des input de chiffre sur téléphone ») ; `../v1/RESULTAT.md`, `../../critique/SYNTHESE.md`
  (classement m2, m8, m1, m7, m5 ; manques communs : la raison du relevé, la valeur répétée deux ou trois fois après le relevé) ;
  la page v1 `../../page/index.html` et ses sources `../v1/`.

## Objectif
Plancher à enrichir (L07). Reprends les 10 variantes de v1 sans rien changer d'autre que :
1. **la saisie** : dans la feuille Mesurer (pH, Temp., Densité, Volume), au téléphone, un curseur posé sur l'échelle cible de z1 (bande
   cible, graduations, relevé en trait) remplace le champ chiffré comme geste principal ; valeur lue en grand, écart à la cible dit en
   couleur comme z1 ; pas fin adapté (pH 0,01, °C 0,1, densité 0,001, L 0,1), départ du curseur sur la cible ou le dernier relevé, jamais
   une valeur inventée enregistrée sans geste ; la valeur tapée reste à un toucher (toucher la valeur), jamais `type="number"`. Cible
   tactile du pouce confortable sans grossir le reste (DESIGN.md) ;
2. **les deux manques communs du critique** : la raison du relevé à un toucher, et la valeur relevée une seule fois après le relevé.
États à capturer par variante : repos, feuille ouverte avec le curseur, curseur déplacé hors cible, après. 390 tactile ; les trois
premières du critique aussi en cave et à 1280 (à 1280, le champ peut rester à côté du curseur).

## Page
Nouvelle page `../../page-v2/index.html` (copie la structure de v1) : sa capture et z1 en tête, puis chaque variante.
`node scripts/agents/verifier-page.mjs <page> --page-lot --captures <préfixe>` → PAGE OK, sortie écrite dans
`work/missions/2026-11-10-brassin-mesures/voies/v2/tests.txt` (la ligne « Tests », comme `--reporter=dot > …`) ; captures toutes ouvertes.

## Possède
`work/missions/2026-11-10-brassin-mesures/voies/v2/**` et `work/missions/2026-11-10-brassin-mesures/page-v2/**`. Rien dans `src/`.
Aucun déploiement, aucune donnée réelle, ni commit ni stash. Fichiers de travail : OWNS ou os.tmpdir(). À 150 k : « REPRISE : <fichier> ».

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). Réponse finale au pilote : une ligne.

## Méthode exigée (ses mots du 10.11 : « utilise les ux, ui booster » ; « enfin les vraim truc mis en place... »)
Avant de dessiner, invoque par l'outil Skill : `boosters-ux` (check-list d'écran et boosters : curseur, pastille, jauge, plage…),
puis `impeccable` et `ui-design-system`. Applique la check-list de `boosters-ux` à chaque variante et écris dans RESULTAT.md, par
variante, les boosters retenus et les points de la check-list vérifiés sur capture (hiérarchie, premier plan, états, retour du geste,
saisie au téléphone, cible du pouce). Réemploie les composants et jetons existants (DESIGN.md, `src/ui/` : échelle `MeasureScaleView`
de `BrewDayMeasurements.tsx`), aucun dessin libre hors grammaire z1.
