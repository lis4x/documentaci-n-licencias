// Configuración central de todas las bases de datos disponibles en el panel.
//
// Cada entrada define:
// - id: identificador usado en la URL/query (?db=armas)
// - label: nombre visible en el panel
// - sheetIdEnv: nombre de la variable de entorno en Vercel que tiene el
//   spreadsheetId de ESA hoja en particular (cada base vive en un Google
//   Sheet distinto)
// - range: rango de celdas a leer (opcional, default A1:Z1000)
// - headerRow: en qué fila (0 = la primera) están los encabezados reales
//   de la tabla. Cada hoja puede tener una cantidad distinta de filas de
//   título/espaciado antes de llegar a los encabezados reales.
//   Ej: si la fila 1 es un título y la fila 2 son los encabezados,
//   headerRow = 1 (índice 0-based). Default: 1 (compatibilidad con Armas).
// - allowedFactions: qué facciones (de las definidas en discordAuth.js)
//   pueden ver esta base. El chequeo se hace en el servidor (getData),
//   no solo ocultando el botón en el frontend.

export const DATABASES = {
  armas: {
    id: "armas",
    label: "Licencias de Armas",
    sheetIdEnv: "GOOGLE_SHEET_ID_ARMAS",
    range: "A1:Z1000",
    headerRow: 1,
    allowedFactions: [
      "Gobierno",
      "LSPD",
      "USSS",
      "USMS",
      "LSC",
      "SASRE",
      "SASPS",
      "SAFW",
      "LSSD",
    ],
  },
  empresas: {
    id: "empresas",
    label: "Empresas - Certificado RES",
    sheetIdEnv: "GOOGLE_SHEET_ID_EMPRESAS",
    range: "B1:G1000",
    headerRow: 2,
    // Solo Gobierno tiene que ver esta base
    allowedFactions: ["Gobierno"],
  },
};

export function getDatabasesForFaction(faction) {
  return Object.values(DATABASES).filter((db) =>
    db.allowedFactions.includes(faction)
  );
}
