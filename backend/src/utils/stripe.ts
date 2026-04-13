import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

// Stripe's CJS export uses a function signature (this: any) rather than a class
// constructor — calling it with new works at runtime but requires this suppression.
// @ts-ignore
export const stripe: Stripe.Stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});
