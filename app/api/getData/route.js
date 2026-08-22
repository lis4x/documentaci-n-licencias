import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Reemplaza saltos de línea codificados de las variables de Vercel
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ID extraído de tu enlace
    const spreadsheetId = "1M30awi9M5AGlz4cn8uIFh-pqBhLezHuxUGo92XLe94g";

    // Si tu pestaña tiene un nombre específico (ejemplo: 'Hoja 1'), ponlo aquí antes del !
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
