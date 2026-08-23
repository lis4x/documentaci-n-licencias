// Configuración central de todas las bases de datos disponibles en el panel.
//
// Cada entrada define:
// - id: identificador usado en la URL/query (?db=armas)
// - label: nombre visible en el panel
// - sheetIdEnv: nombre de la variable de entorno en Vercel que tiene el
//   spreadsheetId de ESA hoja en particular (cada base vive en un Google
//   Sheet distinto)
// - range: rango de celdas a leer (opcional, default A1:Z1000)
// - allowedFactions: qué facciones (de las definidas en discordAuth.js)
//   pueden ver esta base. El chequeo se hace en el servidor (getData),
//   no solo ocultando el botón en el frontend.
//
// Para agregar una base nueva en el futuro: sumar una entrada acá,
// crear el Sheet, compartirlo con el service account como Lector, y
// agregar la env var correspondiente en Vercel. No hace falta tocar
// más código.

export const DATABASES = {
  armas: {
    id: "armas",
    label: "Licencias de Armas",
    sheetIdEnv: "GOOGLE_SHEET_ID_ARMAS",
    range: "A1:Z1000",
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
    range: "A1:Z1000",
    // Solo Gobierno tiene que ver esta base
    allowedFactions: ["Gobierno"],
  },
};

export function getDatabasesForFaction(faction) {
  return Object.values(DATABASES).filter((db) =>
    db.allowedFactions.includes(faction)
  );
}
