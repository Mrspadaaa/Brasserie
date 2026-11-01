# Tri du pilote — relecture du code et critique de S6 (01.11)

Sources : `RELECTURE.md` (R1 à R4) et `../../critique/VERDICT-s6.md` (C1 à C6, et deux points vus au port).
Arbitre de l'écran : la maquette r2b (`v1/r2b/etat.html`, l. 378 à 412), règle n° 1. Tout est à corriger, sauf mention.

| n | source | décision | à faire |
|---|---|---|---|
| 1 | R1, majeur | corriger | `validatePurchase` et `articlesNeufsDe` ignorent, dans le stock « existant », les articles dont la ref est `MP-${submissionId}-*` (venus de cette saisie). Test : une saisie refusée puis rejouée garde le même nom (« Target bis », pas « bis 2 ») et ne lève aucune erreur. Témoin rouge sur le code actuel avant la correction. |
| 2 | R2 | corriger | `ligneDeBrouillon` passe `vendor` (le brouillon a `draft.vendor`), pour que la passe 2 de s1 reste vraie à l'écran comme à l'enregistrement. Rejouer `chasse-17-10` et `chasse-etendue` : aucune proposition fausse de plus. |
| 3 | R3 | corriger | `signatureStock` (cache de `neufParLigne`) inclut `item.supplier`. |
| 4 | R4 | corriger | RESULTAT, G3 : `data-*.js` est cité dans la table de préchargement paresseux d'`App`, sans chargement au démarrage ; le « avant » n'est pas mesuré. |
| 5 | C1, majeur | corriger | Les vraies valeurs, comme r2b : sous la ligne, « 40 g · α 11,3 » (houblon) et l'EBC lu pour un malt ; l'article grisé avec la valeur qui diffère (« Target α 11,8 », « Münchner Malz 20 EBC », « Cascade US ») ; après « Créer », la sous-ligne garde l'α, et le plateau montre à côté de la fiche les valeurs qui seront écrites (« α 11,3 · CH »). Ses chiffres seulement, rien d'inventé : une valeur inconnue ne s'affiche pas. |
| 6 | C2 | corriger | Libellés du bouton comme r2b : « Target bis », « Münchner Malz bis », « bis 2 » au besoin ; pour l'origine, « Créer CH ». Le nom complet reste dans le nom accessible du bouton. Le grisé, le bouton et le ⇄ forment un groupe qui passe à la ligne ensemble ; le ⇄ n'est jamais seul sous le bouton à 390. |
| 7 | C3 | corriger (pilote, réversible) | La pastille « approchée » prend la teinte d'attention déjà à l'écran (celle de « supposée ») ; le texte reste. |
| 8 | C4 | corriger | Dans le plateau, le premier champ porte l'étiquette « Libellé de la facture » ; « Nom de l'article » reste, toujours éditable. |
| 9 | C5 | vérifier, puis corriger | Lire le défaut du port pour une ligne d'ingrédient inconnue (`stockAction`). Ne pas changer ce défaut (métier, hors S6). Si c'est « new » : l'icône « nouvel article » de r2b sur la ligne. Si c'est « none » : un bouton « Créer « Sabro » » sur la ligne, sans ⇄ s'il n'y a aucun voisin. Le dire dans RESULTAT. |
| 10 | C6 | corriger | `capturer-s6.mjs` ajoute trois captures à 390 : après le premier « Créer » seul (une ligne créée à côté d'une ligne encore proposée), après ⇄ sur Cascade (relié à « Cascade US » avec sa pastille), et un nom tapé déjà pris, refusé. S6 OK seulement si elles existent. |
| 11 | critique, au port | vérifier sur r2b | À 390, plateau ouvert : le bandeau collant des chips masque le haut de la liste. Si r2b ne le fait pas, corriger dans `ExpenseSheet.tsx` ou `src/ui/depense/` (ta Possède) ; sinon le dire. |
| 12 | critique, au port | vérifier sur r2b | À 1280 après l'enregistrement, « Justificatif rangé dans … » passe sous le reçu. Même règle que le n° 11. |

Leçon proposée par la relecture (exclure les articles de la même saisie d'un contrôle « existe déjà ») : traitée par le pilote à la signature.

Rejouer ensuite G3 à G8 ; RESULTAT mis à jour section par section (ligne 1, Rien ne se perd, ce qui a changé au tri).
