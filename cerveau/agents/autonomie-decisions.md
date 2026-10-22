---
name: autonomie-decisions
description: L'utilisateur veut le moins d'intervention possible ; les décisions courantes sont déléguées à Claude ou à une session arbitre, pas posées en questions.
type: agents
maj: 2026-10-22
sources: mémoire locale affinee-autonomie-decisions.md
---

L'utilisateur, 2026-10-08 : « Ça va pas du tout, si je dois répondre à chaque question... délègue ça à toi ou à une autre session. » Il a aussi demandé « le moins d'intervention possible de ma part », avec un vrai système de validation. Ce système comprend un validateur UX/UI dédié (Fable 5.1 max ou Opus neuf) qui remplace son coup d'œil.

**Pourquoi** : les questions à choix bloquent les sessions autonomes et le dérangent. Il a accepté l'option recommandée et prudente à chaque fois.

**Comment l'appliquer** : trancher selon PRODUCT.md, DESIGN.md, les issues, le code et ses choix connus, en prenant par défaut l'option prudente et réversible. Sinon, faire trancher par une session arbitre neuve, journaliser, puis continuer. Ne garder pour lui que les gestes irréversibles ou externes, regroupés et sans bloquer : déploiement, push/PR/merge, données réelles, Gemini facturé en production, suppression, comptes et réglages.

Quota : il veut qu'on l'optimise, sans perte de qualité ni plafond de contexte (refusé le 2026-10-08 : « un grand contexte peut être utile »). Économies acceptées : aucun sondage, Haiku pour le travail de masse, pas de journal brut entier, pas de travail en double, et des pauses aux paliers.

Voir (leçon L11) et [[agents-sans-openai]].
