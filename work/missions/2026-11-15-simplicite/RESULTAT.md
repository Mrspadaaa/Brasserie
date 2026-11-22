# Mission simplicité — résultat (15.11)

Demande : SPEC-BRASSEUR, 15.11 (« SIMPLEMENT et sans me prendre la tête » ; « en un clic on a tout l'essentiel, ça s'autocomplete … autogéré » ; effets en cascade, « être générique et général »). Contrat : `CONTRAT.md`. Aucune fonction ni donnée retirée ; rien codé ni déployé avant son choix.

## Priorité 1 (16.11) : chaque geste décompte ce qu'il use
Ses mots sur L9 : « super important!! À bien mettre et généralisé partout » (16.11). Règle de l'app, pas un écran : table réglée une fois par geste, bandeau d'effet avec Annuler, trace sur place (pe3), dose demandée une fois (pe4). Spécification et état de l'art : `REGLE-CONSOMMATION.md`. À coder en premier, avant les autres astuces retenues.

## Pages

| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Simplicité · 7 parcours supposés | passe 1 (refusée : « c'est mal target ») | https://claude.ai/artifact/Pcu4p1eL3xmgMrTEcyYjDV | `maquettes.html` (non versionnée) |
| Simplicité · tes parcours, avec tes mots | passe 2 | https://claude.ai/artifact/82HDNSfh4ADr8aigeigoH1 | `work/refonte-frontend/v4/outils/pages/2026-11-15-simplicite/index.html` |
| Simplicité · retenues | passe 2b, vote du conseil coché, retouches pe4 et pm1 | https://claude.ai/artifact/Phf2ArFjBguzQNsAZGkqkf | `work/refonte-frontend/v4/outils/pages/2026-11-16-simplicite-retenues/index.html` |

## Passe 2 — méthode
Quatre voies en parallèle (`BRIEF-v2.md`) : regard Brasseur (`voies/brasseur.md`), UX/UI (`voies/ux.md`), critique Opus de la passe 1 (`voies/critique-v1.md`, 17 problèmes), mesure dans l'app locale à 390 (`voies/mesures.md`). Puis page, critique Opus de la page (`voies/critique-v2.md`, 12 problèmes dont 4 bloquants), corrections, `verifier-page` : PAGE OK.

## Synthèse de ses problèmes (du plus fort au plus faible, ses mots datés)
1. **Saisir une facture ligne par ligne** : plus de 20 plaintes du 01 au 10.11. « une quantité il faut entre 1, écrit 2 validé 3 action sur téléphone » (02.11) ; focus perdu (09 et 10.11) ; liaison au stock « fonctionne pas super bien » (02.11). Mesuré en local : la relecture ouvre 5 doutes, 14 proposés, TVA et lectures avant la 1re ligne.
2. **Ne pas voir ce qu'une action change** : sa chaîne du 10.11 (recette → stock et besoin, achat → stock, brassage → stock, vente → finances) ; « un Tab en bas … type Lignes serrées v6a » (10.11) ; « ça a des conséquences sur tout » (15.11). Code : cascades écrites au cas par cas ; brasser ne décompte que les ingrédients, laver un fût rien.
3. **Créer un brassin ou une recette** : « Créer : aucune · Recettes : aucune … Ça resoud aucune de mes problématique » (15.11) ; RL-8. Mesuré en local : « Créer » refuse (« matériel non figé ») et renvoie modifier la recette.
4. **Le jour J, rien n'appelle la mesure** : « Ça invite pas au mesures … pas de renvoi » (10.11, sa capture de saccharification) ; « utilise des slider » (10.11) ; m2 choisie.
5. **Le besoin se relie à la main** : « l'IA fait le lien et l'enlève de la Todo » ; « en théorie il y en a pas besoin ?? » (15.11). Mesuré : « Lier à une dépense prévue · facultatif ».
Sans choix : retirer les entrées « Atelier Houblons V5.5 » (15.11). Déjà pris ailleurs : + (b1), période (m3), besoin d'équipement, planificateur.
Parcours de la passe 1 sans plainte datée, retirés : densité, conditionnement, note, inventaire.

## Astuces proposées (page passe 2)

| Problème | Propositions côte à côte | Genre |
|---|---|---|
| 1 Facture | pa1 un doute à la fois · pa2 comme la dernière fois · pa3 ton astuce de l'unité étendue (tuiles par unité) | moins d'info à la fois · historique · un geste |
| 2 Effets | pe1 onglet du bas en lignes serrées (v6a) · pe2 effets au-dessus de Terminé · pe3 la trace sur place · pe4 la question une fois (dose au curseur, jamais inventée) · pe5 toute ta chaîne | cascade générique, visible, annulable |
| 3 Créer | pb1 adapter et créer · pb2 rebrasser · pb3 créer, régler plus tard · pb4 depuis ta dernière du style | déduit · un geste · plus tard · historique |
| 4 Mesure | pm1 le palier appelle (curseur sur la cible) · pm2 ce qui manque, à la fin | renvoi · plus tard |
| 5 Besoin | pl1 déjà relié, défaisable · pl2 silencieux, tracé dans Réalisés et sur la courbe kh1r | IA bon marché |

Gains : touchers mesurés seulement pour l'existant ; les « après » ne sont pas chiffrés (aucune fréquence inventée).

## Mécanisme général des effets (à concevoir après son choix)
Événement typé et identifié → règles réglables (données, pas de cas codés) → plan d'effets pur, écrit avec l'action → trace (effet relié à l'événement) → annulation de tout l'événement, refus motivé si déjà consommé. Brique existante : `prepareBrewStockConsumption` (idempotent par identifiant) et `revertTransaction`. Une dose inconnue ne vaut jamais 0 : elle est demandée une fois.

## Restes ouverts
- Critique v2 non rejouée après corrections (bloquants 1 à 4 traités ; points 11-12 partiels : m2, kh1r et v6a non montrés en image, faute de capture locale).
- Mesure locale partielle (Haiku) : besoin, stock et note non atteints par l'automate ; densité saisie par remplissage automatique.
- Attend le brasseur : ses choix (ids copiés depuis la page).

## Vote du conseil (16.11, délégation du brasseur)
Retenu : pa1 · pa2 · pe1 · pe3 · pe4 · pb1 · pb2 · pb3 · pm1 · pl1 · pl2. Refusé pour l'instant : pa3, pe2, pe5, pb4, pm2. Caducs : c1 à c3 et les 7 parcours de la passe 1. Détail : DECISIONS.md de la mission 2026-11-16-calendrier (session pilote).
Retouches faites (passe 2b) : pe4 avec le PBW ; pm1 montre 67 °C proposé, à confirmer, et ajoute un curseur de pH ; pb1 et pb3 se placent dans la feuille d1b ; pm1 dans le compagnon p2a.
Suite : un port par écran, dans la session qui le possède (Dépense : pa1, pa2, pl1 ; Brassins d1b : pb1 à pb3 ; compagnon p2a : pm1 ; Atelier À venir : pl2) ; les effets pe1, pe3 et pe4 forment un chantier de moteur commun, avec un état de l'art (L29) avant le code.
