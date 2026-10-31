---
name: jury
description: Cadrer une voie ou un écran de L'Affinée avant de le planifier, par un interrogatoire (grill, interview) dont un jury de regards (Brasseur en Fable, Contradicteur, Premiers principes, au besoin Bâtisseur) donne les réponses d'après les sources (SPEC-BRASSEUR, ecrans.json, cerveau, PRODUCT.md, DESIGN.md, le code). Rend une fiche de cadrage. Réponses sourcées, goûts en axes de variantes, irréversible aux accords groupés. Ne bloque jamais. Méthode reprise de superpowers, mattpocock et addyosmani (MIT). À utiliser avant le premier VOIE.md d'un lot montré au brasseur, avant de refaire un écran, devant une mission floue, ou sur les mots « jury », « cadrage », « grill », « interview ». Pas pour une décision lourde unique (skill conseil) ni pour un fait qu'un test tranche.
license: Méthode adaptée de trois dépôts sous licence MIT ; provenance, copyrights et texte de la licence dans SOURCE.md.
---

# Le jury — l'interrogatoire, sans personne à interroger

Les méthodes d'interview (superpowers `brainstorming`, mattpocock `grilling`, addyosmani `interview-me`) arrêtent le
travail sur des questions ouvertes. Ici, le jury y répond à partir des sources. Il rend une fiche, et le travail continue.
Le brasseur, lui, choisit sur des variantes montrées (L24) ; l'utilisateur accorde les gestes irréversibles, en groupe.

## 0. Jury, conseil ou rien ?
- **Jury** : un écran ou une voie à cadrer, avec beaucoup de petites inconnues (but, premier plan, acquis, refus, mots).
- **Conseil** (skill `conseil`) : une seule décision lourde, coûteuse si elle est fausse. Si le jury en trouve une, il la
  classe `CONSEIL` et le pilote réunit le conseil après la fiche.
- **Rien** : la tâche est claire, mécanique, ou déjà cadrée par une fiche récente (`systeme.mjs chercher <sujet>`).

## 1. Préparer (pilote, 10 minutes au plus)
1. **Hypothèse** en une phrase, avec une confiance en % ; sous 70 %, dire pourquoi sur la même ligne.
2. **Lire d'abord** : ce que les sources répondent déjà n'est pas mis au jury. Un fait du code se lit ou se mesure ;
   aucun regard n'est payé pour ça.
3. **Taille** : un cadrage par écran ou par outil. Une mission qui en contient plusieurs se découpe.
4. **Le dossier** : `work/missions/<mission>/jury-<sujet>/dossier.md`. Il contient :
   - l'hypothèse ;
   - les questions retenues (§ 2), chacune avec la réponse que le pilote recommande ;
   - les extraits utiles, mot pour mot, avec leur chemin, 3 000 mots au plus ;
   - 4 captures au plus.
   C'est le levier de coût, comme au conseil : les regards lisent le dossier et n'ouvrent une source que pour vérifier.

## 2. Les questions, dans l'ordre de l'arbre
Une question n'entre au tour que si celles dont elle dépend sont réglées (la « frontière » de `grilling`). Une question
porte une seule idée. Chacune vient avec la réponse recommandée par le pilote : le jury la confirme ou la corrige.
Origine : SP superpowers, MP mattpocock, AO addyosmani, LA nos leçons.

**Tour 1 — le but**
- J1. Qui, dans quelle scène : cuverie ou bureau, une main ou deux, attention suivie ou hachée ? (AO)
- J2. Que vient-il décider ou faire ici, en un geste ? Une question, un outil (L10). (SP, LA)
- J3. Pourquoi maintenant : qu'est-ce qui ne va pas aujourd'hui, sur sa capture et dans ses mots ? (AO)
- J4. À quoi verra-t-on la réussite ? Un critère mesurable : mots au premier écran, touchers, temps. Un mot flou
  (« plus clair ») se traduit en chiffre. (AO)

**Tour 2 — ce qui tient**
- J5. Qu'est-ce qui est déjà choisi ou acquis, et doit survivre tel quel ? `ecrans.json`, `acquis-valides`, continuité
  de l'en-tête et du pied (règle n° 1). (SP, LA)
- J6. Qu'est-ce qui a déjà été essayé et refusé ? `DEFAUTS-COURT.md`, SPEC § 6. (AO)
- J7. Quelle contrainte lie (hors ligne, téléphone, chiffre jamais inventé, moteur inchangé) ? Et quand deux valeurs se
  heurtent (densité et lisibilité, vitesse et contrôle), laquelle gagne ? (AO)
- J8. Les mots : chaque libellé est-il le terme du brasseur, sans flou ni doublon ? Glossaire s'il existe. (MP)
- J9. Le code dit-il ce que racontent les sources ? Toute contradiction entre l'écran, le code et ses mots. (MP)

**Tour 3 — la forme**
- J10. Le premier plan : ce qui sert le geste au repos, ce qui se replie à un toucher, ce qui part dans une autre étape.
- J11. Les scénarios limites : vide, erreur, hors ligne, recette collée, valeur inconnue, cas rare mais réel. (MP)
- J12. Hors périmètre : ce que ce cadrage ne touche pas. (AO)
- J13. Les approches réalistes (deux ou trois) : lesquelles une source tranche, lesquelles sont des goûts ? (SP)
- J14. Ce qu'on suppose sans le dire : chaque choix par défaut, numéroté. Rien d'implicite. (AO, SP, MP)
- J15. Le vouloir réel : quand une réponse ne tient qu'à l'habitude (« un formulaire a toujours… »), que voudrait-il
  s'il n'avait rien à justifier ? (AO)

