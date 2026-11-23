# Contre-épreuve du Calendrier, tour 11 (23.11)

Ses mots : « une fois toutes les corrections effectuées. Pas le faire en boucle juste une fois, si il trouve des médiums ou mineur ils sont
corrigés avec l'écran suivant. Et juste testé sur les cas qui posait problème. »

## Méthode

- App en ligne, tag `en-ligne/2026-11-23-tour11` (61f116620). Chrome du brasseur (port 9222) par `connectOverCDP`, MON onglet seulement
  (repéré par son targetId), fermé par `page.close()` à la fin ; ses deux onglets intacts. Téléphone émulé 390×844, toucher activé, agent
  Android ; 844×340 et 390×660 sur les étiquettes de la courbe. Gestes au vrai tactile (`Input.dispatchTouchEvent`, pas de 16 ms).
  Lectures DOM de `port-carnet/e2e/outils/calendrier.ts` (`fautesEtiquettes`, `fautesTextes`, `lireCoherence`) en appui.
- Paquet : à l'ouverture, l'onglet neuf a reçu l'ANCIEN `index-Bt0rkeZN.js` (le service worker du tour 10, sans D429, ne cherche pas la
  mise à jour). Rechargement sans cache : `index-Cmzen8eH.js`, relu au début de chaque série (une vingtaine), toujours le bon. À vérifier une fois sur
  le téléphone : un onglet ouvert avant le tour 11 garde le tour 10 jusqu'à un rechargement forcé.
- Données : seulement « ZZ TEST — contre-épreuve — barre » (fête), « … — idée » et « … — idée 2 » (carnets, et leurs achats prévus).
  Toutes supprimées ; disparition vérifiée après rechargement (Calendrier à An, Carnets, Stocks : 0 occurrence). Aucune vraie chose
  déplacée. Le brassin Ttt (vrai) a seulement été ouvert, « Supprimer » vu, jamais touché.
- Vision : 119 captures sauvegardées ; celles de chaque constat ouvertes et regardées (une cinquantaine, dont les planches `planche-1.png` et `planche-2.png`). Mesures DOM en appui seulement.
- Restent dans les vraies données, d'autres agents : « Vente 1 × ZZ TEST — parcours r2 … » et « … parcours 10.11 … » (Ventes, S48).

## 1. Couverture, cas par cas

46 cas (LISTE classes a et b) : **OK 16, KO 22, non reproduit 7, non joué 1.**

### Classe (a)

| L | Verdict | Vu |
|---|---|---|
| L-1 B | OK | 5 levers au bord gauche (x 4 levé aussitôt, tenu 1 s, 3 s ; x 20 tenu 3 s ; x 0) + 1 doigt revenu viser : jamais « lâcher ici » laissé, cadre là, fenêtre immobile, date écrite = annonce, Annuler rend la date. `L1-x4-0s-*`, `L1b-*`, `L1c-*` |
| L-2 G | KO attendu | cadre x 68 à 316, graduations pleine largeur. Q-1 ouvert. T11-8 |
| L-3 G | KO | 0 faute à 3 mois, 6 mois, An (3 gestes chacun), paysage ×4, 390×660 ; mais Févr. · 4 sem. : « Achats −13 » sous la poignée de fin. T11-2 |
| L-4 m | OK | aucun « … » dans la courbe, toutes échelles |
| L-5 G | KO attendu | « S50 » quelle que soit la fenêtre. Q-3 ouvert. T11-9 |
| L-6 G | OK | Nov. › Déc., début tiré, ‹ : « Nov. » et la fenêtre de Nov. (S44 – S49). Remarque : une fenêtre locale faite AVANT › (S48 – S53) n'est pas rendue, c'est celle de la période qui revient (« la fenêtre la suit alors ») |
| L-7 m | OK | échelle Mois, 6 mois : « mai » gradué. `L7-mois` |
| L-8 m | KO partiel | la fenêtre grandit à droite et pose plus loin (4 essais), doigt ramené : juste ; 1 lever au bord sur 4 écrit une semaine après l'annonce. T11-3 |
| L-9 d | KO | butée S48 2025 sans signe (non corrigé). T11-14 |
| L-10 m | OK | An : « nov. 2026 – nov. 2027 » au menu et au rechargement (voir §3) |
| L-11 m | OK | Échelle Mois/Jour/Mois depuis 6 sem., 3 mois, An : Annuler visible à 0,4, 1,5 et 4 s, il rend la fenêtre (3/3). `L11c-4s` |
| L-12 m | KO attendu | « S44 – S49 » au-dessus de S44 … S49. Q-5 ouvert. T11-10 |
| L-13 d | OK | 1 sem. : le cadre suit (+60 px pendant), se pose à la semaine. `L13-*` |
| L-14 G | OK | brassin, idée, fête, achat : frise partagée ; plus de carrousel. `L14-*` |
| L-15 d | KO partiel | fiche « 8 févr. 2027 », + « S5 2027 · prête le 1 mars 2027 » justes ; Modifier : « S6, 8 févr. » sans année. T11-6 |
| L-16 d | KO | brouillon perdu au rechargement (non corrigé). T11-15 |

