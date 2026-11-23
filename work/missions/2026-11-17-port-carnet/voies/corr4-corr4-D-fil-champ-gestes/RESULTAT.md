OK — fil, champ et gestes corrigés : 19 sur 19 ; captures sombre et 1280 confiées à l'exécutant

# Lot corr4-D-fil-champ-gestes (critique 4, 18.11)

Worktree `port-carnet`, branche `claude/port-carnet-1711`, sur HEAD `e0073224e`. Je n'ai rien commité.
Banc `?preview=carnets` (fixture « ZZ TEST — … », magasin en mémoire, IA simulée). Aucun appel Gemini, aucune écriture réelle.
Le serveur vite (port 5497, `VITE_FIREBASE_*` factices) a été arrêté après les captures. Le build est sorti dans le scratchpad, `dist` n'a pas été touché.

## Fichiers écrits

- `src/ui/carnets/CarnetsVue.tsx`
- `Bandeau.tsx`
- `CadreArrivee.tsx`
- `ChampCarnet.tsx`
- `NoteEnVrac.tsx`
- `EtatIA.tsx` (import de la CSS seulement)
- `carnets-fil.css` (neuf, classes en `cnf-`)
- `src/design/CarnetsPreview.tsx` (`&zero=1`)
- `tests/unit/carnetsCritique4Fil.test.tsx` (neuf, 14 tests)
- `tests/unit/carnetsCorrection3Fil.test.tsx` : la règle P10 est remplacée par P25 et P26.
- `tests/unit/carnetsRangement.test.ts` : le titre attendu suit la mise en forme du lot A.
- Dans ce dossier : `preuve.cjs`, les captures et les planches de captures `montage-*.png`.

## Problème → fait → preuve

