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
      filter.inboxStatus = true;
    } else if (input.tab === "draft") {
      filter.draftStatus = true;
    } else if (input.tab === "sent") {
      filter.sentStatus = true;
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
      filter.inboxStatus = true;
    } else if (input.tab === "draft") {
      filter.draftStatus = true;
    } else if (input.tab === "sent") {
      filter.sentStatus = true;
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
  })
});
