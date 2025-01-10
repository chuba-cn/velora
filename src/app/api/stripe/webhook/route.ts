/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { db } from "@/server/db";

export const POST = async (req: NextRequest) => {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    return new Response("WEBHOOK ERROR", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session
  console.log("received strpe event: ", event.type);

  switch (event.type) {

    case "checkout.session.completed": {
      
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
        {
          expand: [ "items.data.price.product" ]
        }
      );

      if (!session.client_reference_id) {
        return new Response("NO USER_ID", {status: 400 })
      }

      const subscriptionPrice = subscription.items.data[ 0 ]?.price;

      if (!subscriptionPrice) {
        return new Response("NO_USER_ID", { status: 400 })
      }

      const productId = (subscriptionPrice.product as Stripe.Product).id;

      if (!productId) {
        return new Response("NO_PRODUCT-ID_FOR_SUBSCRIPTION", { status: 404 });
      }

      await db.stripeSubscription.create({
        data: {
          subscriptionId: subscription.id,
          priceId: subscriptionPrice.id,
          customerId: subscription.customer as string,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          userId: session.client_reference_id
        }
      })

      return NextResponse.json({ message: "SUCCESS" }, { status: 200 });
    }
      // break;
    
    case "invoice.payment_succeeded": {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
        {
          expand: ["items.data.price.product"],
        },
      );

       const subscriptionPrice = subscription.items.data[0]?.price;

       if (!subscriptionPrice) {
         return new Response("NO_USER_ID", { status: 400 });
       }

       const productId = (subscriptionPrice.product as Stripe.Product).id;

       if (!productId) {
         return new Response("NO_PRODUCT-ID_FOR_SUBSCRIPTION", { status: 404 });
       }
      
      await db.stripeSubscription.update({
        where: {
          subscriptionId: subscription.id
        },
        data: {
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          priceId: subscriptionPrice.id
        }
      });

      return NextResponse.json({ message: "SUCCESS" }, { status: 200 });
    }
      // break;
    
    case "customer.subscription.updated": {
      const subscription = await stripe.subscriptions.retrieve(session.id);

      const existingSubscription = await db.stripeSubscription.findUnique({
        where: {
          subscriptionId: session.id
        }
      });

      if (!existingSubscription) {
        return new NextResponse("SUBSCRIPTION_NOT_FOUND", { status: 200 })
      }
      
      await db.stripeSubscription.update({
        where: {
          subscriptionId: session.id,
        },
        data: {
          updatedAt: new Date(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });

      return NextResponse.json({ message: "SUCCESS" }, { status: 200 });
    }
    
    default:
      break;
  }
  return new Response("Webhook received", { status: 200 });
}