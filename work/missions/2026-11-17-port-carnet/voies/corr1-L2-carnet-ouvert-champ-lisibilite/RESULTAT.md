ECHEC — 3 sur 5 corrigés ; P5 et la cause de P12 sont dans CarnetsVue.tsx, que je ne possède pas

Lot L2-carnet-ouvert-champ-lisibilite, correction 1, 17.11. Worktree `port-carnet`, branche `claude/port-carnet-1711`. Pas de commit.
`CRITIQUE-1.md` n'existait pas encore au début du lot. J'ai travaillé sur le texte du brief et sur `vision-1/` (captures m390-clair-10 et -36, ouvertes).

## Fichiers écrits (tous dans « Possède »)

- `src/domain/carnets/doublons.ts` : ajout de `memeTexte` (égalité stricte après normalisation : casse, accents, ponctuation, espaces) et de `uniquesParTexte`.
- `src/domain/carnets/operations.ts` : dans `ajouterLigne`, un critère au même texte normalisé n'est pas ajouté une deuxième fois. L'ancien garde son id et son `messageId`, et reçoit seulement la raison ou la caractéristique qui lui manquent.
- `src/domain/carnets/analyseLocale.ts` : `PUCES_VA_DANS` et `vaDansDe(texte)`, prêts pour le câblage de P5.
- `src/ui/carnets/CarnetOuvert.tsx` : rendu de « Ce qui compte » (P11 b) et en-tête Articles (P10).
- `src/ui/carnets/carnets.css` : `.cn-criteres`, `.cn-critere-court`, `.cn-tete-articles`, et la pastille de façon qui se replie (voir « Doutes »).
- Tests : `carnetsDoublons`, `carnetsOperations`, `carnetsEcrans`, `carnetsAnalyseLocale`.
- Captures (ce dossier) : `m390-{clair,sombre}-{1-ce-qui-compte-articles,2-bulle-g8,3-texte-pendant,4-apres-envoi}.png`, `d1280-clair-1-ce-qui-compte-articles.png`, `journal-captures.txt`.

## Problème → fait → preuve

**P10 (gênant), « Comparer côte à côte › » recouvre « 4 lus, 1 sans aperçu » à 390. CORRIGÉ.**
- Cause : le compte portait `cn-sp` (`flex: 1; min-width: 0`) avec `nowrap`. Il se laissait écraser sous le lien.
- Fait : le compte garde sa largeur. Le lien a `margin-left: auto` : faute de place, il passe à la ligne, calé à droite, comme sur p2:i06-4. À 1280, tout tient sur une ligne. La cible fait 44 px.
- Preuve, mesures DOM du journal : à 390, compte de x 100 à 228 et y 495, lien de x 206 à 378 et y 519, h 44, `recouvre:false`, `debordeCompte:false`, dans les deux thèmes. À 1280 : compte de 360 à 488, lien de 836 à 1008, sur la même ligne.
- Captures ouvertes : m390-clair-1, m390-sombre-1, d1280-clair-1.
- Test : « P10 : l'en-tête Articles garde le compte entier… » (vert).

**P11 (gênant), critère en double et « tiré de votre phrase » ×4. CORRIGÉ.**
- (a) Envoyer « Plus de condensation au plafond » dans Ventilation n'ajoute plus de ligne. ZZ-V-K1 reste, avec son `messageId` ZZ-MSG-V1. Le message est gardé, sans effet `critere` : l'annuler ne retire donc pas l'ancien critère. Le même texte deux fois dans un message ne donne qu'une ligne. La reprise par l'IA (`remplacerRangement`) ne recrée pas de doublon.
  - Tests (verts) : 3 dans `carnetsOperations` « P11… », 2 dans `carnetsDoublons`.
  - Banc 390 : après l'envoi, « Ce qui compte » montre toujours 3 lignes (journal ; capture m390-clair-4 ouverte).
- (b) Avec un seul critère, la ligne du figé i06-4 ne change pas : « Ce qui compte, proposé par l'IA : … ».
  - Avec deux critères ou plus, « Ce qui compte, <provenance> : » s'écrit une fois en tête, puis une ligne courte en gras par critère.
  - Si les provenances se mêlent, la tête dit la plus fréquente, et une ligne d'une autre provenance le dit en court à sa fin.
  - L'affichage passe aussi les doublons déjà enregistrés. Une ligne « rangée » qui pointe vers un doublon masqué s'encadre sur la ligne gardée.
  - Tests (verts) : 3 dans `carnetsEcrans` « P11… ». J'ai mis à jour l'attente de R03 : le carnet de test a deux critères, donc tête plus lignes.
  - Captures ouvertes : m390-clair-1, m390-sombre-1, d1280-clair-1.

