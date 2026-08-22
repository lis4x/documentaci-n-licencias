import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

// LISTADO DE ROLES PERMITIDOS (, USSS, USMS, LSC, LSPD)
const ALLOWED_ROLE_IDS = [
  "883117884929376257", // USSS
  "972822087452459056", // USMS
  "845681987955982356", // LSC
  "799005540339941446", // LSPD
];

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      try {
        const token = account.access_token;

        // 1. Obtener la lista de todos los servidores en los que está el usuario
        const guildsResponse = await fetch("https://discord.com/api/v10/users/@me/guilds", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!guildsResponse.ok) return false;

        const userGuilds = await guildsResponse.json();

        // 2. Recorrer cada servidor para comprobar si posee alguno de los roles permitidos
        for (const guild of userGuilds) {
          const memberResponse = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${guild.id}/member`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (memberResponse.ok) {
            const memberData = await memberResponse.json();
            const userRoles = memberData.roles || [];

            // Verifica si el usuario tiene al menos UNO de los IDs de rol autorizados
            const hasAuthorizedRole = userRoles.some((roleId) =>
              ALLOWED_ROLE_IDS.includes(roleId)
            );

            if (hasAuthorizedRole) {
              return true; // Acceso concedido inmediatamente
            }
          }
        }

        // Si no se encontró ninguno de los roles en ningún servidor
        return false;
      } catch (error) {
        console.error("Error al validar roles de Discord:", error);
        return false;
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
