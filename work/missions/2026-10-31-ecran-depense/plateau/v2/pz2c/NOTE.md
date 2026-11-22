# pz2c — le bandeau au pouce, passe 3 (tiède, série pz)

Base : `plateau/v1/pz2b/` (intacte). Entrées : `plateau/critique/RESULTAT.md` § pz2b (rejet : la mouture « Rattacher » absente), et ses trois
remarques du 02.11 soir sur pa1b (D350, D351, D352). Mêmes six cas, sombre (b), 1280 (b).

## Les corrections du critique
1. **La mouture « Rattacher » de p3c-3** : en (a), une ligne du bandeau « ↳ mouture, ligne 2 · 6 Kg × 0,10 = 0,60 · [Rattacher] » (la ligne du
   plateau de sa maquette), et « Rattacher la mouture » sur la bande Malts (son « Rattacher les 5 »). La pastille « ↳ 0,60 » de la rangée
   reste (p3c-3). Un toucher la rattache : le bouton devient « Détacher », la pastille « ✓ 0,60 », le bouton de bande disparaît.
2. **La ligne du bandeau sans troncature** : le nom seul (sur deux lignes s'il est long : « Détartrant express 1 L »), la mesure est dans la
   prise quantité (« 6 Kg » puis « × 2,30 = 13,80 »).
3. **« 1 sur 2 à régler »** en mots, entre ‹ ›, à 390 comme à 1280.
4. **Rien sur une ligne sûre** : (c) bandeau fermé, trois prises seules (95 px) ; la nature se change en touchant la prise.

## Ses trois remarques
- **D350, aucun menu** : plus de « Nettoyage ⌄ » : le type fin en trois pastilles (Nettoyage · Emballages · Entretien) sous le segment, un
  toucher ; plus aucun chevron. Le « ⋯ » devient la loupe « extrait de la facture » (f) : elle ouvre l'extrait, avec « la page entière » et
  « Supprimer la ligne » dessous. `controle-sans-menu.mjs plateau/v2/pz2c/etat.html` → **MENU OK (7 états)** (ECHEC sur pz2b : 5).
- **D351, « au centime »** : disparu partout ; les six calculs tombent juste. La ligne sous la rangée ne garde que l'imprimé et la référence.
  Aucun cas du brief n'a d'écart : la forme « ≠ 0,05 » n'est donc pas dessinée ici (à faire sur un vrai écart, pas sur un chiffre inventé).
- **D352, unités alignées** : la quantité de la bande et celles des rangées sont dans la même colonne, bord droit mesuré à 263 px pour les
  cinq bandes et les neuf rangées (390 px) ; le contrôle D352 de `controle-sans-menu` passe au repos.

## Ligne que je juge fausse
Aucune des trois. Une réserve, pas un désaccord : D351 retire « ✓ au centime » de p3c-3, que D349 disait garder ; sa remarque est plus
récente, elle prime (SPEC 02.11 soir).

## Inchangé depuis pz2b
Pied gardé, « OK » dans le bandeau ; le bis par défaut avec les concordances ; cinq cases d'unité de 44 px, prix par unité, « kg · comme au
stock », extrait « ▒ » au-dessus ; pièce / sachets ; stock après réception sous la prise article (fixture) ; « − 3 + » ; « + Ajouter une ligne » ;
verbes en tête de tiroir. Bandeau mesuré : a 124 · b 204 · c 95 · d 192 · e 175 · f 181 px (b dépasse 200 de 4 px : carte, trois sorties,
trois prises).

## Contrôles (02.11, une fois)
- `controle-sans-menu.mjs` → **MENU OK — pz2c : aucun menu déroulant à 390 (7 états)**
- `controle-commun.mjs plateau/v2 pz2c --page=etat.html --profil=sans-houblons --sans-lignes` → couleurs, survol, blocs, contraste, standard,
  parlant, brutes **OK** ; **mots ECHEC : 104** (> 98 ; le bandeau est hors des lignes et compte, comme en pz2b : 103)
- `controle-contraste.mjs … --profil=sans-houblons` → **CONTRASTE OK** (pire « α 12,5 » 4,66:1, 120 textes)
- `verifier-page.mjs plateau/v2/pz2c/etat.html --min-images 0` → **PAGE OK** · `type="number"` : 0
- Captures ouvertes (L12) : a à f à 390, `pz2c-b-cave.png`, `pz2c-b-1280.png`.