**P5 (gênant), puces « Va dans » absentes en Texte · pendant. NON CORRIGÉ (hors périmètre).**
- Comparaison avec g5:v02-10 (ouverte) : les puces « Va dans [Ce qui compte] [Note] [Façon] » sont dans la zone du champ, juste au-dessus. C'est la place que `ChampCarnet` leur donne déjà, à la condition `vaDans && plein`. Aucun changement de place n'est donc à faire.
- Cause : `CarnetsVue.tsx` ne passe jamais `vaDans` à `ChampCarnet`, et la correction choisie doit aussi être respectée à l'envoi, y compris quand l'IA reprend le message (`rangement.ts`). Ni l'un ni l'autre n'est à moi, et un autre lot modifie `CarnetsVue.tsx` en ce moment.
- Fait : `vaDansDe` et `PUCES_VA_DANS` existent dans `analyseLocale.ts`, avec un test vert. `vaDansDe` rend « critère » pour « un fût de 30 L couché doit entrer dans le bac », « note » pour une phrase simple, et rien pour un lien, un prix ou une note en vrac. Le câblage est décrit dans DEMANDE.
- Je n'ai pas affiché de puces qui ne corrigeraient rien : ce serait un geste factice.

**P12 (mineur), le champ garde « attendre l'avis du ferblantier ». CAUSE TROUVÉE, chemin normal vérifié, cause NON CORRIGÉE (hors périmètre).**
- Chemin normal : après un envoi accepté, le champ se vide et « Ajouter » disparaît.
  - Test « P12 : après un envoi accepté… », sur `CarnetsVue` avec la fixture : vert.
  - Banc 390, deux thèmes : `après envoi : {"valeur":"","envoi":false}` (capture m390-clair-4 ouverte).
- Cause du texte resté : « attendre l'avis du ferblantier » est la note ZZ-V-N1. L'état 32b (« Modifier une note ») a mis son texte dans le champ (`setEdition` et `setTexte`). Rien ne referme ensuite ce mode : `cadre()` rend `null` dès qu'une modification est en cours, si bien que le cadre « Se modifie ici · ✕ » n'est jamais affiché. Supprimer la note, ou passer à « Supprimer l'idée », laisse aussi le texte en place. Sur m390-clair-36, la flèche est déjà grisée, car le champ est désactivé pendant la confirmation.
- Le correctif est dans `CarnetsVue.tsx` : voir DEMANDE.

**P13 (mineur), bulle G8 non vue à 390 au focus (Ventilation). NON REPRODUIT ; vérifié.**
- Au toucher (`touchscreen.tap`, 390, isMobile, hasTouch) sur le champ vide de Ventilation, la bulle paraît dans les deux thèmes : « Le critère « plus de condensation au plafond » peut trancher entre Hotte inox + extracteur et Extracteur mural seul ». Le picto est local (calculette), sans ✻.
- Captures ouvertes : m390-sombre-2 ; vision-1 m390-clair-10 la montrait déjà.
- Test vert : « P13 : sur Ventilation, au focus du champ vide… », sur `CarnetsVue` avec la fixture. Il prouve que `critereQuiTranche` n'est pas nul et que la bulle s'ouvre au focus.
- Cause probable du constat : `montrerBulle` exige un champ vide. Si le passage du critique suivait une modification de note restée ouverte (P12), le champ n'était pas vide et la bulle ne pouvait pas paraître. Aucun réglage des aides ne la bloque : G8 n'a pas d'interrupteur dans `AidesV`.

## Contrôles

- `npx vitest run tests/unit/carnetsOperations.test.ts tests/unit/carnetsEcrans.test.tsx tests/unit/carnetsDoublons.test.ts tests/unit/carnetsAnalyseLocale.test.ts` : 4 fichiers, 110 tests, tous verts.
- Rejoués aussi, verts : `carnetsRangement`, `carnetsIA`, `tests/integration/carnetsParcours.test.tsx`.
- `npx tsc --noEmit -p .` : sortie 0, aucune erreur.
- Banc : `vite` en dev sur le port 60433 avec une config Firebase factice (`demo-banc-local`), `?preview=carnets`. Serveur arrêté après les captures : 0 écoute sur 60433. Pas de build, `dist` intact. Aucun appel Gemini (IA simulée du banc).
- Essais : P10 1, P11 2 (attente R03 mise à jour, compte « 3 lus » corrigé dans mon test), P13 1. Banc : 2 essais ; le premier s'est arrêté sur « Impossible de charger » faute de config Firebase factice.

