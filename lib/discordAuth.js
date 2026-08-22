// Valida si el usuario logueado tiene alguno de los roles permitidos,
// usando su PROPIO access_token de Discord (no un bot, ya que no está
// permitido agregar bots a estos servidores).
//
// Recorre los servidores en los que está el usuario y, para cada uno,
// consulta sus roles. Esta misma función se usa tanto en el login como
// en la revalidación periódica (ver RECHECK_INTERVAL_MS en el archivo
// de NextAuth), así que si le sacan el rol, en la próxima revalidación
// se corta el acceso.

const ALLOWED_ROLE_IDS = [
  "869199672311427082", // Gobierno
  "883117884929376257", // USSS
  "972822087452459056", // USMS
  "845681987955982356", // LSC
  "799005540339941446", // LSPD
];

export async function checkUserRoles(accessToken) {
  if (!accessToken) return { authorized: false };

  try {
    const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!guildsRes.ok) return { authorized: false };

    const guilds = await guildsRes.json();

    for (const guild of guilds) {
      try {
        const memberRes = await fetch(
          `https://discord.com/api/v10/users/@me/guilds/${guild.id}/member`,
          { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
        );

        if (!memberRes.ok) continue;

        const member = await memberRes.json();
        const roles = member.roles || [];
        const matched = roles.filter((r) => ALLOWED_ROLE_IDS.includes(r));

        if (matched.length > 0) {
          return { authorized: true, guildId: guild.id, roles: matched };
        }
      } catch (innerError) {
        console.error(`checkUserRoles: error en guild ${guild.id}:`, innerError);
      }
    }

    return { authorized: false };
  } catch (error) {
    console.error("checkUserRoles: error general:", error);
    return { authorized: false };
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
