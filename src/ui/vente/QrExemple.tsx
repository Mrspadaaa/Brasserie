import React from 'react';

/** Le QR de la maquette v3a : un dessin décoratif qui N'ENCODE RIEN, marqué « QR exemple » par son parent. Jamais imprimé dans un PDF. */
export function QrExemple() {
  return (
    <svg className="cs-qrsvg" width="72" height="72" viewBox="0 0 29 29" aria-label="QR (exemple, sans valeur)" role="img">
      <rect width="29" height="29" fill="#fff" />
      <g fill="#111">
        <path fillRule="evenodd" d="M1 1h7v7H1zM2 2v5h5V2zM3 3h3v3H3zM21 1h7v7h-7zM22 2v5h5V2zM23 3h3v3h-3zM1 21h7v7H1zM2 22v5h5v-5zM3 23h3v3H3z" />
        <path d="M10 1h2v1h-2zM13 1h1v2h-1zM15 2h3v1h-3zM10 3h1v3h-1zM12 4h2v1h-2zM16 4h1v3h-1zM18 5h2v1h-2zM10 9h3v1h-3zM1 10h2v1H1zM4 10h3v1H4zM15 9h1v2h-1zM18 9h2v2h-2zM22 10h3v1h-3zM26 9h2v2h-2zM2 13h1v3H2zM5 12h2v2H5zM8 14h2v1H8zM19 13h2v1h-2zM23 13h1v3h-1zM25 14h3v1h-3zM1 18h3v1H1zM6 17h1v2H6zM9 18h2v1H9zM19 17h3v1h-3zM24 18h2v2h-2zM10 21h2v2h-2zM14 20h1v3h-1zM17 22h3v1h-3zM22 21h1v2h-1zM25 22h3v1h-3zM10 25h3v1h-3zM15 26h2v2h-2zM19 25h1v3h-1zM22 26h3v1h-3zM26 27h2v1h-2zM12 27h1v1h-1z" />
        <rect x="12" y="12" width="5" height="5" />
        <path d="M14 13h1v3h-1zM13 14h3v1h-3z" fill="#fff" />
      </g>
    </svg>
  );
}