### Classe (b)

| L | Verdict | Vu |
|---|---|---|
| L-17 | OK | « Nov. » inchangé après une soixantaine de gestes locaux |
| L-18 | non reproduit | lenteur absente : 36 sem. en 3 s, doigt immobile = tremblant. La vitesse reste Q-4 (ressenti au téléphone) |
| L-19 | non reproduit | un toucher hors cadre ouvre « Libre, sur l'année », une semaine lue, panneau à × (voulu) |
| L-20 | OK | 2 sem. ancre sur aujourd'hui, 6 sem. et 6 mois gardent le début : voulu (CHN-3) |
| L-21 | KO | à 6 sem., aucun bouton de période marqué. T11-16 |
| L-22 | OK | fenêtre gardée au rechargement |
| L-23 | OK | date de la fiche : réglette `.cal-f-duree`, fiche intacte. `L23-date-fiche` |
| L-24 | non reproduit | aucun « LOT-… » brut (Calendrier, Brassins, Bord) ; pas de brassin créé (données réelles) |
| L-25 | KO | barre de brassin au lundi (mardi 13 oct. dessiné dès le 12). T11-23 |
| L-26 | KO | achat posé sans le prix estimé. T11-1 |
| L-27 | non joué | aucune pose avec montant possible sans toucher à l'argent réel autrement que par L-26, qui n'en écrit pas |
| L-28 | OK | « … › Supprimer » dans la fiche d'un brassin prévu (§3) |
| L-29 | KO | semaine dépliée en jours, courbe en semaines. T11-11 |
| L-30 | KO | + propose S48 après avoir déplié S47. T11-24 |
| L-31 | non reproduit | Supprimer de la fiche à y 513–553, + à y 736 |
| L-32 | non reproduit | toast y 740–796, ne couvre aucune rangée |
| L-33 | KO | « Durée » d'un achat, libellés de semaine différents. T11-17 |
| L-34 | OK | ordre des rangées stable sur 3 rechargements |
| L-35 | KO | deux adresses du Carnet. T11-18 |
| L-36 | OK | « 1 j » (fiche et feuilles), jamais « 1 semaine » |
| L-37 | KO partiel | 5 pas sur 5 dans la rafale ; le bouton glisse encore de 6 px. T11-5 |
| L-38 | KO | fermeture sans avertissement ; le × ne bouge plus. T11-12 |
| L-39 | KO | hors ligne sans signe. T11-13 |
| L-40 | KO | cibles 22 à 34 px. T11-19 |
| L-41 | KO | « Ranger sans date » rouge, pas de Supprimer. T11-20 |
| L-42 | KO | montant avant ou après le nom selon la rangée. T11-21 |
| L-43 | KO | jours sans mois dans Modifier. T11-22 |
| L-44 | OK | « Exercice 2026 » : S1 – S52, 52 points |
| L-45 | non reproduit | rangées lisibles, Ventes sans chevauchement |
| L-46 | non reproduit | console : aucun message Firestore (seulement la balise apple dépréciée ; et, au Carnet, une image ggmgastro.com bloquée par la CSP : pour le test du Carnet) |

REPRISE-CORRECTION, non reproduits à rejouer : L-11 OK, L-36 OK, L-37 KO partiel (T11-5).

## 2. Défauts

24 lignes dans `defauts.jsonl` : **B 0, G 4, m 7, d 13.** Neuf ou laissés par le tour 11 (T11-1 à T11-7) ; les autres (T11-8 à T11-24)
sont des cas de la liste toujours ouverts, revus sur ce paquet.

