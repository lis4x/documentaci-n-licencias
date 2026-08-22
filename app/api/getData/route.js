import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    // Cambia esto por el ID de tu Google Sheet real y el nombre de tu pestaña
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Hoja1!A1:Z100", 
    });

    return NextResponse.json(response.data.values || []);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer la base de datos" }, { status: 500 });
  }
}
