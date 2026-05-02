import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { gql, ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { cookies } from "next/headers";
import { FBLOGIN, LOGIN, LOGOUT_MUTATION } from "../app/components/graphql/mutation";

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_SERVER_LINK,
    credentials: "include",
  }),
  cache: new InMemoryCache(),
  ssrMode: true,
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    provider?: string;
    serverToken?: string;
    error?: string;
  }

  interface JWT {
    accessToken?: string;
    provider?: string;
    serverToken?: string;
    error?: string;
    userId?: string;
    tokenUpdatedAt?: number;
  }

  interface User {
    serverToken?: string;
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: { params: { scope: "email,public_profile" } },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 [Authorize] Credentials login attempt:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const { data } = await client.mutate({
            mutation: LOGIN,
            variables: {
              input: {
                email: credentials.email,
                password: credentials.password,
              },
            },
          });
          
          if (data?.login?.token) {
            console.log("✅ [Authorize] Token received");
            return {
              id: credentials.email,
              email: credentials.email,
              serverToken: data.login.token,
            };
          } else {
            throw new Error(data?.login?.statusText || "Login failed");
          }
        } catch (error: any) {
          console.error("❌ [Authorize] Login error:", error.message);
          throw new Error(error.message || "Login failed");
        }
      }
    })
  ],

  secret: process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32
      ? process.env.NEXTAUTH_SECRET
      : Buffer.from(
          process.env.NEXTAUTH_SECRET ||
            "default-fallback-secret-32-chars-long"
        )
          .toString("base64")
          .slice(0, 32),

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      console.log("\n🔄 [JWT] ========== START ==========");
      console.log("🔄 [JWT] Trigger:", trigger || "initial sign in");
      
      // Safe logging of token
      const tokenStr = typeof token.serverToken === 'string' ? token.serverToken : 'not a string';
      console.log("🔄 [JWT] Has token:", !!token.serverToken);
      if (tokenStr && tokenStr !== 'not a string') {
        console.log("🔄 [JWT] Token preview:", tokenStr.substring(0, 30) + "...");
      }
      
      // Handle session update (when update() is called from client)
      if (trigger === "update") {
        console.log("🔄 [JWT] Session update triggered!");
        
        if (session?.serverToken && typeof session.serverToken === 'string') {
          console.log("✅ [JWT] New serverToken received in update!");
          console.log("✅ [JWT] Updating token...");
          token.serverToken = session.serverToken;
          token.tokenUpdatedAt = Date.now();
          console.log("✅ [JWT] Token updated at:", new Date(token.tokenUpdatedAt).toISOString());
        }
      }
      
      // Initial sign in with Facebook
      if (account?.provider === "facebook") {
        console.log("📘 [JWT] Facebook account detected");
        token.accessToken = account.access_token;
        token.provider = account.provider;

        const token_en = account.access_token?.toString() || "";
        
        try {
          const { data } = await client.mutate({
            mutation: FBLOGIN,
            variables: {
              input: {
                idToken: token_en,
              },
            },
          });
          
          if (data?.loginWithFacebook?.token) {
            console.log("✅ [JWT] Server token received from Facebook");
            token.serverToken = data.loginWithFacebook.token;
            token.tokenUpdatedAt = Date.now();
          } else {
            console.log("❌ [JWT] No token received");
            token.error = "Authentication failed";
          }
        } catch (err) {
          console.error("❌ [JWT] GraphQL login error:", err);
          token.error = "Authentication failed";
        }
      } 
      // Initial sign in with Credentials
      else if (user && user.serverToken && trigger !== "update") {
        console.log("🔐 [JWT] Credentials login detected");
        token.provider = "credentials";
        token.serverToken = user.serverToken;
        token.userId = user.id;
        token.tokenUpdatedAt = Date.now();
        console.log("✅ [JWT] Token stored");
      }
      
      console.log("🔄 [JWT] Final - Has token:", !!token.serverToken);
      console.log("🔄 [JWT] ========== END ==========\n");
      
      return token;
    },

    async session({ session, token }) {
      console.log("\n💬 [Session] ========== START ==========");
      console.log("💬 [Session] Has token in token:", !!token.serverToken);
      
      if (token) {
        const oldToken = session.serverToken;
        session.accessToken = token.accessToken as string | undefined;
        session.provider = token.provider as string | undefined;
        session.serverToken = token.serverToken as string | undefined;
        session.error = token.error as string | undefined;
        
        if (oldToken !== session.serverToken && session.serverToken) {
          console.log("✅ [Session] Token has been UPDATED!");
        } else if (session.serverToken) {
          console.log("ℹ️ [Session] Token unchanged");
        }
      }
      
      console.log("💬 [Session] Has token in session:", !!session.serverToken);
      console.log("💬 [Session] ========== END ==========\n");
      
      return session;
    },

    async signIn({ user, account, profile }) {
      console.log("🚪 [SignIn] Account provider:", account?.provider);
      return true;
    },
  },
  
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: false,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  
  events: {
    async signOut({ token, session }) {
      console.log("🚪 [SignOut] User signing out");
      
      try {
        if (token?.serverToken && typeof token.serverToken === 'string') {
          console.log("🚪 [SignOut] Calling server logout");
          await client.mutate({
            mutation: LOGOUT_MUTATION,
            context: {
              headers: {
                Authorization: `Bearer ${token.serverToken}`,
              },
            },
          });
        }
        
        const cookieStore = await cookies();
        cookieStore.delete('auth-token');
        console.log("✅ [SignOut] Complete");
      } catch (error) {
        console.error("❌ [SignOut] Error:", error);
      }
    },
  },

  pages: {
    signOut: '/auth/signout',
  },

  debug: process.env.NODE_ENV !== "production",
  
  logger: {
    error(code, metadata) {
      console.error("❌ [NextAuth Error]:", code);
    },
    warn(code) {
      console.warn("⚠️ [NextAuth Warning]:", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV !== "production") {
        console.log("🐛 [NextAuth Debug]:", code);
      }
    }
  }
};
