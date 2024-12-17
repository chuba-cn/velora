import { db } from "@/server/db";

type ClerkWebhookData = {
  email_addresses: { email_address: string }[];
  first_name: string;
  last_name: string;
  image_url: string;
  id: string;
};

export const POST = async (request: Request) => {
  try {
    const { data } = (await request.json()) as { data: ClerkWebhookData };

    console.log("Clerk Webhook Received: ", data);

    const emailAddress = data?.email_addresses[0]?.email_address;
    const { first_name, last_name, image_url, id } = data;

    if (!emailAddress || !id) {
      return new Response("Missing required data", { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await db.user.create({
      data: {
        emailAddress,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
        id,
      },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }

  return new Response("Webhook received", { status: 200 });
};
