// Configuración central de todas las bases de datos disponibles en el panel.
//
// Cada entrada define:
// - id: identificador usado en la URL/query (?db=armas)
// - label: nombre visible en el panel
// - sheetIdEnv: nombre de la variable de entorno en Vercel que tiene el
//   spreadsheetId de ESA hoja en particular
// - range / headerRow: dónde leer y dónde están los encabezados reales
//
// Para el control de acceso hay DOS formas, según qué tan fino necesites:
//
// - allowedFactions: [...] → alcanza con que el usuario pertenezca a
//   CUALQUIERA de esas facciones (chequeado en el login general).
//
// - requiredRole: { guildId, roleId } → en vez de la facción completa,
//   exige un ROL PUNTUAL dentro de un server puntual. Útil cuando dentro
//   de una misma facción (ej. Gobierno) solo un área específica (ej. la
//   Agencia) tiene que ver esa base, no todos los miembros de Gobierno.
//   Si una base tiene requiredRole, ESO manda — allowedFactions se ignora.

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
    // Solo quienes tengan el rol puntual de la Agencia dentro del
    // server de Gobierno — no cualquiera con rol de Gobierno en general.
    requiredRole: {
      guildId: "802996304837476372", // server de Gobierno
      roleId: "1356538219323330601", // rol de la Agencia
    },
  },
};

// Decide si una sesión (faction + extraAccess) tiene permiso para una base.
export function isAuthorizedForDb(db, session) {
  if (!session) return false;

  if (db.requiredRole) {
    return !!session.extraAccess?.[db.id];
  }

  return db.allowedFactions?.includes(session.faction) ?? false;
}

export function getDatabasesForSession(session) {
  return Object.values(DATABASES).filter((db) => isAuthorizedForDb(db, session));
}
