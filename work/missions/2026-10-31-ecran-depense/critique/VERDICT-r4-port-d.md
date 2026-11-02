OK — accepté : son choix D est repris tel quel dans l'app (ligne de sous-famille, chevron, compte, quantité, montant, filet, toucher, ouverture d'office, groupe d'une ligne, bande à une sous-famille inchangée), chiffres justes au centime, rien de cassé ailleurs ; aucun bloquant, un majeur à relancer dans une voie suivante, trois mineurs

Critique Fable, 02.11, sur `voies/r4-port-d/captures/` (18 côte à côte ouverts en image, L12), `voies/r1-renovation/captures/tactile390-renovation-repos-clair.png` (l'avant), `choix-sousfamilles/img/d-*.png` (sa maquette, règle n° 1), D306, D307, SPEC D277, PORTRAIT v2.

- **r4-port-d** (port de son choix D) — ACCEPTÉ. Sa phrase prédite : « C'est bien ça, D. Manque juste le tout plier, déplier. »

## Règle n° 1 : D côte à côte, élément par élément

| Élément de D (d-repos, d-renovation, d-nettoyage, d-renovation-sombre) | Dans l'app | Capture |
|---|---|---|
| En-tête de bande inchangé (pastille, nombre, quantité, montant) | Oui, « Rénovation 16 · 29 Stk · 423,30 » = celui de r1 | cote-tactile390-renovation-repos-clair ; r1 tactile390-renovation-repos-clair |
| Une ligne par sous-famille : chevron `>`, nom 14 px, pastille de nombre, quantité mono gras dans la colonne de la bande, montant mono | Oui, 28 px, mêmes tailles, colonnes à 0 px de l'en-tête (rapport.txt l. 10 à 25) | cote-tactile390-renovation-repos-clair, cote-pc1280-renovation-repos-clair |
| Filet de famille continu à gauche, trait bas | Oui, kaki, continu sur les lignes et les rangées | toutes les renovation-* |
| Toucher ouvre : chevron `v`, nom gras, fond kaki à 10 %, rangées d'aujourd'hui | Oui ; les autres restent repliés | cote-tactile390-renovation-ouvert-clair, -cave ; cote-pc1280-renovation-ouvert-clair, -cave |
| Ligne à vérifier ouvre son groupe d'office (d-nettoyage : Désinfectant) | Oui : « Électricité 3 » ouvert seul, sa rangée au montant rouge visible | cote-tactile390-renovation-averifier-clair, -cave ; cote-pc1280-renovation-averifier-clair, -cave |
| Sous-groupe d'une ligne : la rangée seule, sans chevron ni ligne (Silicone) | Oui : Mitigeur, Gants, Étagère, à leur place dans l'ordre Plomberie › Protection › Divers | cote-tactile390-renovation-repos-clair |
| Bande à une sous-famille ou sans : celle d'aujourd'hui | Oui : Nettoyage (1 ligne) ; état `familles` à 11 bandes sans aucune ligne de sous-famille, rangées intactes | cote-tactile390-familles-repos-clair, -cave ; cote-pc1280-familles-repos-clair, -cave |
| Sombre : filet et teinte kaki clair, pastille sombre | Oui, même structure que d-renovation-sombre | cote-tactile390-renovation-repos-cave, -ouvert-cave |
| 1280 : deux colonnes, la liste à droite | Oui, lignes de sous-famille dans la colonne de droite, mêmes proportions | cote-pc1280-* |

Aucun écart qu'il ne reconnaîtrait pas. Le chevron de l'app est le même trait fin que le sien ; la pastille, le même cadre ; les quantités sont en gras comme chez lui.

## Chiffres (brasseur : honnêteté)

- Repos : 154,70 + 114,70 + 22,90 + 39,60 + 54,00 + 8,40 + 29,00 = 423,30 = bande. 11 + 5 + 3 + 6 + 1 + 1 + 2 = 29 Stk = bande. 5 + 4 + 2 + 2 + 1 + 1 + 1 = 16 = pastille.
- Peinture et sols ouvert : 64,90 + 38,50 + 14,70 + 23,80 + 12,80 = 154,70 ; 1 + 1 + 3 + 2 + 4 = 11 Stk.
- À vérifier : Électricité 23,40 + 16,20 = 39,60 « + ? » ; 4 + 3 + 3 = 10 Stk ; Peinture et sols 154,70 − 12,80 = 141,90, 11 − 4 = 7 Stk ; bande 423,30 − 12,80 = 410,50 « + ? » ; pied « Détail 434,20 / 447,00 ».
- Tout juste, aux deux largeurs et aux deux thèmes.

## L'écart « + ? » en rouge sur un sous-total au montant inconnu : juste, à garder

Sa règle (SPEC D277, 01.11) : « Ne sait pas, aucune idée, flag rouge, je dois remplir ou corrigé », « pas que pour les unités mais globalement pour tout », un seul code de signal pour tout l'écran ; § 0 : « l'inconnu n'est jamais 0 ». L'en-tête de bande dit déjà « 410,50 + ? » en rouge dans l'app d'aujourd'hui ; un sous-total qui dirait « 39,60 » tout court cacherait le trou, un « 0 » le mentirait. Sa maquette d-nettoyage fait la même chose avec le jaune : le « 3 Stk » du groupe Désinfectant porte le pointillé jaune de sa rangée reprise. Le port propage le signal exactement dans cet esprit. Un rejet ici serait un goût que je lui prête, pas une règle : je ne rejette pas.

## Bloquants

Aucun.

## Majeurs

1. **« tout plier, déplier » absent** — attendu : c'est son « mais » (D307), montré à part dans r3-plier, et le port en prépare l'état (`toutPlier`/`toutDeplier` testés, aucun contrôle visible, vérifié dans RESULTAT et rapport.txt). Pas un défaut de cette voie ; c'est la relance déjà planifiée. Sa phrase, s'il voyait l'app telle quelle : « Et le tout plier, déplier ??? ». À ne pas lui montrer sans r3-plier.

## Mineurs

1. **Colonne des quantités décalée sur une ligne « + ? »** — `cote-tactile390-renovation-averifier-clair`, ligne « Électricité 3 » : « 10 Stk » à 505 px quand les autres lignes sont à 538 ; l'en-tête de bande a le même décalage (« 29 Stk » à gauche de « 410,50 + ? »). Comportement de la bande d'aujourd'hui, pas un écart à D (sa maquette n'a pas ce cas). Correction, dans une voie commune à l'en-tête et à la ligne : réserver à la colonne du montant la largeur de « 000,00 + ? » dès qu'un inconnu existe dans la bande, pour que la colonne des quantités ne bouge pas d'une ligne à l'autre. À faire sur les deux à la fois, jamais sur la ligne seule.
2. **Sous-famille « Consommable » dans la bande Nettoyage** (doute de l'auteur, non capturé) : `categorieDeFamille` rend « Consommable » quand aucun mot de nettoyage ne tranche ; sur une vraie pièce à plusieurs produits de nettoyage, il verrait un groupe « Consommable » dans Nettoyage, un mot qui n'est pas le sien. À mesurer sur sa pièce du jour (L28) avant de conclure ; si le groupe apparaît, le nommer « Autres » ou le laisser sans ligne (les lignes sans sous-famille vont déjà à la fin, sans ligne).
3. **Noms sur deux lignes dans un groupe ouvert à 390** (« Peinture murale blanche mate 10 L », « Vitrificateur parquet satiné 2.5 L ») : la rangée d'aujourd'hui, pas un écart ; sa maquette a des noms plus courts. Rien à corriger dans ce port ; à garder en tête pour sa pièce réelle (17 lignes, D306).

## Rien de cassé ailleurs

- Rangées : icône, nom, « n Stk × prix », montant identiques à r1 (tactile390-renovation-repos-clair de r1 contre la rangée « Pinceau plat 50 mm » dans le groupe ouvert).
- En-tête de pièce, puces (« 17 hors stock », « 1 à remplir », « Règlement supposée »), pied (« + Ajouter une ligne », « Regrouper en une dépense », « Détail … / … », Catégorie | Papier, Confirmer) : en place aux deux largeurs et aux deux thèmes.
- État `familles` : onze bandes dans l'ordre, 0 ligne de sous-famille, 0 rangée cachée (rapport.txt l. 2 à 4, 42 à 44), captures conformes.
- Focus clavier : contour 2 px sur la ligne « Outillage », bouton `aria-expanded` (cote-*-renovation-focus-clair).
- 0 erreur de console, 0 débordement, 0 requête hors localhost (rapport.txt).

## Ce que la capture ne montre pas (à dire, pas à deviner)

- « Y aller » vers une ligne d'un groupe replié (`reveler`) : câblé, non joué (RESULTAT, doutes). À jouer au banc sur sa vraie pièce.
- La ligne à vérifier a été fabriquée par le geste (renommer, effacer le montant) faute d'aperçu qui la porte ; l'ouverture d'office sur une lecture réelle 3.8 reste à voir sur une vraie pièce (L28).

## Phrase prédite du brasseur

« C'est bien ça, D. Manque juste le tout plier, déplier. » — aime, avec son « mais » habituel, qui est déjà la voie r3-plier.

LEÇON PROPOSÉE : aucune (celle de l'auteur sur l'état de banc fabriqué par le geste est juste, elle est à lui).
