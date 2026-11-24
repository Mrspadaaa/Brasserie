import fs from 'node:fs';
/** Remplacements exacts, fins de ligne gardées (certains fichiers sont en CRLF) ; split/join : jamais de `$&` interprété. */
export const R = (f, pairs) => {
  let s = fs.readFileSync(f, 'utf8');
  const crlf = s.includes('\r\n');
  if (crlf) s = s.split('\r\n').join('\n');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(f + ' : ' + a.slice(0, 70));
    s = s.split(a).join(b);
  }
  if (crlf) s = s.split('\n').join('\r\n');
  fs.writeFileSync(f, s);
};
