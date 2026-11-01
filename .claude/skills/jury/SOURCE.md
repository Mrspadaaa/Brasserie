# Provenance du skill jury

Écrit le **2026-10-31** pour la voie e4-jury (mission `work/missions/2026-10-31-systeme-ecrans/`), sur ses mots :
« Alors ça non ou à adapter avec un jury. […] on peut aussi faire des tests ! » (31.10, au sujet des skills qui posent des
questions bloquantes).

Aucun fichier n'a été copié ni téléchargé dans le dépôt. Les skills d'origine ont été lus en ligne, le 31.10.2026, branche
`main`. `SKILL.md` est une réécriture en français : les questions sont reformulées, fusionnées, triées et réordonnées,
et le mécanisme d'origine (l'agent interroge une personne et l'attend) est remplacé par un jury de regards qui répond
d'après les sources.

| Dépôt | Licence | Copyright | Fichiers lus |
|---|---|---|---|
| obra/superpowers | MIT | Copyright (c) 2025 Jesse Vincent | https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md ; https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/builder-check-prompt.md ; https://raw.githubusercontent.com/obra/superpowers/main/LICENSE |
| mattpocock/skills | MIT | Copyright (c) 2026 Matt Pocock | https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/grilling/SKILL.md ; `…/productivity/grill-me/SKILL.md` ; `…/engineering/grill-with-docs/SKILL.md` ; `…/engineering/domain-modeling/SKILL.md` ; `…/productivity/to-questionnaire/SKILL.md` ; `…/engineering/to-spec/SKILL.md` ; `…/productivity/wait-what/SKILL.md` ; https://raw.githubusercontent.com/mattpocock/skills/main/LICENSE |
| addyosmani/agent-skills | MIT | Copyright (c) 2025 Addy Osmani | https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/interview-me/SKILL.md ; `…/skills/idea-refine/SKILL.md` ; `…/skills/spec-driven-development/SKILL.md` ; https://raw.githubusercontent.com/addyosmani/agent-skills/main/LICENSE |

## Ce qui vient d'où

| Élément de `SKILL.md` | Origine |
|---|---|
| Hypothèse en une phrase, avec une confiance en %, et pourquoi sous 70 % | addyosmani `interview-me` |
| Lire d'abord ; ne pas demander ce que le matériel répond déjà | superpowers `brainstorming` ; mattpocock `grilling` (un fait se cherche, il ne se demande pas) |
| Découper une demande qui contient plusieurs projets | superpowers `brainstorming` ; addyosmani `spec-driven-development` (carte des capacités) |
| L'arbre de décisions, la frontière, une réponse recommandée par question | mattpocock `grilling` |
| Une seule idée par question ; ordre par importance ; « Autre chose ? » (J18) | mattpocock `to-questionnaire` |
| Qui (J1), pourquoi maintenant (J3), la réussite (J4), la contrainte qui lie et la valeur qui gagne (J7), hors périmètre (J12), le vouloir réel (J15) | addyosmani `interview-me` ; `idea-refine` (pour qui, réussite, contraintes, déjà essayé, pourquoi maintenant) |
| Ce qu'il vient faire en arrivant sur l'écran (J2) ; deux ou trois approches (J13) | superpowers `brainstorming` |
| Un mot flou devient un critère mesurable (J4) ; les hypothèses numérotées (J14) | addyosmani `spec-driven-development` ; superpowers (rendre explicites les choix par défaut) |
| Les mots et le glossaire (J8), le code contre le récit (J9), les scénarios limites (J11), la trace durable à trois critères (J16) | mattpocock `domain-modeling` |
| Le contrôle du bâtisseur : seulement là où deviner est risqué et change le plan, par importance, « rien d'important » (J17) | superpowers `brainstorming/builder-check-prompt.md` |
| Arrêt quand on prédit les trois réponses suivantes ; une réponse vague ne compte pas | addyosmani `interview-me` (règle des 95 %) |

## Ce qui est à nous, et ce qui est écarté

- À nous : le jury de regards et leurs modèles (`.claude/skills/conseil/references/regards.md`), le Brasseur calibré sur
  `PORTRAIT.md`, les classes `SOURCE`, `PILOTE`, `GOÛT`, `ACCORD`, `MESURE` et `CONSEIL`, le dossier plafonné, les trois
  niveaux de coût, la fiche et le retour en une ligne (L01, L05, L10, L18, L24, L27).
- Écarté, contraire à nos règles (rapport `work/missions/2026-10-31-methodes/RAPPORT.md` § 6) : la porte dure de
  `brainstorming` (rien ne se construit avant une approbation humaine), une question par message, l'attente d'un « oui »
  explicite (`interview-me`), le blocage signalé en mode autonome, et la confirmation finale de `grilling`.

## Texte de la licence MIT (le même pour les trois dépôts)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
