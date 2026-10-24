# Voie r4-suggerer — Suggérer de q2b, tous ses états

- Mission : 2026-10-23-maquette-parcours ; contrat commun : `../REPRISE-D124.md` (à lire d'abord, en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : p21b, p24
- Décideur en cas de doute : pilote ; aucune question bloquante

## Sa maquette choisie
q2b : « Ça oui, c'est effectivement l'un de mes choix » ; « C'est effectivement qb2 reprise le mieux » (19.10).
`work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/q2b/` (NOTE.md, `etat*.html`), intégrée dans la base v4.10
(`work/refonte-frontend/v4/ecran-1/base/consolide/suggestions-radar.html`, `etat-b.html`) ; registre `choix/ecrans.json`,
écran `suggerer` ; inventaire `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees/inventaire-q2b.json` ; relevé
`work/refonte-frontend/v4/choix/etats/suggerer.json` (18 états) ; acquis « barres l5b », « q2b suite de s5 »
(`choix/etats/acquis.json`). Voulus depuis : la croix (D109), l'en-tête commun (D119), les traits lus au toucher (D110).

## Ce qui est perdu (p21b, à rendre)
- La **barre l5b à droite d'un axe central** dans chaque ligne (« Les bar de ce type sont plus informative ») : la
  maquette l'a remplacée par un rail sous la ligne (`etat-sugg-assembler`, `-piste-objectif`, acquis l5b).
- Les **groupes par effet** (+1 cran / +2 crans…, cadres à bord noir), et les trois cartes d'objectif de q2b (dont
  « Plus agrumes ») (`-groupes-effet`, `-repos`).
- Le groupe **« Changer de levure »** de q2b (`-levure`) : **pas dans la reprise** (avis croisé, D35 : Suggérer ne fait
  varier que le houblon, L10 ; Levure est un écran au choix ouvert). Il passera en variantes à lui montrer ; écris-le
  dans RESULTAT.md comme retrait, avec D35.
- La règle « ‹ visée | visée › » de q2b ne revient pas : « Ça c'est inutile » (D91).
- Le volet **« IBU après chaque voie (ma bière 59,7 ; style 50–70) »** (`-ibu-details`).
- **Dry hop · actif** : Motueka 20 g, pastilles floral → agrumes, thiols, « creep » (`-dry-hop`).
- **Remplacer** : trois remplaçants avec deux barres chacun, pas un chiffre (`-remplacer`).
- Le **mode Radar** : radar avec « ‹ 10′ › » par voie, « Appliquer à la recette », « montrer sur le radar », « +11 »
  (`-radar`).
- Le **menu aimer · neutre · exclure** du ♡ (`-coeur`).
Les nombres viennent du moteur en direct ; les mots et la forme, de q2b.

## Possède
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/**`
- `prototypes/houblons-v4/maquettes/parcours-suggerer/**`
- `work/missions/2026-10-23-maquette-parcours/voies/r4-suggerer/RESULTAT.md`
`ma-biere/Base.tsx` (Bandeau) est à r1 : lis-le, ne le modifie pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
RESULTAT.md (états rendus, captures, décisions) ; réponse finale au pilote : une ligne.