## Doutes et limites

- Un autre lot a ajouté à la fixture la note ZZ-V-N2 (ZZ-MSG-V3). Trois tests de `carnetsOperations` que je possède comparaient la liste entière des notes de Ventilation, et ils ont échoué à cause de cet ajout. Je les ai ciblés sur ZZ-V-N1 et N-D, sans changer ce qu'ils prouvent.
- Correctif hors liste : à 390, la pastille de raison d'une façon (« brasse la buée sans la sortir », façon ajoutée par l'autre lot) sortait de sa carte. Elle se replie maintenant (`.cn-facon .cn-pastille`). Vu sur m390-clair-1 avant le correctif et sur m390-sombre-1 après.
- Avec la fixture du banc, les critères « exemple » sont dits « tiré de votre phrase », comme avant. Seul « ia » est dit « proposé par l'IA ».
- `changerSorte` vers critère (G25 « Passer en Ce qui compte ») peut encore créer un doublon. Je ne l'ai pas touché : fusionner déplacerait l'effet du message vers un critère plus ancien, et l'annuler le retirerait. Le rendu masque ce doublon.

## DEMANDE (au propriétaire de `CarnetsVue.tsx`)

1. P12 : refermer la modification de note.
   - Dans `cadre()`, avant `if (!texte.trim() || edition) return null;`, ajouter :
     `if (edition && ouvert) return <CadreArrivee cadre={{ sorte: 'modifier', onSupprimer: () => { /* supprimerNote(edition) */ setEdition(null); setTexte(''); } }} onAnnuler={() => { setEdition(null); setTexte(''); }} aides={aides} />;`
   - Ajouter `useEffect(() => { if (edition && !ouvert?.carnet.notes.some(n => n.id === edition)) { setEdition(null); setTexte(''); } }, [edition, ouvert]);`
   - Appeler `setEdition(null); setTexte('')` dans `onRetour` et dans `onSupprimer` du carnet.
   - Garder le texte seulement quand `rangement.envoyer` échoue, ce qui est déjà le cas.
2. P5 : câbler « Va dans ».
   - Ajouter `const auto = depuis && !edition ? vaDansDe(texte) : null;` et un état `corrige: RubriqueVaDans | null`, remis à `null` à l'envoi et quand le champ se vide.
   - Passer à `ChampCarnet` : `vaDans={vue.sorte === 'carnet' && auto ? { options: [...PUCES_VA_DANS], choisi: corrige ?? auto, onChoisir: id => setCorrige(id as RubriqueVaDans) } : null}`.
   - Le cadre `texte` prend la rubrique de `corrige ?? auto`.
   - À l'envoi, si `corrige` est posé, `ecrireLocal` range la ligne dans cette sorte (`facon` → `{ sorte: 'facon', nom: texte, origine: 'vous' }`), et `ecrireIA` ne la déplace plus (sorte forcée passée à `rangement.ts`, ou pas de `remplacerRangement` pour ce message).
3. Rejouer ensuite `carnetsEcrans` « P12 » et « P13 », puis prendre une capture 390 de Texte · pendant dans Évier inox.

DÉCISION À PRENDRE : la correction « Va dans » doit-elle aussi tenir quand l'IA reprend le message ? Options :
- (a) la sorte corrigée est forcée et l'IA ne la change plus ;
- (b) l'IA peut encore la changer.

Ma recommandation : (a). Sa correction est un choix explicite ; « Rangé derrière » veut dire qu'il corrige, pas que l'IA le corrige ensuite.

CONNAISSANCE : le banc `?preview=carnets` en dev demande une config Firebase factice complète (`VITE_FIREBASE_API_KEY` et `VITE_FIREBASE_PROJECT_ID` au moins, ici `demo-banc-local`). Sans elle, la page affiche « Impossible de charger la brasserie ».

LEÇON PROPOSÉE : un mode qui met du texte dans le champ (modifier une note) doit avoir sa sortie visible (✕) et se fermer quand son objet disparaît. Sinon le texte resté contamine les états suivants du banc et fait naître de faux constats (P12, et sans doute P13).
