RESULTAT critique-cal : 12 problèmes (B 4, m 7, D 1) — BUGS OK

Versions : frise jugée sur index-BWLOL1xf.js (tour 29). Le cache servait encore index-CoXAhg_q.js : le service worker a été désinscrit, puis la page rechargée. Contre-vérification et nettoyage sur index-KxF0Bcaa.js (tour 30, frise inchangée).
Tests : sans objet (test d'écran). Registre : `node scripts/agents/controle-bugs.mjs > bugs.log` → « BUGS OK : 2130 bugs, 506 ouverts, 202 sources ».
Écran : 390 × 844, toucher, Chrome de débug (onglet propre fermé, Chrome laissé ouvert). Référence de ses choix : cap/REF-r2-c.png, cap/REF-r6b.png (rendu de gi2/r2-c et en2/r6b).

## Règles jouées
- **CAL-ETAT-COHERENT** : à chaque geste, le bouton de durée, l'étiquette du cadre et l'axe disent la même chose (poignées, cadre glissé, menu 2 sem. / 6 sem. / 3 mois / 6 mois / An, échelle Jour / Semaine / Mois). En revanche, le cadre ne suit pas une période qui commence avant le 24 nov. 2025, et ‹ › ne changent pas la frise (problèmes 1 et 2). Quand la période tient dans l'horizon (3 → 30 mai 2027), le cadre la suit. « ‹ auj. » apparaît quand aujourd'hui sort de la vue. cap/R1-*.png, T30-00
- **CAL-TOUCHER-GRADUATION** : OK. Toucher S50 donne « S50 2026 » et « Cadre sur S50 · Annuler » ; toucher mars donne « 1 mars – 4 avr. 2027 » ; Annuler ramène l'An. cap/R2-01, R2-06, R2-07
- **CAL-ETIQUETTE-GRAIN-AU-DESSUS** : OK. En jours : « S53 2026 – S1 2027 » et « S52 – S53 2026 » ; en semaines, des dates. cap/R3c-02
- **CAL-GRADUATION-ROGNEE** : rien n'est rogné ni chevauché (mesuré à chaque vue). À 3 ans, les années sont sur la bande (« J 2027 J 2028 … »). Restent la première année sans nom (5) et l'An sans année (6). cap/R3c-06
- **T28-16** : toujours présent → T29-3. **CALP-5** : présent dans un cas → T29-5.
- **Défilement au bord** : problème 8. **Sections** : Finances et Brassins ouvrent leur calendrier, réglé sur leurs rangées : OK (cap/R10-02, R11-02). **Renvois** : depuis la Liste, l'événement s'ouvre sur place (Modifier, Lier, ⋯) : OK (cap/R9-01). Depuis Bord › Agenda : problème 4.

## Problèmes
1. **B** — La période de l'app va du 01.01.2024 au 31.12.2027. La frise dit « 4 ans », mais son cadre va du 24 nov. 2025 au 25 nov. 2029. Avec la période 22.11.15–21.11.19, elle montre encore 2025–2029. La poignée de début ne va pas plus à gauche, et rien ne signale la butée. (T29-1 ; R1-03, R1-06, R1-11)
2. **B** — Depuis 01.01.24–31.12.27, toucher « › » donne 22.11.23–21.11.27 : la période recule au lieu d'avancer. ‹ et › ne changent jamais la frise. (T29-2 ; R1-09, R1-10)
3. **B** — Tenir la barre change encore l'échelle : 3 mois ou 6 mois deviennent 6 sem., et la barre n'est plus sous le doigt. À 6 mois, un glisser vers la gauche a posé l'événement deux semaines plus tard (2 → 16 août). À 3 mois, un glisser de 72 px est resté sans effet. Un seul cas était juste (23 → 30 nov.). (T29-3, T28-16 ; R8-a, R6-a, R5-a)
4. **B** — Dans Bord › Agenda, toute la ligne est une case (`<label>`) : toucher le nom d'une fête la coche « Fait ». Aucun renvoi ne mène à sa feuille. Confirmé au tour 30. (T29-4 ; R13-fete-1, T30-06)
5. **m** — Entre 25 et 31 mois, la première année n'a pas de nom sur la bande : « M M J S 2027 … ». (T29-7 ; R1-04)
6. **m** — Sur l'An, la bande montre « O N D J F M A M J J A S O N D J F », sans année au passage de janvier. (T29-8 ; R1-13-duree-An)
7. **m** — CALP-5 : après le passage à 6 sem. au toucher, « S33 · 16 août · lâcher ici » couvre la barre glissée. (T29-5 ; R8-a-6mois-gauche-pendant)
8. **m** — Barre tenue 2,5 s au bord : la frise passe de 6 sem. à 6 mois, et l'événement est posé hors du cadre visible (16 nov. → 2 août, puis 2 août → 24 mai). Pendant le geste, la barre passe sous la barre du bas. (T29-6 ; R6-c-bord-1, R6-c-apres, R8-c)
9. **m** — Quand toutes les choses d'une rangée sont hors du cadre, sa pastille de somme est vide, avec « pas confirmé ». (T29-9 ; R1-07, R6-c-apres)
10. **m** — « prévu S48–S47 » et « prévu S48–S25 » n'ont pas d'années sur un cadre de plusieurs années : on lit la plage à l'envers. (T29-10 ; R1-03, R1-04)
11. **m** — « ‹ auj. » n'est pas un bouton : le toucher cadre sur S51, la semaine cachée dessous, et pas sur aujourd'hui. (T29-11 ; R3-03)
12. **D** — Après un geste sur les poignées, la durée s'affiche « 31 mois », « 46 mois » ou « 63 mois », pas en années. (T29-12 ; R1-04, R1-05)

## Doutes (non comptés)
- Au tour 29, « Cette semaine au calendrier » (Bord › Agenda) a ouvert le 14 juin – 25 juil. 2027. Au tour 30, depuis un cadre de novembre, il ouvre juste le 23 nov. 2026 – 3 janv. 2027. Le premier cas n'a pas été rejoué. (R13-semaine-1, T30-05)
- Quand aujourd'hui est dans la marge, hors du cadre (An ou 3 ans depuis déc. 2026), rien ne dit « ‹ auj. » : seul le trait bleu le montre.
- Le menu propose 2 sem. et 6 mois. Il ne propose ni « 3 sem. » ni « 3 ans », que le dossier cite.
- Vraie donnée : la Hefe « pas brassée », prévue le 10 sept., est « prête le 1 avr. ».
- Feuille de période sur 4 ans : « du 7 déc. au 31 déc. ; du 1er févr. au 31 mars … » ne dit pas les années.

## Données
- L'événement « ZZ TEST — barre » (Travaux) a été créé, glissé, annulé, puis déplacé. Je l'ai décoché dans l'Agenda, puis supprimé (⋯ › Supprimer). Il n'apparaît plus ni dans l'Agenda ni dans la frise (T30-03, fin6).
- Un toucher sur son nom dans l'Agenda a coché « Fait » la vraie fête « vi ». Je l'ai décochée aussitôt : elle est de nouveau « 12.10.2026 · en retard », « 1 à faire » comme avant.
- Vraies choses comparées à la vue du départ (Tout, 6 sem., 9 nov. – 20 déc.) : les mêmes 13 choses aux mêmes dates (Milk Stout, Ttt ×2, Hefe, NEIPA Test, neipa v3 ×3, Jhhh, Fruty, vi, lol, Impôt). L'état d'affichage est remis : Tout, 6 sem., 9 nov. – 20 déc.
- BUGS.md : T29-1 à T29-12 ajoutés ; état de T28-16 et CALP-5 mis à jour, avec captures. CALP-6 et CALP-13 non rejoués (hors du dossier).

LEÇON PROPOSÉE : dans Bord › Agenda, une ligne est un `<label>` à case : un test de « renvoi » qui touche le nom écrit une vraie donnée. Il faut toucher des « ZZ » seulement, ou lire le DOM avant de toucher une ligne réelle.
