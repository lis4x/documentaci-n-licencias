import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export const revalidate = 0;

// ---------------------------------------------------------------------------
// Caché en memoria (dura mientras la instancia de Vercel esté "caliente").
// Evita pegarle a Google Sheets en cada request si varios agentes entran
// casi al mismo tiempo. No es caché distribuida entre instancias, pero
// reduce muchísimo la carga real.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 25 * 1000; // 25 segundos
let cache = { data: null, timestamp: 0 };

// ---------------------------------------------------------------------------
// Rate limiting simple en memoria: máximo N requests por usuario por minuto.
// Mismo caveat que la caché: es por instancia, no global. Igual sirve como
// primera barrera contra scraping accidental o intencional.
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

// ---------------------------------------------------------------------------
// Log de auditoría: queda registrado en los Logs de Vercel (Runtime Logs).
// Si más adelante querés guardarlo en algún lado permanente (otra hoja de
// Sheets, una base de datos, etc.), este es el lugar para mandarlo también
// para allá.
// ---------------------------------------------------------------------------
function logAccess({ discordId, status }) {
  console.log(
    JSON.stringify({
      event: "getData_access",
      discordId,
      status, // "ok" | "rate_limited" | "unauthorized"
      timestamp: new Date().toISOString(),
    })
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    logAccess({ discordId: null, status: "unauthorized" });
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isRateLimited(session.discordId)) {
    logAccess({ discordId: session.discordId, status: "rate_limited" });
    return Response.json(
      { error: "Demasiadas solicitudes, esperá un momento." },
      { status: 429 }
    );
  }

  logAccess({ discordId: session.discordId, status: "ok" });

  // Devuelve la caché si todavía está fresca, sin pegarle a Google.
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    return Response.json(cache.data);
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
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    // Ajustá GOOGLE_SHEET_RANGE al rango real que usás (ej: "A1:L500").
    // Si no está definida la variable, cae en A1:Z1000 como antes.
    const range = process.env.GOOGLE_SHEET_RANGE || "A1:Z1000";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    cache = { data: values, timestamp: now };

    return Response.json(values);
  } catch (error) {
    console.error("Error leyendo Google Sheets:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
