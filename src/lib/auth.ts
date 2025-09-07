import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { NextResponse } from "next/server";
import { gql, ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { cookies } from "next/headers";
import { LOGOUT_MUTATION, FBLOGIN, LOGIN } from "../../graphql/mutation"; // Changed to LOGIN

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_SERVER_LINK!,
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
        console.log("Credentials login attempt:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const { data } = await client.mutate({
            mutation: LOGIN, // Using your actual LOGIN mutation
            variables: {
              input: {
                email: credentials.email,
                password: credentials.password,
              },
            },
          });

          console.log("Login response:", data);

          if (data?.login?.token) {
            // Return the user object with the token from your backend
            return {
              id: credentials.email, // Using email as ID since your response doesn't have user ID
              email: credentials.email,
              serverToken: data.login.token, // This is your returned token
            };
          } else {
            throw new Error("No token received from server");
          }
        } catch (error: any) {
          console.error("Login error:", error);
          throw new Error(error.message || "Login failed");
        }
      }
    })
  ],

  secret:
    process.env.NEXTAUTH_SECRET?.length >= 32
      ? process.env.NEXTAUTH_SECRET
      : Buffer.from(
          process.env.NEXTAUTH_SECRET ||
            "default-fallback-secret-32-chars-long"
        )
          .toString("base64")
          .slice(0, 32),

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, account, user }) {
      console.log("JWT callback triggered");
      console.log("Token received:", JSON.stringify(token, null, 2));
      console.log("Account received:", JSON.stringify(account, null, 2));
      console.log("User received:", JSON.stringify(user, null, 2));
      
      if (account?.provider === "facebook") {
        console.log("Facebook account detected, processing...");
        token.accessToken = account.access_token;
        token.provider = account.provider;

        const token_en = account.access_token?.toString() || "";
        console.log("Facebook access token:", token_en);
        
        try {
          console.log("Attempting GraphQL mutation to server...");
          console.log("Server URL:", process.env.NEXT_PUBLIC_SERVER_LINK);
          
          const { data } = await client.mutate({
            mutation: FBLOGIN,
            variables: {
              input: {
                idToken: token_en,
              },
            },
          });
          
          console.log("GraphQL mutation response:", JSON.stringify(data, null, 2));
          
          if (data?.loginWithFacebook?.token) {
            console.log("Server token received, setting in JWT");
            token.serverToken = data.loginWithFacebook.token as string;
          } else {
            console.log("No token received from GraphQL mutation");
            console.log("Response data:", data);
          }
        } catch (err) {
          console.error("GraphQL login error:", err);
          console.error("Error details:", JSON.stringify(err, null, 2));
          token.error = "Authentication failed";
        }
      } else if (user && user.serverToken) {
        console.log("Credentials login detected");
        token.provider = "credentials";
        token.serverToken = user.serverToken;
        token.userId = user.id;
      } else {
        console.log("Account provider is not Facebook or account is missing:", account?.provider);
      }
      
      console.log("Final token being returned:", JSON.stringify(token, null, 2));
      return token;
    },

    async session({ session, token }) {
      console.log("Session callback triggered");
      console.log("Session input:", JSON.stringify(session, null, 2));
      console.log("Token input:", JSON.stringify(token, null, 2));
      
      if (token) {
        session.accessToken = token.accessToken as string | undefined;
        session.provider = token.provider as string | undefined;
        session.serverToken = token.serverToken as string | undefined;
        session.error = token.error as string | undefined;
      }
      
      console.log("Final session being returned:", JSON.stringify(session, null, 2));
      return session;
    },

    async signIn({ user, account, profile }) {
      console.log("SignIn callback triggered");
      console.log("User:", JSON.stringify(user, null, 2));
      console.log("Account:", JSON.stringify(account, null, 2));
      console.log("Profile:", JSON.stringify(profile, null, 2));
      return true;
    },
  },
cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none", // IMPORTANT for PWA OAuth
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
      console.log("User signed out");
      
      try {
        if (token?.serverToken) {
          console.log("Calling server logout endpoint");
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
        
      } catch (error) {
        console.error("Error during logout:", error);
      }
    },
  },

  pages: {
    signOut: '/auth/signout',
  },

  debug: process.env.NODE_ENV !== "production",
  
  logger: {
    error(code, metadata) {
      console.error("NextAuth error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth warning:", code);
    },
    debug(code, metadata) {
      console.log("NextAuth debug:", code, metadata);
    }
  }
};
