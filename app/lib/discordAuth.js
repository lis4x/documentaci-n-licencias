
// Valida si un usuario de Discord tiene alguno de los roles permitidos,
// consultando directamente a la API de Discord con el BOT TOKEN.
//
// Ventaja frente al método anterior (usar el access_token del usuario):
// - No depende de que el usuario tenga el scope "guilds.members.read" ni de
//   refrescar su token cuando expira.
// - Es una fuente de verdad en tiempo real: si le sacan el rol en Discord,
//   la próxima vez que se revalide (ver RECHECK_INTERVAL_MS en el archivo
//   de NextAuth) va a dejar de estar autorizado, sin importar si su sesión
//   del navegador sigue "viva".
//
// Requisitos:
// - El bot debe estar agregado a cada servidor listado en DISCORD_GUILD_IDS.
// - En el Discord Developer Portal, en el bot, hay que activar el intent
//   "SERVER MEMBERS INTENT" (Bot > Privileged Gateway Intents).

const ALLOWED_ROLE_IDS = [
  "869199672311427082", // Gobierno
  "883117884929376257", // USSS
  "972822087452459056", // USMS
  "845681987955982356", // LSC
  "799005540339941446", // LSPD
];

function getGuildIds() {
  return (process.env.DISCORD_GUILD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Revisa, servidor por servidor, si el usuario tiene algún rol autorizado.
 * @param {string} discordUserId - ID de Discord del usuario (profile.id / token.discordId)
 * @returns {Promise<{authorized: boolean, guildId?: string, roles?: string[]}>}
 */
export async function isUserAuthorized(discordUserId) {
  const guildIds = getGuildIds();
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!discordUserId || guildIds.length === 0 || !botToken) {
    console.error("isUserAuthorized: falta discordUserId, DISCORD_GUILD_IDS o DISCORD_BOT_TOKEN");
    return { authorized: false };
  }

  for (const guildId of guildIds) {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
          // Evita cachés intermedias raras en Vercel
          cache: "no-store",
        }
      );

      // 404 = el usuario no está en ese servidor. No es un error, seguimos con el siguiente.
      if (!res.ok) continue;

      const member = await res.json();
      const roles = member.roles || [];
      const matched = roles.filter((r) => ALLOWED_ROLE_IDS.includes(r));

      if (matched.length > 0) {
        return { authorized: true, guildId, roles: matched };
      }
    } catch (error) {
      console.error(`isUserAuthorized: error consultando guild ${guildId}:`, error);
      // seguimos probando con los demás servidores
    }
  }

  return { authorized: false };
}
