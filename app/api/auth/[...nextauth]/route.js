import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { isUserAuthorized } from "../../../../lib/discordAuth";

// Cada cuánto se vuelve a chequear el rol en Discord mientras la sesión
// sigue "viva" en el navegador (independiente del maxAge de la sesión).
const RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      // Ya no necesitamos "guilds" ni "guilds.members.read": los roles se
      // consultan server-side con el bot token, no con el token del usuario.
      authorization: { params: { scope: "identify" } },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // la sesión expira a la hora -> obliga a re-loguear/revalidar
  },

  callbacks: {
    // Se ejecuta una sola vez, en el momento del login.
    async signIn({ profile }) {
      const { authorized } = await isUserAuthorized(profile.id);
      return authorized; // si es false, NextAuth rechaza el login
    },

    // Se ejecuta al crear el JWT (login) y cada vez que se accede a la sesión.
    async jwt({ token, profile, account }) {
      if (account && profile) {
        // Login inicial: ya pasó signIn, guardamos su id de Discord.
        token.discordId = profile.id;
        token.authorized = true;
        token.lastChecked = Date.now();
        return token;
      }

      if (token.discordId) {
        const stale =
          !token.lastChecked || Date.now() - token.lastChecked > RECHECK_INTERVAL_MS;

        if (stale) {
          const { authorized } = await isUserAuthorized(token.discordId);
          token.authorized = authorized;
          token.lastChecked = Date.now();
        }
      }

      return token;
    },

    // Se ejecuta cada vez que el cliente pide la sesión (useSession, getServerSession).
    async session({ session, token }) {
      if (!token.authorized) {
        // Fuerza a que se lo trate como no autenticado en el próximo chequeo
        // del cliente (useSession detecta esto y redirige a login).
        return null;
      }
      session.discordId = token.discordId;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
