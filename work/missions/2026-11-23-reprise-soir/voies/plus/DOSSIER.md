# Dossier plus — « D'ailleurs le + affiche étrangement mtn » (23.11 21:40)

Capture : work/missions/2026-11-23-reprise-soir/plaintes/2340-plus.jpg (OUVRE-LA). Sur Bord, en ligne (tour 33 ou 34), le menu + (PlusSheet) ne couvre plus la largeur : panneau décalé à droite (commence vers x≈195 sur 924), voile gris sur la moitié gauche, cartes tronquées.
« mtn » = c'est nouveau : régression d'un des derniers tours. Tags en ligne : en-ligne/2026-11-23-tour31 … tour35. Changements récents touchant Bord et la navigation : fd27f22e5 (T29-4 : DashboardTab.tsx, App.tsx, CreativeLabTab), 616b3aadd (maj-pwa), dffddf028 (frise bord à bord, CSS), 53cf48e91 (fix30).
Code : src/components/navigation/PlusSheet.tsx, navigation.css ; src/ui/calendrier/frise/frise.css (vérifier qu'aucune règle de la frise ne fuit hors du Calendrier).
