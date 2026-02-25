import { createAuthClient } from "better-auth/react"
import { stripeClient } from "@better-auth/stripe/client"
import { genericOAuthClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [
    stripeClient({
      subscription: false,
    }),
    genericOAuthClient(),
  ],
})
