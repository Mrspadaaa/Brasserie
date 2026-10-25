// Cache borné (#164) : au plus `borne` entrées, les moins récemment lues sortent d'abord. Algorithme à deux générations
// (celui de quick-lru) : une lecture coûte un Map.get ; quand la génération courante atteint borne/2, elle devient
// l'ancienne et l'ancienne est jetée ; une entrée lue dans l'ancienne remonte dans la courante. Clé : une chaîne stable
// (le contenu, jamais l'identité d'un objet).
export class Lru<V> {
  private courante = new Map<string, V>();
  private ancienne = new Map<string, V>();
  private readonly moitie: number;
  constructor(readonly borne: number) {
    if (!(borne >= 2)) throw Error(`Borne de cache invalide : ${borne}`);
    this.moitie = Math.floor(borne / 2);
  }
  /** Entrées gardées (au plus `borne`). */
  get size(): number {
    let n = this.courante.size;
    for (const k of this.ancienne.keys()) if (!this.courante.has(k)) n++;
    return n;
  }
  has(k: string): boolean { return this.courante.has(k) || this.ancienne.has(k); }
  /** La valeur (remontée dans la génération courante si elle était dans l'ancienne) ; undefined si absente. */
  get(k: string): V | undefined {
    const v = this.courante.get(k);
    if (v !== undefined || this.courante.has(k)) return v;
    if (!this.ancienne.has(k)) return undefined;
    const w = this.ancienne.get(k) as V;
    this.ancienne.delete(k);
    this.poser(k, w);
    return w;
  }
  set(k: string, v: V): this {
    if (this.courante.has(k)) this.courante.set(k, v);
    else { this.ancienne.delete(k); this.poser(k, v); }
    return this;
  }
  private poser(k: string, v: V): void {
    this.courante.set(k, v);
    if (this.courante.size >= this.moitie) { this.ancienne = this.courante; this.courante = new Map(); }
  }
  /** La valeur en cache, sinon calculée par f et mise en cache. */
  obtenir(k: string, f: () => V): V {
    const v = this.get(k);
    if (v !== undefined || this.has(k)) return v as V;
    const r = f();
    this.set(k, r);
    return r;
  }
  clear(): void { this.courante.clear(); this.ancienne.clear(); }
}

/** Borne d'un cache indexé par houblon : quatre fois les houblons connus du moteur (catalogue et stock), 1 024 au moins.
 * Un classement (substitutes) lit chaque houblon une fois : la borne (deux générations de borne/2) ne doit jamais
 * l'obliger à recalculer. */
export const borneHoublons = (n: number) => Math.max(1024, 4 * n);
