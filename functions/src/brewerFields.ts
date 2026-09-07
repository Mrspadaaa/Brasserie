const stable = (v: any): string =>
  JSON.stringify(v, (_, value) =>
    value && !Array.isArray(value) && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
      : value
  );
export const sameField = (a: any, b: any) => stable(a ?? null) === stable(b ?? null);
