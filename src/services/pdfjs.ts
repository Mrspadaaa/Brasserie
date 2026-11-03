// pdf.js et son worker, servis depuis les fichiers de l'app (import `?url` de Vite) et chargés à la demande (import dynamique) : jamais dans le
// morceau principal, jamais d'un CDN. Partagé par la lecture du QR (`qrLecture.ts`) et la découpe des longues pièces (`decoupe.ts`, D380).
export async function chargerPdfjs(): Promise<any> {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}
