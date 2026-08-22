import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { checkUserRoles, refreshDiscordToken } from "../../../../lib/discordAuth";

const RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

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
    maxAge: 60 * 60,
  },

  callbacks: {
    async signIn({ account }) {
      const { authorized } = await checkUserRoles(account.access_token);
      return authorized;
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + (account.expires_in ? account.expires_in * 1000 : 3600 * 1000);
        token.authorized = true;
        token.lastChecked = Date.now();
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
        const { authorized } = await checkUserRoles(token.accessToken);
        token.authorized = authorized;
        token.lastChecked = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (!token.authorized) {
        return null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
