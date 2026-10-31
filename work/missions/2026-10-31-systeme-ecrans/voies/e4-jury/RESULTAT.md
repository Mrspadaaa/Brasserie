OK — skill `jury` écrit (18 questions des trois méthodes, 3 niveaux, fiche, aucune question au brasseur : grep OK, témoin 3/3) ; essai rapide sur « Identité 1/7 » : 13 tranchées, 6 axes, 2 accords, 6 hypothèses, 120 611 jetons ; fiche `work/missions/2026-10-31-ecran-identite/cadrage-jury.md`.

## Livrables
- `.claude/skills/jury/SKILL.md` (122 lignes) : le skill. Il est reconnu par la session dès son écriture : il apparaît
  dans la liste des skills, avec sa description.
- `.claude/skills/jury/SOURCE.md` : provenance, URL lues, copyrights (Jesse Vincent 2025, Matt Pocock 2026, Addy Osmani
  2025), texte MIT, ce qui vient d'où, ce qui est écarté.
- Essai : `essai/dossier.md` (1 539 mots), `essai/avis-jury.md` (avis bruts, jetons), `essai/fiche-cadrage.md`. Cette
  dernière est identique, octet pour octet, à `work/missions/2026-10-31-ecran-identite/cadrage-jury.md`, comme le
  demandait le pilote le 31.10. La fiche de l'écran est la référence du lot ; la copie de la voie est la trace de l'essai.

## Critères rejoués
- En-tête `name: jury` et `description` : déclenchement sur « cadrage », « jury », « grill », « interview », « avant le
  premier VOIE.md », « refaire un écran ». Les exclusions sont écrites (décision lourde : `conseil` ; fait : un test).
- Grep sans consigne de question au brasseur ou à l'utilisateur. Motif :
  `AskUserQuestion|(demand|pose[rz]?|posée|interroge|attend)[^.]{0,60}(utilisateur|brasseur|gaëtan)|(utilisateur|brasseur|gaëtan)[^.]{0,60}(demand|interroge|AskUserQuestion)|questions? (à|a|au) (l'utilisateur|brasseur)`.
  Sur SKILL.md : « GREP OK (aucune consigne) ». Témoin négatif (scratchpad, trois consignes interdites) : 3 lignes
  trouvées.
- La fiche existe et cite une source par ligne (chemin, ligne, mots).
- Le cerveau n'est pas touché. Rejoués quand même : `CERVEAU OK (41 notes, 20 leçons)`, `CHARGE OK`.
- `git status` : seuls `.claude/skills/jury/`, `voies/e4-jury/` et `ecran-identite/cadrage-jury.md` sont neufs.
  `inventaire-identite.md` appartient à e2.

## Les trois méthodes : les questions qui comptent, dans leur ordre
- **superpowers `brainstorming`** :
  1. évaluer (clair et petit : faire) ;
  2. lire d'abord ;
  3. un premier message qui reformule la demande et pose la question la plus lourde de conséquences (« que doit-on
     faire en arrivant ? ») ;
  4. puis une seule question par message ;
  5. deux ou trois approches, avec une recommandation ;
  6. la taille du travail ;
  7. le document de design ;
  8. le contrôle du bâtisseur par un sous-agent neuf : seulement les devinettes risquées qui changent le plan, par
     importance, ou « nothing important left » ;
  9. l'approbation, qui est une porte dure.
- **mattpocock `grilling`** : un arbre de décisions, parcouru en tours par la frontière. Les questions sont numérotées,
  chacune avec sa réponse recommandée. Un fait part chez un sous-agent, une décision va à l'utilisateur. Fin quand la
  frontière est vide. Les skills voisins :
  - `domain-modeling` : les termes confrontés au glossaire, le langage flou précisé, des scénarios limites, le code
    confronté au récit, un ADR seulement à trois critères ;
  - `to-questionnaire` : une idée par question, l'ordre par importance, « Anything else? » ;
  - `grill-me` et `grill-with-docs` : de simples enveloppes ;
  - `to-spec` et `wait-what` : aucune question.
- **addyosmani `interview-me`** :
  1. une hypothèse, avec sa confiance ;
  2. une question à la fois, avec la supposition de l'agent ;
  3. qui, pourquoi maintenant, la réussite, la contrainte qui lie, la valeur qui gagne ;
  4. la sonde « vouloir réel » ;
  5. une reformulation, puis un « oui » explicite ;
  6. la règle des 95 % : prédire les trois réponses suivantes ;
  7. en mode autonome, il signale un blocage.
  Les skills voisins :
  - `idea-refine` : pour qui, la réussite, les contraintes, le déjà essayé, pourquoi maintenant ;
  - `spec-driven-development` : les hypothèses numérotées, le flou rendu mesurable, une porte d'approbation.
- Dans le skill, ces apports deviennent J1 à J18, en quatre tours : le but, ce qui tient, la forme, la clôture.
  Les doublons sont fusionnés : « lire d'abord », les hypothèses explicites, « pour qui ».
- Écarté (SOURCE.md) : les portes dures, une question par message, l'attente d'un « oui », le blocage en autonome.

