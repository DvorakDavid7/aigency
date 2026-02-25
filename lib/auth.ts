import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import prisma from "./prisma";

function buildPlugins() {
  if (!process.env.STRIPE_SECRET_KEY) return [];

  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
  });

  return [
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
  onAPIError: {
    onError(error, ctx) {
      console.error("[Better Auth] API error logger:", {
        error,
        context: ctx,
      })
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      scope: ["email", "public_profile", "ads_management"],
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `fb_${profile.id}@noemail.local`,
      }),
    },
  },
  plugins: buildPlugins(),
});
