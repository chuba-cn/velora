/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
// import { waitUntil } from "@vercel/functions";
import { Client } from "@upstash/workflow";

const upstashWorkflowClient = new Client({token: process.env.QSTASH_TOKEN!})

export const GET = async (request: NextRequest) => {
  const { userId } = await auth();

  if (!userId)
    return NextResponse.json(
      { message: "UNAUTHORIZED" },
      { status: 401 },
    );

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  if (status !== "success")
    return NextResponse.json(
      { message: "ACCOUNT_LINKING_FAILED" },
      { status: 400 },
    );

  //Get the code from aurinko and exchange for access token
  const code = params.get("code");
  if (!code)
    return NextResponse.json({ message: "No code provided" }, { status: 400 });

  const token = await exchangeCodeForAccessToken(code);
  if (!token)
    return NextResponse.json(
      { message: "Failed to exchange code for access token" },
      { status: 400 },
    );

  //Use access token to get user info
  const accountDetails = await getAccountDetails(token.accessToken);

  // Add or update user info in database
  await db.account.upsert({
    where: {
      id: token.accountId.toString(),
    },
    update: {
      accessToken: token.accessToken,
    },
    create: {
      id: token.accountId.toString(),
      userId,
      emailAddress: accountDetails.email,
      name: accountDetails.name,
      accessToken: token.accessToken,
    },
  });

  // Trigger initial email sync endpoint
  try {
    await upstashWorkflowClient.trigger({
      url: `${process.env.NEXT_PUBLIC_URL!}/api/initial-sync`,
      body: {
        accountId: token.accountId.toString(),
        userId,
      },
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (workflowError) {
    console.log("Failed to trigger initial sync", workflowError);
  }

  // waitUntil(
  //   upstashWorkflowClient.trigger({
  //     url: `${process.env.NEXT_PUBLIC_URL!}/api/initial-sync`,
  //     body: {
  //       accountId: token.accountId.toString(),
  //       userId
  //     }
  //   })
  //     .then((workflowRunId) => {
  //       console.log("Initial sync triggered with id: ", workflowRunId);
  //     })
  //     .catch((error) => {
  //       console.log("Failed to trigger initial sync", error.response.data);
  //     }),
  // );

  return NextResponse.redirect(new URL("/mail", request.url));
};
