// Valida si el usuario logueado tiene el rol correspondiente en alguno de
// los servidores de las facciones, usando su PROPIO access_token de Discord
// (sin bot, ya que no está permitido agregarlos a estos servidores).
//
// A diferencia de la primera versión, acá NO se recorren todos los
// servidores del usuario (puede estar en decenas de servidores ajenos al
// proyecto) — se consulta DIRECTO cada uno de los servidores de las
// facciones. Es más rápido y evita cortes por rate limit de Discord.
//
// Cada facción puede tener uno O VARIOS roles válidos (por ejemplo,
// "Agente" y "Cúpula" en el mismo server), ya que no siempre comparten
// el mismo rol. Por eso roleIds es un array: alcanza con que el usuario
// tenga CUALQUIERA de esos roles en ese server para quedar autorizado.

const FACTIONS = [
  { name: "Gobierno", guildId: "802996304837476372", roleIds: ["869199672311427082"] },
  { name: "LSPD",     guildId: "798940497430970378", roleIds: ["799005540339941446"] },
  { name: "USSS",     guildId: "882475756989587506", roleIds: ["883117884929376257"] },
  { name: "USMS",     guildId: "972822087393763348", roleIds: ["972822087452459056"] },
  { name: "LSC",      guildId: "845673986268200990", roleIds: ["845681987955982356"] },
  { name: "SASRE",    guildId: "1182089775038087171", roleIds: ["1182089775465906214", "1284620138917924914", "1182121234243264594", "744631426825322606", "1487966432334708817"] },
  { name: "SASPS",    guildId: "845673986268200990", roleIds: ["915086033077538869"] },
  { name: "SAFW",     guildId: "1339703943378505819", roleIds: ["1343365700114317423"] },
  { name: "LSSD",     guildId: "802998227464618034", roleIds: ["909944844472954900", "909944528583151646", "875171537802653697", "809960111081914388"] },
  { name: "SADJ",     guildId: "845675579059863574", roleIds: ["1529522236354986155"] },
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

      const tieneAlgunRol = faction.roleIds.some((roleId) => roles.includes(roleId));

      if (tieneAlgunRol) {
        return { authorized: true, faction: faction.name, guildId: faction.guildId };
      }
    } catch (error) {
      console.error(`checkUserRoles: error consultando ${faction.name} (${faction.guildId}):`, error);
    }
  }

  return { authorized: false };
}

// Chequea si el usuario tiene un rol PUNTUAL en un server puntual —
// independiente de las facciones de arriba. Se usa para permisos más
// finos, como "solo la Agencia dentro de Gobierno puede ver esta base",
// donde no alcanza con pertenecer a la facción en general.
export async function checkGuildRole(accessToken, guildId, roleId) {
  if (!accessToken || !guildId || !roleId) return false;

  try {
    const res = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );

    if (!res.ok) return false;

    const member = await res.json();
    const roles = member.roles || [];
    return roles.includes(roleId);
  } catch (error) {
    console.error(`checkGuildRole: error consultando guild ${guildId}:`, error);
    return false;
  }
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
