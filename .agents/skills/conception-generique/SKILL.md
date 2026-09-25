---
name: conception-generique
description: Concevoir ou corriger une règle métier ou un parcours à partir d'exemples utilisateur, notamment quand des cas nommés risquent de devenir des options ou limites du produit. Hors retouches purement visuelles ou mécaniques.
---

# Concevoir au-delà des exemples

Partir du besoin et des contrats existants. Réutiliser le cadrage disponible ;
ne pas rouvrir une décision validée sans contradiction nouvelle.

1. Séparer **exigence**, **illustration** et **hypothèse**. Un exemple n'autorise
   ni préréglage produit ni valeur par défaut. Une option requiert une raison
   indépendante de sa présence dans la conversation. Clarifier seulement une
   ambiguïté qui change matériellement la décision.
2. Déduire les propriétés qui pilotent le comportement, les invariants, les
   exceptions justifiées et les inconnues. Conserver les identités nécessaires
   aux références et aux règles documentées. Un nom commercial ou de style
   ne démontre pas une capacité ; une donnée absente ne devient pas une valeur.
3. Proposer la règle et son domaine de validité : une nouvelle entrée compatible
   doit fonctionner sans nouvelle branche dédiée. Préserver les comportements
   spécialisés justifiés. Ne pas inventer un moteur universel, une formule ou
   un simple formulaire libre qui abandonne l'aide métier.
4. Chercher un contre-exemple hors des fixtures de conception et une preuve
   proportionnée : classe de comportement, limite ou interaction à risque.
   Pour la logique, choisir un invariant indépendant de l'implémentation ;
   employer les tests paramétrés ou génératifs existants quand ils conviennent.
   Générer des cas valides, conserver les échecs reproductibles. Pas de test
   par style, de produit cartésien ni de dépendance ajoutée systématiquement.
   Pour l'UX, jouer la décision réelle : des tests de calcul ne valident pas
   la pertinence d'une option ni la compréhension du brasseur.

**Échange ciblé si utile.** Le pilote formule règle, doute et preuve attendue.
Réutiliser l'expert actif ; une Luna peut chercher le contre-exemple en
indépendance pendant le travail local. Astra éclaire l'arbitrage structurant
selon AGENTS.md. Ne pas lancer chacun pour remplir un rôle. Une seconde passe
répond à un désaccord concret, pas à un rituel de consensus ou de surveillance.
Arrêter quand la décision et ses limites sont suffisamment étayées.

Dans le registre existant, garder seulement : **règle / exception ou inconnue /
preuve / limite restante**. Distinguer essai d'agent, test exécuté et validation
utilisateur. Évaluer une modification du skill sur un cas inédit ; ne pas
annoncer de gain mesuré sans comparaison avec le comportement antérieur.

Principes consultés, reformulés pour ce projet :
[brainstorming](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md),
[writing-skills](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md),
[property-based-testing](https://github.com/trailofbits/skills/blob/main/plugins/property-based-testing/skills/property-based-testing/SKILL.md).
Ce skill n'importe ni leur orchestration ni leurs configurations fournisseur.
