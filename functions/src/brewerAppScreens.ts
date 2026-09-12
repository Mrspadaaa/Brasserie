/** Shared navigation labels; no Firebase code or private configuration. */
export const BREWER_APP_SCREENS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  finances: 'Finances',
  'production-batches': 'Brassins',
  'production-recipes': 'Recettes',
  'production-lab': 'Atelier R&D',
  'production-scaler': 'Mise à l’échelle',
  'stocks-stock': 'Stocks',
  'stocks-courses': 'Liste de courses',
  'stocks-futs': 'Fûts',
  'stocks-materiel': 'Matériel',
  'stocks-hops': 'Index houblon',
  'clients-crm': 'Clients',
  'clients-ofdf': 'Déclaration de bière',
  'clients-tarifs': 'Tarifs'
};

export function brewerAppScreen(tab: string, subTab?: string | null) {
  const defaults: Record<string, string> = { production: 'batches', stocks: 'stock', clients: 'crm' };
  const candidate = defaults[tab] ? `${tab}-${subTab || defaults[tab]}` : tab;
  const id = Object.prototype.hasOwnProperty.call(BREWER_APP_SCREENS, candidate)
    ? candidate
    : defaults[tab] ? `${tab}-${defaults[tab]}` : 'dashboard';
  return { scope: { kind: 'app' as const, id }, label: BREWER_APP_SCREENS[id], phase: BREWER_APP_SCREENS[id] };
}
