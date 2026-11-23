let pending: Promise<typeof import('./RecipePage')> | undefined;
let prepared: typeof import('./RecipePage') | undefined;
export const preparedRecipePage = () => prepared;
/** One route module for preloading and the actual lazy surface, with retry if
 * background preparation fails before React requests the route. */
export function loadRecipePage() {
  return pending ??= Promise.all([
    import('./RecipePage'),
    // First reports must still work if the connection disappears after the
    // reading page opens. Prepare bundled references, without mounting reports.
    // A failed optional catalogue keeps primary saved data available; its hook
    // retains the catalogue error and permits another load on a later mount.
    import('../ui/hopIndex/guideVarieties').then(module => module.loadGuideVarieties()).catch(() => undefined),
  ]).then(([module]) => { prepared = module; return module; })
    .catch(error => { pending = undefined; throw error; });
}
