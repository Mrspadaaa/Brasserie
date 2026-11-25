# Jouable v7 : cas, gestes, citations (25.11, nuit)

Contrat : `visuel/PORT-V7.md`. Jouable : `jouable/m4b-v7.html`, assemblé depuis `m4b.html` (intact) par `cap-v7/banc/build.mjs`
(vue Organisé : `cap-v7/banc/org.js` et `org.css`). Banc : `node cap-v7/banc/cap.mjs tout`, résultat brut dans `cap-v7/banc/resultat.json`.

## Méthode de mesure
- 390 × 844, DPR 2, thème sombre, Chrome de débug 9222, onglet propre, `window.claude` simulé (réponses de `reponses-v7/`).
- Mots au repos : nœuds texte visibles dans la fenêtre (vue carnet), titre du carnet exclu, toast exclu, placeholder « Ajouter… » compté.
  Les onglets « Mes notes / Organisé » font 3 mots : la colonne « onglets compris » les inclut, l'autre non.
- 1re info utile : haut du premier `[data-utile]` (le héros), en px depuis le haut, et sous la barre du haut.
- Troncature (`text-overflow: ellipsis` débordant) et débordement horizontal : 0 sur les 19 cas.

## Organisé au repos, par cas (captures `cap-v7/org-<cas>.png`)
| cas | mots, onglets compris | hors onglets | 1re info (px) | sous la barre (px) | héros |
|---|---|---|---|---|---|
| assurance | 23 | 20 | 90 | 38 | Demander une offre |
| bar | 26 | 23 | 90 | 38 | Rappeler le gérant |
| bouteilles | 29 | 26 | 90 | 38 | Fournisseur B 👑 · ✓ Prendre |
| cave | 24 | 21 | 90 | 38 | Ranger la cave |
| chaudière | 26 | 23 | 90 | 38 | Appeler le technicien |
| citra | 18 | 15 | 90 | 38 | 🔗 Ouvrir les liens |
| CO2 | 29 | 26 | 90 | 38 | Revérifier le raccord |
| écoulement | 30 | 27 | 90 | 38 | Contacter entreprise X |
| fête | 28 | 25 | 90 | 38 | Réserver le stand |
| levure | 21 | 18 | 90 | 38 | Faire un starter |
| pilsner | 22 | 19 | 90 | 38 | ✓ Réglé : Commandé 2 sacs, brassin maintenu |
| sureau | 18 | 15 | 90 | 38 | Goûter la voisine |
| frigo | 30 | 27 | 90 | 38 | Comparer les devis |
| inspection | 22 | 19 | 90 | 38 | Acheter un testeur |
| levure lente | 28 | 25 | 90 | 38 | ✓ Réglé : Monté à 19 °C |
| odeur | 18 | 15 | 90 | 38 | Sentir à nouveau |
| pompe | 20 | 17 | 90 | 38 | ✓ Réglé : Débit réglé à la sortie |
| vapeur | 24 | 21 | 90 | 38 | Acheter le condenser |
| embouteillage | 18 | 15 | 90 | 38 | Faire la station |

