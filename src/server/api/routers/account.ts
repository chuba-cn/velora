/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { emailAddressSchema } from "@/types";
import { Account } from "@/lib/accounts";
import { OramaClient } from "@/lib/orama";
import { TRPCError } from "@trpc/server";
import { FREE_CREDITS_PER_DAY } from "@/constants";
import { getEmailDetails } from "@/lib/aurinko";

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

  getNumThreads: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        tab: z.union([
          z.literal("inbox"),
          z.literal("draft"),
          z.literal("sent"),
        ]),
      }),
    )
    .query(async ({ ctx, input }) => {
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

      return await ctx.db.thread.count({
        where: {
          accountId: account.id,
          ...filter,
        },
      });
    }),

  getThreads: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        tab: z.union([
          z.literal("inbox"),
          z.literal("draft"),
          z.literal("sent"),
        ]),
        done: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      // Fetch new emails and sync to database
      const acc = new Account(account.accessToken);
      acc.syncEmails().catch(console.error);

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
        equals: input.done,
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
              sentAt: true,
            },
          },
        },
        orderBy: {
          lastMessageDate: "desc",
        },
      });
    }),

  getSuggestions: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      return await ctx.db.emailAddress.findMany({
        where: {
          accountId: account.id,
        },
        select: {
          name: true,
          address: true,
        },
      });
    }),

  getReplyDetails: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(["reply", "replyAll"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

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

      const lastExternalEmail = thread.emails
        .reverse()
        .find((email) => email.from.id !== account.id);

      if (!lastExternalEmail) {
        throw new Error("NO_EXTERNAL_EMAIL_FOUND_IN_THREAD");
      }

      // const allRecipients = new Set([
      //   ...thread.emails.flatMap(email => [ email.from, ...email.cc, ...email.bcc ])
      // ]);

      if (input.replyType === "reply") {
        return {
          to: [lastExternalEmail.from],
          cc: [],
          from: { name: account.name, address: account.emailAddress },
          subject: `${lastExternalEmail.subject}`,
          id: lastExternalEmail.internetMessageId,
        };
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

  sendEmail: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        to: z.array(emailAddressSchema),
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        inReplyTo: z.string().optional(),
        references: z.string().optional(),
        replyTo: emailAddressSchema,
        threadId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      const acc = new Account(account.accessToken);

      await acc.sendEmail({
        body: input.body,
        cc: input.cc,
        bcc: input.bcc,
        from: input.from,
        inReplyTo: input.inReplyTo,
        references: input.references,
        replyTo: input.replyTo,
        subject: input.subject,
        threadId: input.threadId,
        to: input.to,
      });
    }),

  searchEmails: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        query: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      const orama = new OramaClient(account.id);
      await orama.initialize();
      const results = await orama.search({ term: input.query });

      return results;
    }),

  getChatbotInteractionsCount: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      if (!account)
        throw new TRPCError({
          message: "User with given account id not found",
          code: "UNAUTHORIZED",
        });

      const today = new Date().toDateString();

      const todaysChatbotInteractions = await db.chatbotInteraction.findUnique({
        where: {
          day: today,
          userId: ctx.auth.userId,
        },
      });

      const remainingCredits =
        FREE_CREDITS_PER_DAY - (todaysChatbotInteractions?.count ?? 0);

      return { remainingCredits };
    }),

  setDone: privateProcedure
    .input(
      z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      if (!account) {
        throw new TRPCError({
          message: "Invalid token",
          code: "UNAUTHORIZED",
        });
      }

      if (input.threadId) {
        await db.thread.update({
          where: {
            id: input.threadId,
          },
          data: {
            done: true,
          },
        });
      }
      if (input.threadIds) {
        await db.thread.updateMany({
          where: {
            id: {
              in: input.threadIds,
            },
          },
          data: {
            done: true,
          },
        });
      }
    }),

  setUndone: privateProcedure
    .input(
      z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      if (!account) {
        throw new TRPCError({
          message: "Invalid token",
          code: "UNAUTHORIZED",
        });
      }

      if (input.threadId) {
        await ctx.db.thread.update({
          where: {
            id: input.threadId,
          },
          data: {
            done: false,
          },
        });
      }
      if (input.threadIds) {
        await ctx.db.thread.updateMany({
          where: {
            id: {
              in: input.threadIds,
            },
          },
          data: {
            done: false,
          },
        });
      }
    }),

  getMyAccount: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      if (!account) {
        throw new TRPCError({
          message: "Invalid token",
          code: "UNAUTHORIZED",
        });
      }

      return account;
    }),

  getEmailDetails: privateProcedure
    .input(
      z.object({
        emailId: z.string(),
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authorizeAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      if (!account) {
        throw new TRPCError({
          message: "Invalid token",
          code: "UNAUTHORIZED",
        });
      }

      return await getEmailDetails(account.accessToken, input.emailId);
    }),
});
