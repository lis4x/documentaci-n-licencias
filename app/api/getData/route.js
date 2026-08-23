import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { DATABASES, isAuthorizedForDb } from "../../../lib/databases";

export const revalidate = 0;

// ---------------------------------------------------------------------------
// Caché en memoria por base de datos (dura mientras la instancia de Vercel
// esté "caliente"). Evita pegarle a Google Sheets en cada request si varios
// agentes entran casi al mismo tiempo.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 25 * 1000; // 25 segundos
const cacheByDb = new Map(); // dbId -> { data, timestamp }

// ---------------------------------------------------------------------------
// Rate limiting simple en memoria: máximo N requests por usuario por minuto,
// combinado entre todas las bases (para que no se esquive abriendo varias).
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 20; // requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // por minuto
const requestLog = new Map(); // discordId -> [timestamps]

function isRateLimited(discordId) {
  const now = Date.now();
  const timestamps = (requestLog.get(discordId) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  requestLog.set(discordId, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

function logAccess({ discordId, dbId, status }) {
  console.log(
    JSON.stringify({
      event: "getData_access",
      discordId,
      dbId,
      status, // "ok" | "rate_limited" | "unauthorized" | "forbidden" | "bad_request"
      timestamp: new Date().toISOString(),
    })
  );
}

export async function GET(request) {
  const session = await getServerSession(authOptions);

  const { searchParams } = new URL(request.url);
  const dbId = searchParams.get("db") || "armas"; // default: armas, por compatibilidad

  if (!session) {
    logAccess({ discordId: null, dbId, status: "unauthorized" });
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const dbConfig = DATABASES[dbId];

  if (!dbConfig) {
    logAccess({ discordId: session.discordId, dbId, status: "bad_request" });
    return Response.json({ error: "Base de datos inválida" }, { status: 400 });
  }

  // Chequeo de acceso REAL en el servidor: aunque alguien fuerce la URL con
  // ?db=empresas, si su facción no está en allowedFactions, se lo rechaza acá.
  if (!isAuthorizedForDb(dbConfig, session)) {
    logAccess({ discordId: session.discordId, dbId, status: "forbidden" });
    return Response.json(
      { error: "No tenés permiso para acceder a esta base de datos" },
      { status: 403 }
    );
  }

  if (isRateLimited(session.discordId)) {
    logAccess({ discordId: session.discordId, dbId, status: "rate_limited" });
    return Response.json(
      { error: "Demasiadas solicitudes, esperá un momento." },
      { status: 429 }
    );
  }

  logAccess({ discordId: session.discordId, dbId, status: "ok" });

  // Devuelve la caché de esta base si todavía está fresca.
  const now = Date.now();
  const cached = cacheByDb.get(dbId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return Response.json(cached.data);
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env[dbConfig.sheetIdEnv];
    const range = dbConfig.range || "A1:Z1000";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    cacheByDb.set(dbId, { data: values, timestamp: now });

    return Response.json(values);
  } catch (error) {
    console.error(`Error leyendo Google Sheets (${dbId}):`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