Tous ≤ 30 mots onglets compris. Bouteilles : 33 → 29 onglets compris (le héros dit l'offre 👑 et le bouton « ✓ Prendre » ;
✦ conseillé se tait quand 👑, calcul de l'app, décide ; légende des hachures « ? »). CO2 : 26 hors onglets (4 de marge).
Cas « 4 offres » (malt4, écrit au doigt par le banc) : 35 mots onglets compris, barres horizontales, 👑 Brouwland 120 CHF.

## Gestes (captures `cap-v7/gNN-*.png`, toutes ouvertes)
| geste | capture | mots |
|---|---|---|
| ✓ fait (CO2) | g01-co2-fait | 27 |
| plus tard (bar) | g02-bar-tard | 23 |
| Prendre 👑 → « Commander chez Fournisseur B · J-20 », colonne encadrée | g03-bouteilles-prendre | 34 |
| ✓ commandé → 📦 commandé | g04-bouteilles-commande | 31 |
| Pas encore puis ↺ Rouvrir le choix | g05-bouteilles-rouvrir | 29 |
| toucher une colonne → sa ligne et « ✓ Prendre » | g06-bouteilles-colonne | 41 |
| pilsner réglé → ↺ Rouvrir → héros « ↺ Rouvert » + ✓ Réglé | g07-pilsner-repos-puis-rouvrir | 30 |
| ▸ Détail d'un réglé | g08-levure-lente-detail | 34 |
| toucher une piste → sa ligne sous l'élément | g09-ecoulement-toucher | 45 |
| 📝 Mes notes ↩ → la ligne surlignée | g10-ecoulement-sa-ligne | 62 |
| refuser une option de l'IA (✕) | g11-ecoulement-refus | 24 |
| 💡 Aide → une proposition, héros visible | g12-ecoulement-aide | 39 |
| Aide : plus tard → la suivante | g13-ecoulement-aide-suite | 36 |
| Aide : ＋ Garder → ☑️ tâche ✦ IA pleine largeur | g14-ecoulement-aide-garde | 39 |
| Aide : ✕ non | g15-ecoulement-aide-non | 39 |
| cocher une ligne de liste (1/3) | g16-cave-coche | 25 |
| ⓘ détails, Ranger, Changements, Question | g17-cave-meta | 36 |
| écrire depuis Organisé (+ piste) → ajouté à Mes notes, l'IA relit | g18-co2-ecrire | 30 |
| Mes notes : la vraie note, la ligne ajoutée | g19-co2-mes-notes | 63 |
| 4 offres écrites au doigt | g20-malt4-mes-notes | — |
| Organisé à 4 offres : barres horizontales | g21-malt4-organise | 35 |
| Prendre à 4 offres | g22-malt4-prendre | 40 |

19 gestes du banc sur 19 passent ; 0 erreur de console ou de page.

## IA absente (captures `cap-v7/sansia-*.png`, toutes ouvertes)
assurance 51 mots, cave 56, bouteilles 54, CO2 60, chaudière 50, citra 24 ; toucher une ligne (cave) 72.
Lignes en entier (jamais « … »), date dans ses mots avec J-n calculé, ⚠ quand le jour contredit la date (« samedi 6 déc. » = dimanche),
une ligne qui n'est qu'un lien montre son domaine en gras sans le répéter en pastille. Plus de mots qu'au repos : ce sont ses lignes.

## Citations
`valider` vérifie chaque extrait dans sa ligne (ou dans le titre quand la ligne vaut 0) : 0 citation fausse et 0 erreur sur les 19
réponses, 0 sur malt4. Consigne v7 présente dans le prompt : `"faits"`, `"besoin"`, `"offre"`, règle 18 `"tache"`, règle 21 coût total.

## Correctifs de cette reprise
1. Toast sur une ligne (`width:max-content`). 2. Héros long en 22 px (`.v7-act.m`). 3. Pilsner rouvert : héros « ↺ Rouvert » + ✓ Réglé.
4. Vapeur : « 2 inch tri-clover » en mots sous le nom, plus en case mono. 5. Frigo « visé 2 °C ». 6. Banc : toast retiré à chaque ouverture.
En plus, vus sur les captures : piste écrite avec son « ? » sans double « ? » (g18) ; tâche gardée de l'Aide en pleine largeur, icône de
rangée ☑️ (g14) ; ✦ conseillé tu quand 👑 décide (malt4 : il débordait) ; IA absente sans pastille 🔗 qui répète le domaine.

## Visuel v7 retouché (`visuel/v7.html`, captures `cap-v7/visuel/`, banc `cap-v7/banc/cap-visuel.mjs`)
Surcharges dans la page, `reponses/*.js` intacts : un seul vert (👑), « total », héros « Fournisseur B 👑 · ✓ Prendre » puis
« Commander chez … · J-20 » (étapes ⚖️ › ✋ › 📦, colonne encadrée, autres éteintes) puis 📦 commandé ; faits en rangée ✅, hors du n/m,
sans « trouvé » ; 🛒 une fois ; « 20 L / fût » ; 🔗 « Ouvrir les liens » (citra) ; CO2 27 mots (« 15.11 », « 22.11 ») ;
IA absente en lignes entières, date dans ses mots, ⚠ jour contredit ; barres horizontales à 4 offres ou plus. 0 erreur de console.
Mots : assurance 20, bar 23, bouteilles 27, cave 20, chaudière 27, citra 14, CO2 27, écoulement 28, fête 25, levure 18, pilsner 15, sureau 15.

## Limites
- Les réponses de l'IA sont écrites à la main (`cap-v7/banc/gen-reponses.mjs`) : aucun appel réel. Elles prouvent le rendu et la
  validation, pas la qualité de lecture d'un vrai modèle.
- La lecture locale (IA absente) du jouable est une version simplifiée ; la vraie, `analyseLocale.ts`, reste à corriger hors de ce contrat.
- Le banc de 4 offres n'a pas de vrai carnet du brasseur derrière lui.
- Drapeaux emoji (🇫🇷) rendus en lettres sous Windows ; normal sur téléphone.
