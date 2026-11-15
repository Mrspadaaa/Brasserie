/*
 * Icônes du compagnon : un nom de la maquette p2a (`etat.html`) → une icône lucide. Rien d'autre.
 * Props : aucune (table seule). `Icone` (parts.tsx) la lit ; `iconeQuestion` (derive.ts) choisit le nom d'une tuile.
 */
import {
  ArrowLeft, ArrowUpRight, Bell, BookOpen, Calculator, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, Clock,
  Copy, CornerDownRight, Droplet, Gauge, Leaf, Lock, MessagesSquare, NotebookPen, Paperclip, Pause, Pencil, Plus, Receipt,
  RotateCcw, Send, ServerOff, ShieldCheck, ShoppingBasket, Smartphone, Snowflake, Thermometer, TriangleAlert, TrendingUp,
  Wallet, WifiOff, Wrench, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ICONES = {
  alerte: TriangleAlert,
  bas: ChevronDown,
  bouclier: ShieldCheck,
  calcul: Calculator,
  calendrier: CalendarDays,
  cloche: Bell,
  crayon: Pencil,
  doublon: Copy,
  droite: ChevronRight,
  envoyer: Send,
  facture: Receipt,
  feuille: Leaf,
  fil: MessagesSquare,
  flocon: Snowflake,
  fleche: CornerDownRight,
  goutte: Droplet,
  graphe: TrendingUp,
  horloge: Clock,
  horsligne: WifiOff,
  journal: NotebookPen,
  livre: BookOpen,
  ok: Check,
  outil: Wrench,
  panier: ShoppingBasket,
  pause: Pause,
  plus: Plus,
  portefeuille: Wallet,
  pression: Gauge,
  relu: CheckCheck,
  retour: ArrowLeft,
  serveur: ServerOff,
  sortie: ArrowUpRight,
  telephone: Smartphone,
  thermo: Thermometer,
  trombone: Paperclip,
  verrou: Lock,
  x: X,
  zero: RotateCcw
} as const satisfies Record<string, LucideIcon>;

export type NomIcone = keyof typeof ICONES;

/** Icône d'une tuile de question (`iconeQuestion` de derive.ts) → nom de la table. */
export const ICONE_DE_QUESTION: Record<string, NomIcone> = {
  pression: 'pression',
  densite: 'goutte',
  houblon: 'feuille',
  calendrier: 'calendrier',
  depenses: 'graphe',
  achat: 'panier',
  annee: 'livre',
  materiel: 'outil',
  defaut: 'fleche'
};

/** Icône d'une pastille « Je lis » (`sourcesLues` de derive.ts) ; un nom inconnu prend le livre. */
export const ICONE_DE_SOURCE: Record<string, NomIcone> = {
  Recette: 'livre',
  Brassin: 'thermo',
  Journal: 'journal',
  Matériel: 'outil',
  Opérations: 'facture',
  Pièces: 'trombone',
  Brouillon: 'crayon',
  Écran: 'livre'
};