## L'essai réel (niveau rapide : Brasseur en fable, Contradicteur en opus)
- **Ce qu'il a tranché** :
  - la scène : téléphone, une main (PRODUCT.md) ;
  - le geste : coller une recette ou partir d'un style, puis le volume, l'ébullition et NOLO ;
  - la réussite mesurable : 80 mots au plus, aucune phrase au repos, chaque chiffre écrit une fois, recette neuve et
    clavier ouvert compris ;
  - les acquis : l'en-tête actuel et le fil d'étapes, l'icône d'import, l'alerte du fermenteur, l'activation de NOLO
    (seul point d'entrée, `allowEnable` l. 2390) ;
  - les refus, les mots non attestés (« Objectif NOLO »), cinq contradictions du code, onze cas limites et le hors
    périmètre (les éléments communs aux 7 étapes).
- **Ce qui reste ouvert** :
  - 6 axes de variantes : la forme, le fermenteur, les repères du style, volume et ébullition, NOLO, l'import du corps ;
  - 2 accords : le déploiement, et les recettes réelles ;
  - 3 mesures : l'évaporation de repli, le bandeau à trois ou quatre chiffres, la baseline chiffrée ;
  - 2 points transversaux (« Text header inutile », le bandeau), pour un lot à part, avec un avis croisé.
- **Le coût** : Brasseur 64 677 jetons (13 outils, 119 s) et Contradicteur 55 934 (20 outils, 139 s), soit 120 611 jetons
  en environ 2 min 20 s. Le temps du pilote n'est pas mesuré : `get_usage` n'a pas été relevé. Le niveau normal n'a pas été
  déclenché : J2 est tranché, et il ne reste qu'un désaccord en `PILOTE`, sous le seuil de trois.
- **Comparé au cadrage sans jury** (les réponses que le pilote recommandait seul dans le dossier) : 5 de ses 14
  recommandations auraient été fausses.
  - Il croyait l'assistant utilisé « au bureau » ; PRODUCT.md le range en cuverie.
  - Il prenait comme référence l'en-tête de `consolide-390.png`, refusé (D116). C'est le défaut fatal : il aurait cassé la
    continuité des 7 étapes (D129).
  - Il prenait « Objectif NOLO » pour le mot du brasseur.
  - Il déplaçait l'espace libre à Levure : hors périmètre, et Levure est un écran « ouvert ».
  - Il croyait le « + » posé sur une valeur ; il recouvre le coin de la carte.
  - Le jury a ajouté :
    - sa parole du 31.10 sur les « UX UI booster », ajoutée à SPEC pendant la voie ;
    - le seul point d'activation de NOLO ;
    - l'évaporation inventée à 10 % ;
    - « remplissage conseillé » distinct du volume ;
    - 19 suppositions relevées (13 et 6, avec des recoupements) ;
    - le rappel de l'entonnoir (48 v0, pas trois approches).
  - Les méthodes d'origine auraient posé au brasseur une quinzaine de questions bloquantes ; ici, aucune.
- **Limites** :
  - Le Brasseur est calibré sur les écrans houblons (L27). Sa phrase prédite contient une erreur visible sur la capture
    (« Le + cache le 24 L »). Ses options de goût sont indicatives.
  - Le jury rapide n'a ni les Premiers principes (par exemple : le matériel a-t-il sa place à l'Identité ?) ni le
    contrôle du bâtisseur (J17).
  - Le constat « Adapter… sans confirmation » vient de l'inventaire e2, pas du jury.

## Propositions, non écrites (hors de « Possède »)
- **`docs/agents/systeme.md`**, liste des briques (l. 4 à 8), une ligne :
  « - un **jury** (skill `jury`) qui cadre une voie ou un écran avant de le planifier : les questions des méthodes
  d'interview, auxquelles des regards répondent d'après les sources ; il rend une fiche et ne bloque jamais ; »
- **`.claude/skills/voies/SKILL.md`** § 1, après le point 4 :
  « 4 bis. **Cadrer avant d'écrire** : un lot montré au brasseur ou un écran à refaire passe d'abord par le jury (skill
  `jury`, niveau normal par défaut), avant le premier VOIE.md. Ses axes deviennent les axes des séries v0 (5 bis) ; ses
  hypothèses vont dans chaque VOIE.md (L05) ; ses accords vont au groupe en attente. »

## CONNAISSANCE
- Un jury rapide (2 regards) coûte environ 120 k jetons pour un écran. Il a corrigé 5 des 14 recommandations du pilote.
- Dans l'assistant, NOLO ne s'active que depuis l'étape Identité : `allowEnable` n'apparaît qu'à
  `src/pages/BrewWizard.tsx` l. 2390.

## LEÇON PROPOSÉE
Juste avant de lancer un jury ou un conseil, relancer un grep de SPEC-BRASSEUR sur le nom de l'écran et sur la date du
jour : SPEC bouge en cours de session (l. 823, ajoutée après ma lecture). Ne citer une capture comme référence d'un élément
commun (en-tête, bandeau, pied) qu'après avoir vérifié que cet élément n'a pas été refusé à part : un écran choisi n'est
pas choisi en entier (D116). Cette leçon fusionne les propositions des deux regards (voir `essai/avis-jury.md`).
