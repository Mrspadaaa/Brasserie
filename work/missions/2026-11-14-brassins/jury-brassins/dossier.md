# Dossier du jury — Brassins (liste, fiche d'un brassin, suivi de fermentation)

Niveau : normal (Brasseur, Contradicteur, Premiers principes ; tous en Opus, Fable interdit).

## Hypothèse (confiance 75 %)
Le brasseur ouvre Brassins au téléphone, dans sa cuverie, pour une seule chose : « où en est ma cuve et que dois-je faire
maintenant ? ». L'écran doit rendre, en un coup d'œil, la courbe en jours de chaque cuve et le prochain geste daté, et laisser
relever densité et température au curseur en un toucher ; le stock, l'installation, le budget et le Carnet passent à un toucher.
Confiance 75 % : ses mots sur les brassins eux-mêmes sont rares (il n'a jamais vu ces écrans refaits).

## Sources (lire ; n'ouvrir l'original que pour vérifier)
- Analyse au banc : `work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md` (fonctions existantes et manques, avec fichier:ligne),
  `work/missions/2026-11-14-brassins/voies/a2-ecran/VERDICT.md` (36 problèmes, 4 bloquants, section « Pour les maquettes »).
- Captures (4) : `voies/a1-banc/captures/liste-remplie-390-clair.png`, `fiche-fermentation-390-clair.png`,
  `saisie-releve-densite-ouvert-390-clair.png`, `liste-remplie-1280-clair.png`.
- Ses mots, `work/refonte-frontend/v4/SPEC-BRASSEUR.md` :
  - 14.11 : « Brassins (liste, fiche d'un brassin, fermentation) : suite directe du jour de brassage, jamais repris. » ;
    « lance … avec la création de mini maquettes (non jouable) SANS FABLE ».
  - 10.11 : « utilise des slider plutot que de chiffre des input de chiffre sur téléphone » ; « utilise les ux, ui booster » ;
    « Ça invite pas au mesures, c'est pas bien fait, pas de renvoi... » (vue du jour de brassage).
  - 10.11, page « mesurer au curseur » : « Le geste, joué au doigt (commun aux 10) » (pouce en pointillé, un toucher pose la
    cible, piste puis ±0,1, après : horloge et Relevés du jour) ; m2 choisie : « non part là dessus ».
  - Densité d'écran (§ 3) : « Il faut que ce soit dense sur téléphone » ; cerveau `brasseur/pas-de-cockpit.md` (premier plan
    léger, détails à un toucher) ; `brasseur/penser-brasseur.md`.
- Registre des choix `work/refonte-frontend/v4/choix/ecrans.json` : aucune entrée brassins (aucune maquette choisie).
- Base visuelle déjà en ligne et choisie pour le jour de brassage : z1 + m2 (tag `en-ligne/2026-11-12-p2c`, `src/pages/BrewDayPage.tsx`,
  `src/ui/BrewDayMeasurements.tsx`, `src/ui/BrewReadingsSummary.tsx`) : en-tête de lot, frise des étapes, carte « Relevés du jour »,
  feuille Mesurer au curseur.

## Questions retenues, avec la réponse que le pilote recommande
Retirées : J9 (le code est lu par a1, cité par fichier:ligne), J15 (couverte par J13), J18 (posée en fin d'avis à chacun).

- J1 scène. Recommandé : cuverie, téléphone, une main (l'autre tient l'éprouvette ou le densimètre), attention hachée, 1 à 2 fois
  par jour pendant 1 à 3 semaines par cuve ; au bureau à 1280, rarement (bilan, comparaison).
- J2 geste. Recommandé : « où en est ma cuve, que faire maintenant » + relever ; un écran = la cuve, la liste = ses cuves.
- J3 pourquoi. Recommandé : VERDICT 1, 4, 5, 10, 12, 17, 19, 36 ; et « jamais repris » (14.11).
- J4 réussite. Recommandé : au premier écran de la fiche à 390 : J+n juste, dernière densité et °C, prochain geste daté, courbe en
  jours ; un relevé en 2 touchers au plus, sans clavier ; liste : toutes les cuves pleines visibles sans filtre.
- J5 acquis. Recommandé : le geste au curseur de m2 tel qu'il est (cible en bande, ±0,1, valeur tapée à un toucher) ; la grammaire
  de z1 (en-tête de lot, Relevés du jour) pour la continuité avec le jour de brassage ; inconnu = « — » ; jamais `type="number"`.
- J6 refusé. Recommandé : cockpit (tableau « mon installation » plein de « – », VERDICT 21), paragraphes au premier plan, bandeaux
  d'alerte en tête (VERDICT 10, 27), codes internes (« ZZ-HOP-ARO »), numéro de version (« Atelier Houblons V5.5 »).
- J7 contraintes. Recommandé : hors ligne (le relevé s'écrit au cache), chiffre jamais inventé (pas de FG prédite affichée comme
  mesurée), aucun changement du moteur ; densité d'information > aération, mais le geste prime sur l'information.
- J8 mots. Recommandé : « J+n » compté depuis le levurage, dit « J+5 · levuré le 09.11 » ; « Terminé » ambigu (VERDICT doute) :
  « Vendu » ou « Clos » ? (GOÛT) ; « Garde froide », « Conditionné » gardés ; dates nommées : brassé, levuré, mis en bouteille.
- J10 premier plan fiche. Recommandé : en-tête de lot (nom, J+n, étape) ; prochain geste ; courbe densité + °C en jours avec FG
  visée ; bouton Relever. À un toucher : relevés détaillés, stock, carnet, installation, budget, suppression.
- J11 limites. Recommandé : aucun relevé encore (juste levuré), relevé manquant depuis > 2 jours, densité stable (finie ?), FG au-
  dessus de la cible stable (fermentation bloquée), brassin planifié (lancer le jour de brassage), conditionné (bouteilles, fûts),
  clos (bilan), hors ligne.
- J12 hors périmètre. Recommandé : la vue du jour de brassage (autre session) ; le Stock ; l'assistant de recette ; le moteur.
- J13 approches (axes de variantes). Recommandé : (a) « la cuve d'abord » : la courbe est l'écran ; (b) « le prochain geste
  d'abord » : une file de gestes datés (dry hop, relevé, garde, embouteillage) ; (c) « la frise de vie du brassin » : brassé →
  levuré → dry hop → garde → conditionné → clos, comme la frise du jour de brassage ; liste : cartes-cuves avec mini-courbe
  ou tableau dense de cuves.
- J14 supposé. Recommandé : 1 relever = densité + °C ensemble ; 2 la consigne °C vient de la recette figée ; 3 « stable » =
  deux relevés à ≥ 24 h à 0,001 près ; 4 le dry hop daté vient du `dayOffset` de la recette.
- J16 irréversible. Recommandé : nouveaux champs facultatifs sur le brassin (dry hop ajouté le, relevés de °C seuls,
  bouteilles et fûts déjà prévus par le type mais jamais écrits) : ajouts compatibles, pas de migration ; ACCORD seulement pour
  le déploiement.
- J17 bâtisseur. Recommandé : le pari le plus risqué : relevé densité + °C au même geste ou séparés (une sonde vs un densimètre).

Chaque regard : 40 mots au plus par réponse, une classe (SOURCE, PILOTE, GOÛT, ACCORD, MESURE, CONSEIL), puis J18 (autre chose),
puis `LEÇON PROPOSÉE : …`.
