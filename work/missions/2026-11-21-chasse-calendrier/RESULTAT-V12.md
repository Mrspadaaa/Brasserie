OK partiel — CHN-3, CHN-9, CHN-13 (coches) corrigés et commités (ed6c13f3b) ; reste « · j » de la pastille dans EnTete.tsx (V9) ; 3 tests calendrier-onglet adaptés

## Commit ed6c13f3b (port-carnet, index temporaire, mes hunks seulement)
- `src/ui/calendrier/entete/MenuPeriode.tsx` : CHN-13. Quand la durée est exactement le cran de l'échelle (2, 6 ou 26 sem.), la ligne Échelle la coche et la ligne des durées se tait. Au plus une coche dans tout le menu.
- `src/components/tabs/CalendrierTab.tsx` : CHN-9 (`mouvements` passe par `useEtatGarde('calendrier_mouvements')`) ; CHN-3 (`changerEchelle('jour')` sans jour visé, donc par le menu, se pose sur `lundiAuj` ; avec un jour visé, le pincer, la semaine de ce jour). Trois hunks.
- `scripts/parcours/chaines-calendrier-v12.mjs` (nouveau) + 2 lignes dans `chaines.mjs` : étapes CH-N3, CH-N3-PASTILLE, CH-N13, CH-N9.
- `tests/integration/calendrierMenuV12.test.tsx` (nouveau, 3 tests) ; `calendrier-onglet.test.tsx` et `calendrierPaquetE.test.tsx` adaptés.
- `Fenetre.tsx` non touché (pas nécessaire). `BUGS.md` : CHN-3 et CHN-9 « corrigé ed6c13f3b » ; CHN-13 « en cours » (reste « · j »). `controle-bugs` : `BUGS OK : 1617 bugs, 156 ouverts, 175 sources`.

## Les 3 tests de calendrier-onglet (cause : fiche en volets, D412)
- Ce n'est pas un défaut : le geste est le même, le chemin change.
- « Ranger sans date » ×2 : le bouton est maintenant dans le volet « Plus d’actions » de la fiche. Les tests ouvrent d'abord ce volet (`name: 'Plus d’actions'`).
- « Budget › » : la fiche a un bouton « Budget » (sans chevron, action secondaire) ; le test attend `name: 'Budget'`.
- Résultat : 24/24 verts.
- Effet de bord de CHN-3 : le test « vue Jour : Dédé glissé… » (calendrierPaquetE) ouvrait la vue Jour par le menu en comptant sur l'ancienne règle (début de la fenêtre d'avant). Il passe maintenant par écarter les doigts, qui garde le jour visé : 10/10 verts.

## Contrôles (chaines.mjs, 390 tactile, fixture calendrier « ZZ TEST », ref en-ligne/2026-11-21-tour8)
| Étape | tour8 | arbre |
|---|---|---|
| CH-N3 | KO : « 2 sem. » depuis Nov. pose 26.10 → 8.11, depuis An « Jour » la même, aujourd'hui (21.11) hors champ | ok : 16.11 → 29.11 dans les deux cas |
| CH-N13 | KO : Semaine + 6 sem., Jour + 2 sem., Mois + 6 mois cochés ensemble | ok : une seule ligne cochée, 9 états |
| CH-N9 | KO : ± retombe à `aria-pressed=false` après rechargement | ok : reste allumé ; un toucher l'éteint |
| CH-N3-PASTILLE | KO : « 2 sem. · j » | **KO encore** (voir plus bas) |

Captures ouvertes : `CH-N3-1-nov-2sem` (fenêtre S47 – S48, jour 21 dedans, pastille « 2 sem. · j ») et `CH-N9-2-recharge` (± allumé après rechargement). Dossier : `%TEMP%\claude\…\scratchpad\arbre` (captures de l'arbre) et `…\t8` (tour8).

Tests : `calendrierMenuV12` 3/3, `calendrier-onglet` 24/24, `calendrierPaquetE` 10/10, `calendrierEchelle` vert. Suite `tests/integration/calendrier*` + `tests/unit/calendrier*` : 779 verts, 4 rouges avant ma correction du Paquet E ; restent 3 rouges hors voie, tous dans `calendrierEntete.test.tsx` (fichier modifié par une autre voie) : « CHF à dépenser (S18 ’27) » introuvable, « Déc. · 5 sem. » au lieu de « Déc. », « Nov. · 4 sem. » au lieu de « Nov. ». Je n'y ai pas touché.

## Doutes et limites
- **« · j » (CHN-13, 2e moitié)** : la pastille est écrite dans `EnTete.tsx:708-709` (`props.echelle === 'jour' && !annee ? `${libelle} · j``). Fichier de V9, interdit pour moi. Correctif de 2 lignes : afficher `libelle` seul aux deux endroits. L'étape CH-N3-PASTILLE doit alors passer au vert. Test existant à adapter : `calendrierEchelle.test.tsx:55` (« 2 sem. · j »).
- Règle de coche choisie : l'Échelle gagne au cran exact (le test existant attendait `Semaine:true` au repos). À 6 sem., la ligne « 6 sem. » n'est donc plus cochée : c'est « Semaine » qui l'est. Sinon : l'inverse (la durée gagne, l'Échelle se tait). Je ne l'ai pas montré au brasseur ; l'Échelle (D385, variante D) est son choix, je n'y ai rien retiré.
- ± persiste aussi quand un saut vers une idée du carnet l'allume (`setMouvements(true)`, l. 728) : acceptable, à surveiller.
- « Jour » par le menu part toujours de la semaine d'aujourd'hui, même d'une fenêtre lointaine (règle unique, voulue par CHASSE-navigation n° 3). Une fenêtre sans jour visé ne se conserve plus.
- Non joué : 1280 souris (la plainte ne le demande pas), deux thèmes (pas de changement visuel), exécution en ligne.
- HEAD a avancé pendant la voie (8bc41e9d1, CHG-4/5) : mes hunks sont posés sur ce HEAD.

DÉCISION À PRENDRE : « · j » de la pastille. Option A : V9 (ou le pilote après V9) applique les 2 lignes dans `EnTete.tsx`. Option B : j'applique moi-même après le commit de V9. Recommandation : A, puis passer CHN-13 à « corrigé ». Question connexe, à trancher par le pilote : garder « l'Échelle gagne au cran exact » ou l'inverse.

CONNAISSANCE : `changerEchelle` n'a que deux appelants : le menu (sans jour visé) et le pincer (avec jour visé) ; la règle « jour visé sinon aujourd'hui » s'y lit en une ligne. Le banc `?preview=calendrier` n'a pas de flèche « Période suivante » (elle vit dans la barre de l'app) et seule la poignée de DÉBUT répond au clavier.
LEÇON PROPOSÉE : aucune
