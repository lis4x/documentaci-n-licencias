// Valida si el usuario logueado tiene el rol correspondiente en alguno de
// los servidores de las facciones, usando su PROPIO access_token de Discord
// (sin bot, ya que no está permitido agregarlos a estos servidores).
//
// A diferencia de la primera versión, acá NO se recorren todos los
// servidores del usuario (puede estar en decenas de servidores ajenos al
// proyecto) — se consulta DIRECTO cada uno de los 5 servidores de las
// facciones. Es más rápido y evita cortes por rate limit de Discord.

const FACTIONS = [
 
  { name: "LSPD",     guildId: "798940497430970378", roleId: "799005540339941446" },
  { name: "USSS",     guildId: "882475756989587506", roleId: "883117884929376257" },
  { name: "USMS",     guildId: "972822087393763348", roleId: "972822087452459056" },
  { name: "LSC",      guildId: "845673986268200990", roleId: "845681987955982356" },
];

export async function checkUserRoles(accessToken) {
  if (!accessToken) return { authorized: false };

  for (const faction of FACTIONS) {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${faction.guildId}/member`,
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
      );

      if (!res.ok) continue;

      const member = await res.json();
      const roles = member.roles || [];

      if (roles.includes(faction.roleId)) {
        return { authorized: true, faction: faction.name, guildId: faction.guildId };
      }
    } catch (error) {
      console.error(`checkUserRoles: error consultando ${faction.name} (${faction.guildId}):`, error);
    }
  }

  return { authorized: false };
}

export async function refreshDiscordToken(refreshToken) {
  if (!refreshToken) return null;

  try {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const res = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error("refreshDiscordToken: error:", error);
    return null;
  }
}