| P | Fait | Preuve |
|---|---|---|
| 7 Texte · après | La roue s'arrête à la réponse. Ensuite « ✓ Rangé ici · Annuler » paraît dans Ce qui compte, avec « votre phrase : « … » ». | Test « texte · après dans Ventilation ». Captures `m390-clair-13*`, `d1280-clair-13-texte-apres` ouvertes. |
| 9 Lien sans retour | Nouveau bandeau `lien` : « ✓ Lien rangé ici · page non lue », le lien en clair et « Ouvrir ↗ » (`href`). | Test P9. `m390-clair-21` ouverte. |
| 11 Note en vrac · après | Chaque ligne a son type ▾ (choix natif : à faire, question, à acheter…) et son carnet ▾ (`deplacer`). Une correction s'ajoute à ce qu'Annuler défait. « › Texte d'origine » reste. | Test P11 : changer le carnet déplace la ligne dans les effets. `m390-clair-23` ouverte. |
| 18 Doublon (G11) | `doublonsDe` tourne pendant la frappe et `doublon` passe à CadreArrivee. « Garder à part » retire la proposition. À l'envoi, `garderAPart({ messageId })` est écrit et la note n'est pas fusionnée. Sans ce toucher, la note est fusionnée (`fusionnerNotes`), comme l'annonce le promet. | 2 tests P18. `m390-clair-12`, `12b` ouvertes. |
| 20 G35 | `carnetProche` (lot A) est passé à SupprimerCarnet. | `m390-clair-36b` : « 1 article en veille : les déplacer dans Extracteur pour la salle de fermentation · Déplacer ». |
| 21 Photo | « ✓ Photo rangée ici · Annuler ». Depuis la liste, la photo ouvre son carnet neuf. | `m390-clair-44b` ouverte. |
| 22 et 36 IA éteinte, hors ligne, échec | L'avis est dans le bandeau même, avec un picto local, sans roue : « IA éteinte : rangé sur l'appareil », « Hors ligne : … », « L'IA n'a pas répondu : … ». Il dit aussi ce qui a été rangé et où (`detailDe`), par exemple « Notes : « filtre à air G4, 2 pièces » · dans Frigo de garde pour fûts ». L'échec a un filet orangé. | 3 tests P22 et P36. `m390-clair-41`, `42` ouvertes. |
| 23 Puce proposée (D-35) | `propose` (lot A) suit `depuisIA` et `ranger` le garde sur le message. La puce « ✻ Comparer sur le débit (m³/h) · Ajouter » paraît sous le bandeau du carnet. Le toucher appelle `accepterProposition`. Le ✕ cache la puce pour la session, sans rien supprimer. | Test P23 : le critère est rangé avec sa caractéristique, sans `propose`, et la puce part. Pas encore de capture : étape `23p` de la demande. |
| 24 D-63 | Banc `&zero=1`, sans fixture. | Scénario joué de zéro à 390 clair : vide, frigo, ventilation, évier, liste. `m390-clair-zero-*` ouvertes. |
| 25 et 26 Une seule ligne d'état | Quand le retour du message est affiché, il fait seul l'état : ni roue dessous, ni « ✓ Rangé » en double. | Test « Créer : Carnet créé seul ». `m390-clair-07a` (IA en cours) et `07` : un seul bandeau. |
| 28 Créer · avant | Quand le champ de la liste a le focus, vide, le cadre `avant` paraît (g5:v03-2) : la phrase, la carte fantôme « Évier inox, 2 bacs · exemple · ↓ arrive ici », les puces G1 (un toucher remplit le champ) et G2 « Une note en vrac marche aussi. ». Il ne paraît jamais sous un retour, ni sur la liste vide (l'écran figé du lot B dit déjà cela). | Test P28. `m390-clair-03` ouverte. |
| 29, 30, 31 Champ | Le champ prend la largeur de la colonne, 760 px à 1280 (avant : 270), et reste collé en bas (bas = 0). « Ajouter à <titre>… » vaut aussi dans Comparer, Choisir et l'article. | Mesures `304..1064 (l=760) bas=0`. `d1280-clair-repos-carnet`, `repos-comparer`, `13` ouvertes. |
| 33 Modifier une note | « Se modifie ici » prend la place de la note, avec son texte (slot `feuille`, et `:has()` masque la ligne). | Test P33. `m390-clair-32b` ouverte. |
| 34 Annuler une suppression | Le bandeau part d'abord, puis la note est rendue. Un échec d'écouteur du magasin ne laisse plus l'écran en l'état. C'est la cause probable au banc : le reflet du cache se fait après l'écriture. | 2 tests P34. Le 2e échoue sur `e0073224e` et passe ici (rejoué avec CarnetsVue de HEAD, puis restauré, `cmp` OK). `m390-clair-35c` ouverte. |
| 37 Clavier à 300 px | La bulle G8 et « Coller » tiennent sur une ligne (`.cnf-aides-ligne`). | `m390-clair-39` (`&keyboard=300`) : environ 340 px de carnet visibles. C'est une estimation lue sur la capture. |

Critères :
- (a) 4 fichiers, 58 tests sur 59. Le rouge restant est « libellé d'écarté : pas de « écarté : X écartée : … » » (`carnetsCorrection1Integration`). Il vient de `Comparer.tsx`, modifié en ce moment par un autre lot, qui rend « écarté : Ventilateur de plafond écartée : … » : c'est le défaut même que le test garde. Je l'ai laissé rouge exprès.
  Mes 14 tests et les fichiers `port-q3`, `q4`, `q5` et `carnetsEcrans` sont verts : 143 sur 145 sur 8 fichiers, avant la mise à jour de `carnetsRangement`.
- (b) `npx tsc` : 0 erreur sur tout le projet. `vite build --outDir <scratchpad>` : vert. `check-build-flags` : DRAPEAUX OK.
  `npm run build` n'a pas été lancé, puisqu'il écrit `dist`, partagé entre les lots. `check-private-research` n'a donc pas été rejoué.
- (c) Captures 390 tactile clair et 1280 clair ouvertes, en planches `montage-390-a`, `b`, `c` et `montage-1280-a`. Le thème sombre, 1280 pour les autres états et 43 (hors ligne) passent par la demande ci-dessous.

Essais : 2 sur (a), car le test P23 a été réécrit sur le contrat `propositions` du lot A ; 1 sur (b) ; 2 sur (c) (banc sans `.env`, puis le cadre `avant` sous la note en vrac, corrigé).

## Doutes et limites

- P7 : sur HEAD, mon test vitest passait déjà. La roue que la critique a vue au 13 était peut-être une capture prise pendant l'IA. La règle « une seule ligne d'état » est maintenant tenue et prouvée de toute façon.
- Des contenus restent hors de ma voie : « filtre à air G4 » rangé en note (analyse locale, lot A) ; la bulle G8 « Moins de condensation » (P15, lot A) ; le libellé d'écarté (lot C).
- À 390, « Ajouter à <titre long>… » reste tronqué par la largeur du téléphone. Il est entier à 1280.
- P33 passe par le slot `feuille` de CarnetOuvert, plus `:has()` (Chrome 105 et plus), car CarnetOuvert ne m'appartient pas. Si le lot qui le tient change l'ordre `.cn-note` puis la feuille, la note réapparaîtra au-dessus du cadre.

## DEMANDE EXECUTANT

1. Dans `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, en arrière-plan :
   `VITE_FIREBASE_API_KEY=demo-banc-cle VITE_FIREBASE_AUTH_DOMAIN=demo-banc.firebaseapp.com VITE_FIREBASE_PROJECT_ID=demo-banc VITE_FIREBASE_STORAGE_BUCKET=demo-banc.appspot.com VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000 VITE_FIREBASE_APP_ID=1:000000000000:web:0000 npx vite --port 5497 --strictPort --host 127.0.0.1`
   Attendre que `curl http://127.0.0.1:5497/` rende 200.
2. Dans ce dossier de voie :
   - `node preuve.cjs 390 sombre 5497`, puis `node preuve.cjs 1280 clair 5497`, puis `node preuve.cjs 1280 sombre 5497` (tous les états) ;
   - `node preuve.cjs 390 clair 5497 "43,23p,03,zero"`.
   Sortie attendue :
   - aucune ligne `ECHEC` ;
   - `erreurs : aucune` ;
   - `23p puces :` contient « Comparer sur » ;
   - en 1280, `champ` `(l=760) bas=0` ;
   - en 43, `bandeaux` contient `/hors-ligne`.
3. Arrêter vite : `netstat -ano | grep ":5497 "`, puis `taskkill //PID <pid> //T //F`.
4. Ouvrir chaque capture, en planches de 6 au plus avec `montage.cjs` : `node montage.cjs <sortie.png> 300 <fichiers…>`, ou bien une à une. Pour chacune, noter : un seul bandeau d'état, aucune roue sous un bandeau, le champ en bas sur toute la colonne, le texte lisible dans les deux thèmes.
   Captures attendues : `03 07 07a 12 12b 13 13a 21 23 23p-puce-proposee 23p-puce-rangee 32b 35b 35c 36b 39 41 42 43 44b repos-carnet repos-comparer zero-0 à zero-4`, aux préfixes `m390-sombre-`, `d1280-clair-` et `d1280-sombre-`.
5. Me renvoyer le journal et les numéros des captures douteuses : le verdict me revient.

DÉCISION À PRENDRE : faut-il ajouter un ✕ « ne plus proposer » qui écrive sur le message (opération à créer au lot A) ? Aujourd'hui, le ✕ d'une puce proposée la cache pour la session seulement. Options : (a) garder la session seule ; (b) ajouter `ecarterProposition` au lot A. Je recommande (a) jusqu'à son retour : rien n'est perdu et c'est réversible.

CONNAISSANCE : le banc `?preview=carnets` simule le clavier par `&keyboard=300` (`useViewport.simulatedInset`), pas par `&clavier=`. Dans la vue en colonne flex `.cn`, des marges `auto` réduisent le champ à son contenu : il faut aussi `width: 100%`.

LEÇON PROPOSÉE : un test qui garde un défaut décrit dans une critique (« le bandeau reste après Annuler ») doit d'abord échouer sur HEAD. Le cas simple passait sur HEAD : il a fallu chercher le mécanisme (un écouteur qui lève après l'écriture) pour obtenir un test qui échoue. Règle : rejouer le nouveau test sur le fichier de HEAD, copié puis remis, avant d'écrire le correctif.