1. **T11-1 G (L-26)** : Carnet › prix estimé › Au calendrier : l'achat est posé et montré, mais sans prix ; À venir dit « Noter le prix »,
   l'argent ne bouge pas, pas d'Annuler. `L26-bis-calendrier`, `L26-prix-choisi`, `N5-modifier-2`.
2. **T11-2 G (L-3)** : Févr. 2027 · 4 sem. : « Achats −13 » coupé par la poignée de fin. `L3-fevr-zoom`.
3. **T11-3 m (L-8)** : au bord droit tenu 3 s, annonce S5, écrit S6 hors de la fenêtre (1 lever sur 4). `L8b-*`.
4. **T11-4 m (neuf)** : « CHF à dépenser » rogné par ± quand la pastille dit « Juin · 5 sem. ». `L37-apres-5`.
5. **T11-5 d (L-37)** : ‹ Mois › glisse de 6 px au changement de libellé.
6. **T11-6 d (L-15)** : Modifier : « S6, 8 févr. » sans 2027 ; « S6 2027, 8 févr. 2027 » sur la ligne Durée.
7. **T11-7 d (neuf)** : titre de fiche rogné « … — idé… ».
8. T11-8 G (L-2), T11-9 G (L-5), T11-10 m (L-12) : attendent Q-1, Q-3, Q-5.
9. T11-11 m (L-29), T11-12 m (L-38), T11-13 m (L-39), T11-23 m (L-25).
10. T11-14 à T11-22, T11-24 d : L-9, L-16, L-21, L-33, L-35, L-40, L-41, L-42, L-43, L-30.

Aucun bloquant. G à corriger : T11-1 (avec l'écran Carnet, suivant) et T11-2 (courbe) ; m et d avec l'écran suivant, comme il l'a dit.

## 3. Les trois choix à relire

- **L-28, Supprimer un brassin prévu.** Vu sur le vrai brassin Ttt (LOT-010, « pas brassée », J41 en retard) : fiche › … › « Supprimer »
  en rouge, à côté de Ouvrir, Commander, Budget, Lier ; non touché (donnée réelle) ; l'effet (statut « annulé », Annuler le rend) n'est
  prouvé que sur la fixture e2e. `L28-actions`. Avis : à garder. Conforme à D412, réversible, au même endroit que pour les autres choses.
  Le mot « Supprimer » pour un statut « annulé » est juste du point de vue du brasseur (le brassin quitte le Calendrier).
- **L-26, Carnet › « Au calendrier » pose l'achat prévu.** Vu avec deux idées ZZ, sans prix, prix choisi après, prix choisi avant :
  l'achat est posé en S48 et le Calendrier s'ouvre dessus, fiche ouverte. `L26-calendrier`, `L26-bis-calendrier`. Avis : la forme est la
  bonne (1 bouton : ajout et transfert), mais la 3e action de ses mots, le prix estimé, est perdue (T11-1). Défaire est lourd : pas
  d'Annuler, la fiche du Calendrier n'a que Ouvrir et Lier (« Cette chose se retire dans sa source »), il faut Stocks › Matériel › À venir
  › Modifier › Supprimer ce projet › Oui, puis le carnet (bloqué tant que le plan le retient). À reprendre avec l'écran Carnet.
- **L-10, An au rechargement.** Vu : An par le menu et après rechargement, même étiquette « nov. 2026 – nov. 2027 » (« oct. 2026 –
  oct. 2027 » quand la fenêtre part de S44). Poignée de début tirée de 40 px à An : la fenêtre glisse (« août 2026 – août 2027 », reste
  An) ; poignée de fin −40 px : « S35 – S25 2027 », 44 sem., l'étiquette repasse en semaines. `L10-An-recharge`, `L10b-An-poignee-*`.
  Avis : à garder ; une seule étiquette par chemin, comme demandé. Le début qui fait glisser toute la fenêtre à An suit le plafond de
  52 semaines (T9-2) : cohérent, mais à surveiller s'il le trouve surprenant (aucune plainte écrite).

## Limites

- Un seul thème (clair), un seul appareil émulé ; pas son téléphone (Q-4 et la transition du service worker restent à voir dessus).
- L-24, L-27 sans brassin ni montant créés (règle des données réelles) ; L-28 vu sans toucher Supprimer.
- T11-3 : cause non établie (course possible avec le défilement de 12 sem./s, ou décalage d'une semaine au lever).