**Tour 4 — la clôture**
- J16. Irréversible ou externe : données réelles, schéma Firestore, moteur, déploiement ? Une trace durable (ligne D-n)
  seulement si c'est dur à inverser, surprenant sans contexte et issu d'un vrai arbitrage. (MP)
- J17. Le contrôle du bâtisseur : en lisant la fiche seule, où devrait-il deviner, et où un mauvais pari changerait le
  plan ? Classer par importance ; s'il n'y a rien, « rien d'important ». (SP)
- J18. Autre chose : ce qu'aucune question n'a couvert. (MP)

Le pilote retire les questions sans objet et le dit dans le dossier. Il n'en ajoute que si une source l'impose.

## 3. Le jury
Un seul message, les regards en parallèle, `subagent_type: "conseiller"` (repli : `general-purpose` avec « Suis
.claude/agents/conseiller.md »). Les regards sont ceux de `.claude/skills/conseil/references/regards.md`.

| Niveau | Appels | Regards | Pour |
|---|---|---|---|
| **Rapide** | 2 | Brasseur (fable), Contradicteur (opus) | une voie, un écran simple ou une reprise |
| **Normal** | 3 | + Premiers principes (opus) | un écran à refaire, un lot montré au brasseur (défaut) |
| **Complet** | 4 | + Bâtisseur (opus), en second tour, sur la fiche brouillon (J17) | un lot qui fixe une direction suivie par d'autres |

- Le Brasseur lit d'abord `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`. Il cite au moins une
  parole et prédit la phrase que le brasseur dirait devant l'écran actuel.
- Chaque regard répond à toutes les questions depuis son regard, 40 mots au plus par réponse ; « hors de mon regard »
  est permis. Chaque réponse porte une **classe** :
  - `SOURCE` : une source la tranche (chemin et mots exacts) ;
  - `PILOTE` : réversible, sans source décisive ; lecture étroite et réversible (L01) ;
  - `GOÛT` : un choix du brasseur ; nommer les options, qui deviennent un axe de variantes (L24) ;
  - `ACCORD` : irréversible ou externe ; va aux accords groupés de l'utilisateur ;
  - `MESURE` : un fait que le code ou un test tranche ; il part dans une voie, pas dans un avis ;
  - `CONSEIL` : une décision lourde ; elle part au skill `conseil`.
- Un tour par regard (deux au niveau complet). Plafond de tours : celui de `conseiller` (15). Retour : le texte de
  l'avis, puis `LEÇON PROPOSÉE : …`.

**Monter d'un niveau** (rapide vers normal) quand J2 n'est pas tranché, ou quand plus de trois réponses restent `PILOTE`
avec un désaccord entre regards. Jamais deux jurys sur le même sujet sans fait nouveau.

## 4. Fusionner (pilote)
- Deux regards d'accord et sourcés : la réponse entre dans la fiche.
- Désaccord : pour ce qui existe, le code fait foi ; pour ce qu'il veut, ses mots datés les plus récents, puis
  `ecrans.json`, PRODUCT.md et DESIGN.md, puis le cerveau. Sans source décisive, un goût devient un axe à deux options ;
  le reste devient une hypothèse du pilote, avec le désaccord noté.
- **Arrêt** : la frontière est vide, ou le pilote prédit la réponse du jury aux trois questions suivantes (la règle des
  95 % d'`interview-me`). Une réponse vague (« selon le cas », « à voir ») ne compte pas : elle repasse en `PILOTE`.
- Rien n'attend. Ce qui reste ouvert reçoit une classe et une suite.

## 5. La fiche de cadrage
`work/missions/<mission>/jury-<sujet>/fiche.md`, ou la place qu'indique la mission. Sections, dans l'ordre :
1. `## Hypothèse` : la phrase et sa confiance, avant et après le jury.
2. `## Tranché` : tableau n°, question, réponse, source (chemin, mots exacts).
3. `## Hypothèses du pilote` : réversibles, à recopier dans chaque VOIE.md (L05).
4. `## Axes de variantes` : axe, options à montrer, ses mots ; ce sont les axes des séries v0 (entonnoir).
5. `## Accords groupés` : ce qui va à l'utilisateur, sans bloquer le reste.
6. `## À mesurer` et `## Au conseil` : la voie ou le conseil qui s'en charge.
7. `## Désaccords du jury`, puis `## Coût` : appels, modèles, jetons lus dans les retours d'`Agent`.

Retour du skill en une ligne :
`JURY OK — <niveau>, <n> tranchées, <n> axes, <n> accords, <n> hypothèses — <chemin de la fiche>`.

## 6. Ensuite
- Les axes de variantes nourrissent le lot de mini maquettes (`voies`, étape 5 bis) ; les hypothèses du pilote vont dans
  chaque VOIE.md ; les accords vont au groupe « en attente » du registre.
- Une parole du brasseur citée par la fiche reste dans SPEC ; la fiche la pointe, sans la recopier ailleurs.
- `LEÇON PROPOSÉE` d'un regard : traitée par le pilote à la signature.
