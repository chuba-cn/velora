/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Account } from "@/lib/accounts";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { serve } from "@upstash/workflow/nextjs";

export const dynamic = "force-dynamic";

export const { POST } = serve<{ accountId: string; userId: string }>(
  async (context) => {

    const { accountId, userId } = context.requestPayload;

    //Check if accountId and userId are provided
    if (!accountId || !userId) {
      return;
    }


    const result = await context.run("Perform initial sync", async () => {
      // Retrieve Account details from database
      const dbAccount = await db.account.findUnique({
        where: {
          id: accountId,
          userId,
        },
      });

      if (!dbAccount) {
        throw new Error("Account not found");
      }

      const account = new Account(dbAccount.accessToken);

      return await account.performInitialSync();
    })

    await context.run("Update account details in db", async () => {
      if (!result) throw new Error("Sync failed");

      const { emails, deltaToken } = result;
      console.log("emails length: ", emails.length, deltaToken)

      await db.account.update({
        where: {
          id: accountId,
        },
        data: {
          nextDeltaToken: deltaToken,
        },
      });

      //Write emails to database
      await syncEmailsToDatabase(emails, accountId);
    })

  },
  {
    retries: 5,
    verbose: true,
  }
);

// export const POST = async (req: NextRequest) => {
//   const { accountId, userId } = (await req.json()) as {
//     accountId: string;
//     userId: string;
//   };

//   //Check if accountId and userId are provided
//   if (!accountId || !userId) {
//     return NextResponse.json(
//       { error: "INVALID_REQUEST" },
//       { status: 400 },
//     );
//   }

//   // Retrieve Account details from database
//   const dbAccount = await db.account.findUnique({
//     where: {
//       id: accountId,
//       userId,
//     },
//   });

//   if (!dbAccount) {
//     return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });
//   }

//   //Perform initial sync
//   const account = new Account(dbAccount.accessToken);

//   const response = await account.performInitialSync();

//   if (!response) {
//     return NextResponse.json(
//       { error: "FAILED_TO_PERFORM_INITIAL_SYNC" },
//       { status: 500 },
//     );
//   }

//   const { emails, deltaToken } = response;

//   // Update Account details in database
//   await db.account.update({
//     where: {
//       id: accountId,
//     },
//     data: {
//       nextDeltaToken: deltaToken
//     }
//   })

//   //Write emails to database
//   await syncEmailsToDatabase(emails, accountId);

//   return NextResponse.json({ success: true }, { status: 200 });
// };
