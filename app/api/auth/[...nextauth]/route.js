import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { checkUserRoles, refreshDiscordToken } from "../../../../lib/discordAuth";

const RECHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hora (coincide con maxAge de la sesión)

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify guilds guilds.members.read" } },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hora
  },

  callbacks: {
    async signIn({ account }) {
      const result = await checkUserRoles(account.access_token);
      return result.authorized;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + (account.expires_in ? account.expires_in * 1000 : 3600 * 1000);

        const result = await checkUserRoles(account.access_token);
        token.authorized = result.authorized;
        token.faction = result.faction ?? null;
        token.lastChecked = Date.now();

        if (profile?.id) {
          token.discordId = profile.id;
        }
        return token;
      }

      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires - 60_000) {
        const refreshed = await refreshDiscordToken(token.refreshToken);
        if (refreshed) {
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
          token.accessTokenExpires = Date.now() + refreshed.expires_in * 1000;
        } else {
          token.authorized = false;
          return token;
        }
      }

      const stale =
        !token.lastChecked || Date.now() - token.lastChecked > RECHECK_INTERVAL_MS;

      if (stale) {
        const result = await checkUserRoles(token.accessToken);
        token.authorized = result.authorized;
        token.faction = result.faction ?? null;
        token.lastChecked = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (!token.authorized) {
        return null;
      }
      session.discordId = token.discordId;
      session.faction = token.faction;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
