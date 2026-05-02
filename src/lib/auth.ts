import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { NextResponse } from "next/server";
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
    tokenUpdatedAt?: number; // Track when token was last updated
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
          
          console.log("🔐 [Authorize] Login response:", JSON.stringify(data?.login, null, 2));
          
          if (data?.login?.token) {
            console.log("✅ [Authorize] Token received, length:", data.login.token.length);
            console.log("✅ [Authorize] Token preview:", data.login.token.substring(0, 50) + "...");
            
            return {
              id: credentials.email,
              email: credentials.email,
              serverToken: data.login.token,
            };
          } else {
            throw new Error(data?.login.statusText || "Login failed");
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
      console.log("\n🔄 [JWT Callback] ========== START ==========");
      console.log("🔄 [JWT] Trigger:", trigger || "initial sign in");
      console.log("🔄 [JWT] Current token before changes:", {
        hasServerToken: !!token.serverToken,
        serverTokenPreview: token.serverToken ? token.serverToken.substring(0, 50) + "..." : "none",
        provider: token.provider,
        tokenUpdatedAt: token.tokenUpdatedAt ? new Date(token.tokenUpdatedAt).toISOString() : "never",
        error: token.error
      });
      
      // Handle session update (when update() is called from client)
      if (trigger === "update") {
        console.log("🔄 [JWT] Session update triggered!");
        console.log("🔄 [JWT] Session data received:", JSON.stringify(session, null, 2));
        
        if (session?.serverToken) {
          console.log("✅ [JWT] New serverToken received in update!");
          console.log("✅ [JWT] Old token preview:", token.serverToken?.substring(0, 50) + "...");
          console.log("✅ [JWT] New token preview:", session.serverToken.substring(0, 50) + "...");
          
          // Check if token actually changed
          if (token.serverToken !== session.serverToken) {
            console.log("🔄 [JWT] Token is DIFFERENT! Updating...");
            token.serverToken = session.serverToken;
            token.tokenUpdatedAt = Date.now();
            console.log("✅ [JWT] Token updated at:", new Date(token.tokenUpdatedAt).toISOString());
          } else {
            console.log("⚠️ [JWT] Token is the SAME, no update needed");
          }
        }
        
        if (session?.user) {
          console.log("✅ [JWT] User data received in update");
          token.user = session.user;
        }
      }
      
      // Initial sign in with Facebook
      if (account?.provider === "facebook") {
        console.log("📘 [JWT] Facebook account detected, processing initial login...");
        token.accessToken = account.access_token;
        token.provider = account.provider;

        const token_en = account.access_token?.toString() || "";
        console.log("📘 [JWT] Facebook access token preview:", token_en.substring(0, 50) + "...");
        
        try {
          const { data } = await client.mutate({
            mutation: FBLOGIN,
            variables: {
              input: {
                idToken: token_en,
              },
            },
          });
          
          console.log("📘 [JWT] GraphQL response:", JSON.stringify(data, null, 2));
          
          if (data?.loginWithFacebook?.token) {
            console.log("✅ [JWT] Server token received from Facebook login!");
            console.log("✅ [JWT] New token preview:", data.loginWithFacebook.token.substring(0, 50) + "...");
            token.serverToken = data.loginWithFacebook.token as string;
            token.tokenUpdatedAt = Date.now();
            console.log("✅ [JWT] Token stored at:", new Date(token.tokenUpdatedAt).toISOString());
          } else {
            console.log("❌ [JWT] No token received from GraphQL mutation");
            token.error = "Authentication failed";
          }
        } catch (err) {
          console.error("❌ [JWT] GraphQL login error:", err);
          token.error = "Authentication failed";
        }
      } 
      // Initial sign in with Credentials
      else if (user && user.serverToken && trigger !== "update") {
        console.log("🔐 [JWT] Credentials login detected, initial setup");
        console.log("🔐 [JWT] User token preview:", user.serverToken.substring(0, 50) + "...");
        token.provider = "credentials";
        token.serverToken = user.serverToken;
        token.userId = user.id;
        token.tokenUpdatedAt = Date.now();
        console.log("✅ [JWT] Token stored at:", new Date(token.tokenUpdatedAt).toISOString());
      } 
      else if (trigger !== "update") {
        console.log("⚠️ [JWT] No provider or user data, keeping existing token");
      }
      
      console.log("🔄 [JWT] Final token state:", {
        hasServerToken: !!token.serverToken,
        serverTokenPreview: token.serverToken ? token.serverToken.substring(0, 50) + "..." : "none",
        provider: token.provider,
        tokenUpdatedAt: token.tokenUpdatedAt ? new Date(token.tokenUpdatedAt).toISOString() : "never",
        error: token.error
      });
      console.log("🔄 [JWT Callback] ========== END ==========\n");
      
      return token;
    },

    async session({ session, token }) {
      console.log("\n💬 [Session Callback] ========== START ==========");
      console.log("💬 [Session] Session before update:", {
        hasServerToken: !!session.serverToken,
        serverTokenPreview: session.serverToken ? session.serverToken.substring(0, 50) + "..." : "none",
      });
      console.log("💬 [Session] Token data:", {
        hasServerToken: !!token.serverToken,
        serverTokenPreview: token.serverToken ? token.serverToken.substring(0, 50) + "..." : "none",
        tokenUpdatedAt: token.tokenUpdatedAt ? new Date(token.tokenUpdatedAt).toISOString() : "never",
      });
      
      if (token) {
        const oldToken = session.serverToken;
        session.accessToken = token.accessToken as string | undefined;
        session.provider = token.provider as string | undefined;
        session.serverToken = token.serverToken as string | undefined;
        session.error = token.error as string | undefined;
        
        // Check if token changed
        if (oldToken !== session.serverToken) {
          console.log("✅ [Session] Token has been UPDATED in session!");
          console.log("✅ [Session] Old token preview:", oldToken?.substring(0, 50) + "...");
          console.log("✅ [Session] New token preview:", session.serverToken?.substring(0, 50) + "...");
        } else {
          console.log("ℹ️ [Session] Token unchanged");
        }
      }
      
      console.log("💬 [Session] Final session:", {
        hasServerToken: !!session.serverToken,
        serverTokenPreview: session.serverToken ? session.serverToken.substring(0, 50) + "..." : "none",
        provider: session.provider,
        hasError: !!session.error
      });
      console.log("💬 [Session Callback] ========== END ==========\n");
      
      return session;
    },

    async signIn({ user, account, profile }) {
      console.log("🚪 [SignIn] ========== START ==========");
      console.log("🚪 [SignIn] User:", JSON.stringify(user, null, 2));
      console.log("🚪 [SignIn] Account provider:", account?.provider);
      console.log("🚪 [SignIn] Profile:", JSON.stringify(profile, null, 2));
      console.log("🚪 [SignIn] ========== END ==========\n");
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
      console.log("\n🚪 [SignOut Event] ========== START ==========");
      console.log("🚪 [SignOut] User signing out");
      console.log("🚪 [SignOut] Token before logout:", {
        hasServerToken: !!token?.serverToken,
        tokenPreview: token?.serverToken?.substring(0, 50) + "..."
      });
      
      try {
        if (token?.serverToken) {
          console.log("🚪 [SignOut] Calling server logout endpoint");
          await client.mutate({
            mutation: LOGOUT_MUTATION,
            context: {
              headers: {
                Authorization: `Bearer ${token.serverToken}`,
              },
            },
          });
          console.log("✅ [SignOut] Server logout successful");
        }
        
        const cookieStore = await cookies();
        cookieStore.delete('auth-token');
        console.log("✅ [SignOut] Auth cookie deleted");
        
      } catch (error) {
        console.error("❌ [SignOut] Error during logout:", error);
      }
      console.log("🚪 [SignOut Event] ========== END ==========\n");
    },
  },

  pages: {
    signOut: '/auth/signout',
  },

  debug: process.env.NODE_ENV !== "production",
  
  logger: {
    error(code, metadata) {
      console.error("❌ [NextAuth Error]:", code, metadata);
    },
    warn(code) {
      console.warn("⚠️ [NextAuth Warning]:", code);
    },
    debug(code, metadata) {
      console.log("🐛 [NextAuth Debug]:", code, metadata);
    }
  }
};
