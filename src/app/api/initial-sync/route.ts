/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Account } from "@/lib/accounts";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handle the initial syncing of emails for a user.
 *
 * The request body should contain the following:
 * - `accountId`: The ID of the Account to sync
 * - `userId`: The ID of the User the Account belongs to
 *
 * The response will contain the following:
 * - `success`: A boolean indicating if the syncing was successful
 *
 * The response status will be:
 * - 200 if the syncing was successful
 * - 400 if the request body is invalid
 * - 404 if the Account or User is not found
 * - 500 if there is an unexpected error
 */
export const POST = async (req: NextRequest) => {
  const { accountId, userId } = (await req.json()) as {
    accountId: string;
    userId: string;
  };

  //Check if accountId and userId are provided
  if (!accountId || !userId) {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  // Retrieve Account details from database
  const dbAccount = await db.account.findUnique({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!dbAccount) {
    return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });
  }

  //Perform initial sync
  const account = new Account(dbAccount.accessToken);

  const response = await account.performInitialSync();

  if (!response) {
    return NextResponse.json(
      { error: "FAILED_TO_PERFORM_INITIAL_SYNC" },
      { status: 500 },
    );
  }

  const { emails, deltaToken } = response;

  // Update Account details in database
  await db.account.update({
    where: {
      id: accountId,
    },
    data: {
      nextDeltaToken: deltaToken
    }
  })

  //Write emails to database
  await syncEmailsToDatabase(emails, accountId);

  console.log("Syncing completed", deltaToken);
  return NextResponse.json({ success: true }, { status: 200 });
};
