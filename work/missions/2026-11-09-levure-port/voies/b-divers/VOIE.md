# Voie b-divers — bugs ouverts, zone « Finances, clients, bord, réglages, autres » (mission 2026-11-09-levure-port)
- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Liste : `b-divers/BUGS-b-divers.md` (78 bugs). Règles : `../REGLES-BUGS.md` (à lire en premier, à suivre telles quelles).
- Possède : src/components/tabs/FinancesTab.tsx, ClientsTab.tsx, DashboardTab.tsx, src/components/Header.tsx, les réglages (src/ui/settings*/**, src/components/Settings*), src/ui/clients/**, et le fichier propre à un écran de ta liste qui n'est dans aucune autre voie ; les tests de ces fichiers ; `work/missions/2026-11-09-levure-port/voies/b-divers/**`.
- Port du serveur de développement : 5653.
- La ligne RL-14 (alerte IBAN à l'ouverture des Réglages › Fiscalité) est dans ta liste : diagnostic d'abord, sans écrire l'IBAN en clair nulle part.
