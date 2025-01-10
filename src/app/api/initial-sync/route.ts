/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Account } from "@/lib/accounts";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 300;

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

  return NextResponse.json({ success: true }, { status: 200 });
};
