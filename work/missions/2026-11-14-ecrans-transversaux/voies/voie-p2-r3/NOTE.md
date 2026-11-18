# NOTE — voie-p2-r3 (passe 2 de r3)

r3p2 · Le geste d'abord, au pouce · tiède · problèmes réglés : critique r3 n° 1, 2, 3 ; retouches communes (dates, mêmes données, mono, en-tête et barre, pas de menu déroulant) ; défauts d'INVENTAIRE n° 1, 2, 3, 10 · bouge : la feuille descend au clavier (champ collé au clavier, ordre inversé : le geste d'ici au plus près du pouce) ; « Courses » ne reste que dans « Aller à » ; « Inventaire » devient « Corriger l'inventaire » (existe : StocksTab) ; les créations du + passent en cinq tuiles courtes (Écriture, Vente, Recette, Brassin, Compagnon) ; le × remplace « Annuler » ; raccourcis ⌘R/⌘J deviennent Alt R / Alt C / Alt I (⌘R recharge la page).

## Corrections faites
1. Critique 1 : « Courses » en double. Retiré de « Ici » ; il reste dans « Aller à ». « Ici » = Entrer une facture (plein), Retirer du stock, Nouvel article (action de l'écran du +, `fabActions` : « Nouvel article de stock »), Corriger l'inventaire.
2. Critique 2 : mono seulement sur les chiffres (« 1,2 » mono, « kg » en Source Sans) ; plus d'espace parasite ; interlettre du mono resserré.
3. Critique 3 : « Inventaire » vérifié : la correction d'inventaire existe dans `src/components/tabs/StocksTab.tsx` ; libellé « Corriger l'inventaire ».
4. Greffe r1 : champ collé au clavier, avec la pastille de contexte « Stocks » dedans, la bascule Archives et le × à côté.
5. Greffe r1 : le meilleur résultat (Citra T90) est juste au-dessus du champ, surélevé, avec ses deux gestes (Retirer en plein, Courses) ; les autres montent par pertinence.
6. Greffe r1 : « 3 de plus dans les archives » en pointillé, en tête des résultats (téléphone) et sous la liste (1280).
7. Greffe r1 : au 1280, aperçu de la ligne choisie : en stock 1,2 kg, α 12,8 %, dernière sortie 10.11, emplois (B-031 dry hop J+6 · 600 g, recette IPA Nelson whirlpool 4 g/L, achat Brouwland 09.11 · 1 kg · 89,40 CHF), puis ses gestes et leur touche.
8. Même en-tête que l'app partout : logo, « L'Affinée », lune, loupe (enfoncée : la recherche est ouverte), ⋮ ; à 1280, la période « Ce mois (novembre) » reste dans l'en-tête (sélecteur d'ordinateur, aucun menu déroulant au téléphone, D350).
9. 1280 : navigation d'ordinateur accordée à b3 (rail latéral, un + par rubrique, sous-onglets de Stocks dans le rail) au lieu de la barre étirée (défaut 10). À 390, la barre du bas est sous le clavier : elle et son + ne bougent pas.
10. Dates : le 14.11.2026 est un samedi ; B-031 brassé le mardi 10.11, donc fermentation J+4 ; dry hop J+6 = lundi 16.11 ; dernière sortie de Citra 10.11 (whirlpool du brassage), achat Brouwland 09.11. Mêmes données que les autres séries : B-031 IPA Nelson, Citra T90 1,2 kg, Brouwland 352,05 CHF.
11. Ordre au pouce (téléphone, de haut en bas) : Aller à, Créer, Reprendre, Ici, champ. Ce qui sert le plus est le plus bas.
12. État vide gardé : « Rien pour « zzk » » avec trois sorties (archives, nouvel article « zzk », revoir les gestes de Stocks), champ toujours au clavier.
13. Acide citrique classé « nettoyage » (pas « entretien ») ; icône fiole.

## Proposé (n'existe pas dans l'app aujourd'hui)
- Écrans, créations et gestes dans la recherche (proposé) ; « Reprendre » (récents) (proposé) ; pastille de contexte « Stocks » et gestes propres à l'écran d'ouverture (proposé).
- Gestes en ligne sur chaque résultat : Retirer, Courses, Brasser, Mesure, Pièce (proposé).
- Aperçu à droite au 1280, « 600 g réservés » (proposé) ; raccourcis Alt R / Alt C / Alt I et → vers les gestes (proposé).
- Recherche dans les lignes d'écriture (« Citra T90 1 kg » dans Brouwland) (proposé).
- Rail latéral au 1280 (proposé, repris de b3).

## Rien de perdu
Champ, archives (bascule à côté du champ et Tab au 1280), groupes de types (icône et couleur de rubrique sur chaque ligne), Échap, ↑↓ ↵ au 1280 ; les cinq lignes du + sont dans « Créer » et « Ici » ; Courses, Atelier R&D, Fûts, Matériel, Agenda, Assistant, Journal, Réglages dans « Aller à ». Mes conversations, Connexions, Saisie au nom de… et Se déconnecter restent dans le ⋮.

## Jugement
1. Même idée que r3 (agir sans ouvrir la fiche), maintenant au pouce : le geste le plus utile est à 1 cm du champ.
2. Risque : « Ici » change selon l'écran ; c'est l'idée, mais le brasseur doit retrouver les créations du + toujours au même endroit (« Créer », fixe).
3. Le 1280 rejoint b3 : la palette dit tout de la ligne choisie sans ouvrir la fiche.
