import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export const revalidate = 0;

export async function GET() {
  // 🔒 Chequeo server-side. Esto es lo que impide que alguien le pegue
  // directo a /api/getData (con curl, Postman, o mirando el Network tab
  // en F12) sin estar logueado y sin tener un rol autorizado.
  // getServerSession lee la cookie de sesión (httpOnly, no accesible desde
  // JS del navegador) y corre los mismos callbacks de authOptions, incluida
  // la revalidación de rol.
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A1:Z1000",
    });

    return Response.json(response.data.values || []);
  } catch (error) {
    console.error("Error leyendo Google Sheets:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
