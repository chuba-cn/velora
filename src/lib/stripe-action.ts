'use server'

import { auth } from "@clerk/nextjs/server"
import { stripe } from "./stripe";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

export const createCheckoutSession = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("UNAUTHORIZED");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: "price_1QezmiLUqd0UdYhQhy7E4CX2",
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_URL}/mail`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/mail`,
    client_reference_id: userId
  });

  redirect(session.url!)
}

export const createBillingPortalSession = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("UNAUTHORIZED");

  const subscription = await db.stripeSubscription.findUnique({
    where: {
      userId: userId
    }
  });

  if (!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND");

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/mail`
  })

  redirect(session.url)
}

export const getSubscriptionStatus = async () => {
  const { userId } = await auth();

  if (!userId) return false;

  const subscription = await db.stripeSubscription.findUnique({
    where: {
      userId: userId
    }
  });

  if (!subscription) return false
  
  return subscription.currentPeriodEnd > new Date()
}