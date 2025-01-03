/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

export const authorizeAccountAccess = async (accountId: string, userId: string) => {
  const account = await db.account.findFirst({
    where: {
      id: accountId,
      userId
    },
    select: {
      id: true,
      emailAddress: true,
      name: true,
      accessToken: true
    }
  });

  if (!account) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }
  return account;
}

const inboxFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  inboxStatus: true
});

const sentFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  sentStatus: true
});

const draftFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  draftStatus: true
});

export const accountRouter = createTRPCRouter({
  getAccounts: privateProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      select: {
        id: true,
        emailAddress: true,
        name: true,
      },
    });
  }),

  getNumThreads: privateProcedure.input(z.object({
    accountId: z.string(),
    tab: z.union([z.literal("inbox"), z.literal("draft"), z.literal("sent")]),
  })).query(async ({ ctx, input }) => {
    const account = await authorizeAccountAccess(input.accountId, ctx.auth.userId);

    // eslint-disable-next-line prefer-const
    let filter: Prisma.ThreadWhereInput = {};
    if (input.tab === "inbox") {
      filter = inboxFilter(account.id);
    } else if (input.tab === "draft") {
      filter = draftFilter(account.id)
    } else if (input.tab === "sent") {
      filter = sentFilter(account.id);
    }

    return await ctx.db.thread.count({
      where: {
        accountId: account.id,
        ...filter
      }
    })
  }),

  getThreads: privateProcedure.input(z.object({
    accountId: z.string(),
    tab: z.union([ z.literal("inbox"), z.literal("draft"), z.literal("sent") ]),
    done: z.boolean()
  })).query(async ({ ctx, input }) => {
    const account = await authorizeAccountAccess(
      input.accountId,
      ctx.auth.userId,
    );

    // eslint-disable-next-line prefer-const
    let filter: Prisma.ThreadWhereInput = {};
    if (input.tab === "inbox") {
      filter = inboxFilter(account.id);
    } else if (input.tab === "draft") {
      filter = draftFilter(account.id);
    } else if (input.tab === "sent") {
      filter = sentFilter(account.id);
    }

    filter.done = {
      equals: input.done
    };

    return await ctx.db.thread.findMany({
      where: filter,
      include: {
        emails: {
          orderBy: {
            sentAt: "asc",
          },
          select: {
            from: true,
            body: true,
            bodySnippet: true,
            emailLabel: true,
            sysLabels: true,
            subject: true,
            id: true,
            sentAt: true
          }
        }
      },
      take: 15,
      orderBy: {
        lastMessageDate: "desc"
      }
    })
  }),

  getSuggestions: privateProcedure.input(z.object({
    accountId: z.string()
  })).query(async ({ ctx, input }) => {
    const account = await authorizeAccountAccess(input.accountId, ctx.auth.userId);

    return await ctx.db.emailAddress.findMany({
      where: {
        accountId: account.id
      },
      select: {
        name: true,
        address: true
      }
    })
  }),

  getReplyDetails: privateProcedure.input(z.object({
    accountId: z.string(),
    threadId: z.string(),
    replyType: z.enum(["reply", "replyAll"])
  })).query(async ({ ctx, input}) => {
    const account = await authorizeAccountAccess(input.accountId, ctx.auth.userId);

    const thread = await ctx.db.thread.findUnique({
      where: {
        id: input.threadId,
      },
      include: {
        emails: {
          orderBy: { sentAt: "asc" },
          select: {
            from: true,
            to: true,
            cc: true,
            bcc: true,
            sentAt: true,
            subject: true,
            internetMessageId: true,
          },
        },
      },
    });

    if (!thread || thread.emails.length === 0) {
      throw new Error("THREAD_NOT_FOUND_OR_EMPTY");
    }

    const lastExternalEmail = thread.emails.reverse().find(email => email.from.id !== account.id);

    if (!lastExternalEmail) {
      throw new Error("NO_EXTERNAL_EMAIL_FOUND_IN_THREAD"); 
    }

    // const allRecipients = new Set([
    //   ...thread.emails.flatMap(email => [ email.from, ...email.cc, ...email.bcc ])
    // ]);

    if (input.replyType === "reply") {
      return {
        to: [ lastExternalEmail.from ],
        cc: [],
        from: { name: account.name, address: account.emailAddress },
        subject: `${lastExternalEmail.subject}`,
        id: lastExternalEmail.internetMessageId
      }
    } else if (input.replyType === "replyAll") {
      return {
        to: [
          lastExternalEmail.from,
          ...lastExternalEmail.to.filter((email) => email.id !== account.id),
        ],
        cc: lastExternalEmail.cc.filter((email) => email.id !== account.id),
        from: { name: account.name, address: account.emailAddress },
        subject: `${lastExternalEmail.subject}`,
        id: lastExternalEmail.internetMessageId,
      };
    }
  }),
});
