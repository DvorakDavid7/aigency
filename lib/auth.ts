import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import prisma from "./prisma";

function buildPlugins() {
  const plugins = [
    genericOAuth({
      config: [
        {
          providerId: "facebook-ads",
          clientId: process.env.FACEBOOK_CLIENT_ID as string,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
          authorizationUrl: "https://www.facebook.com/v21.0/dialog/oauth",
          tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
          scopes: [
            "ads_management",
            "ads_read",
            "business_management",
            "pages_read_engagement",
          ],
          getUserInfo: async (tokens) => {
            const res = await fetch(
              `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${tokens.accessToken}`
            );
            const data = await res.json();
            return {
              id: data.id,
              name: data.name ?? null,
              email: data.email ?? null,
              image: undefined,
              emailVerified: false,
            };
          },
        },
      ],
    }),
  ];

  if (!process.env.STRIPE_SECRET_KEY) return plugins;

  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
  });

  return [
    ...plugins,
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      onCustomerCreate: async ({ stripeCustomer, user }) => {
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: stripeCustomer.id },
        });
      },
      onEvent: async (event) => {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const credits = parseInt(session.metadata?.credits ?? "0", 10);
          if (userId && credits > 0) {
            await prisma.user.update({
              where: { id: userId },
              data: { credits: { increment: credits } },
            });
          }
        }
      },
    }),
  ];
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    },
  },
  plugins: buildPlugins(),
});
