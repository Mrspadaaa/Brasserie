# Brief : Impôt bière de l'année, mini maquettes (10.11)

Ses mots : « Impôt bière de l'année (dans Clients) : il n'a pas de maquette, il reste une version minimale, le total et la liste des brassin fait en »
(lu : fais-en des mini maquettes). Écran : Clients › Impôt bière, l'année entière (p2b, choisi, est la feuille d'un brassin : `v0/p2b/`, « Ça top
comme ça » : sa langue est la règle à trois bandes du barème). Aujourd'hui dans l'app : total + liste des brassins (`src/components/tabs/ClientsTab.tsx`,
section Impôt ; lance `?dev-local&finance-demo` à 390 pour le voir).

Le métier (lis `INVENTAIRE-CODE.md` problèmes 12–14, `voies/d1/RESULTAT.md`, `src/domain/finance/swissBeerTax.ts`) : combien je dois à l'OFDF
pour l'année, quand (déclaration et paiement), à qui ; par brassin, ce qui est sorti de cave (vendu) et ce qui attend ; réduction petit brasseur
(confirmée ou non) ; densité manquante = fourchette hachurée, jamais 0. Lien vers la feuille p2b de chaque brassin. Copier pour Taxas.
Obligatoire : `BRIEF-AUTEUR.md` § « Obligatoire » ; `BRIEF-PASSE2.md` § « Corrections transversales » ; maquettes **statiques**.

Rends 6 concepts `i1a`–`i1f` dans `p5/<id>/` (etat.html préfixé, NOTE.md court, captures `node scripts/agents/verifier-page.mjs <etat.html>
--captures p5/<id>/<id>` + 1280, ouvertes), 1 froid, 2 tièdes, 3 chauds, tous dans la langue de p2b. Puis `p5/RESULTAT-i.md`.
N'écris que dans `p5/`. Rien dans `src/`, aucun commit, pas de `git stash`. Rends une ligne.
