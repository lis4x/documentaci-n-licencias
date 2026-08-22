import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const USMS_ROLE_ID = process.env.DISCORD_ROLE_ID;

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify guilds.members.read" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      try {
        // Consultar a la API de Discord si el usuario está en el servidor y tiene el rol
        const response = await fetch(`https://discord.com/api/v10/users/@me/guilds/${GUILD_ID}/member`, {
          headers: { Authorization: `Bearer ${token.accessToken}` },
        });
        
        if (response.ok) {
          const member = await response.json();
          token.hasRole = member.roles.includes(USMS_ROLE_ID);
        } else {
          token.hasRole = false;
        }
      } catch (error) {
        token.hasRole = false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.hasRole = token.hasRole;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
