/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/server/db";
import type { EmailAddress, EmailAttachment, EmailMessage } from "@/types";
import { Prisma } from "@prisma/client";
import pLimit from "p-limit";
import { OramaClient } from "./orama";
import { turndown } from "./turndown";
import { getEmbeddings } from "./embeddings";

export const syncEmailsToDatabase = async (
  emails: EmailMessage[],
  accountId: string,
) => {
  console.log("Attempting to sync emails to database", emails.length);
  const promiseBatchLimit = pLimit(10); //process up to ten emails concurrently

  const orama = new OramaClient(accountId);
  await orama.initialize();

  try {
    async function syncToOrama() {
      await Promise.all(
        emails.map((email) => {
          return promiseBatchLimit(async () => {
            const body = turndown.turndown(
              email.body ?? email.bodySnippet ?? "",
            );
            const embeddings = await getEmbeddings(body);

            await orama.insert({
              body,
              subject: email.subject,
              rawBody: email.bodySnippet ?? "",
              from: `${email.from.name} <${email.from.address}>`,
              to: email.to.map((t) => `${t.name} <${t.address}>`),
              sentAt: new Date(email.sentAt).toLocaleString(),
              threadId: email.threadId,
              embeddings,
            });
          });
        }),
      );
    }

    async function syncToDB() {
      for (const [index, email] of emails.entries()) {
        console.log(`Email ${email.subject} ${index} ready to upsert`);
        await upsertEmail(email, accountId, index);
        console.log(`Email ${email.subject} upserted`);
      }
    }

    await Promise.all([syncToDB()]);
    await Promise.all([syncToOrama()]);
    await orama.saveIndex();
  } catch (error) {
    console.error("Failed to sync emails to database", error);
    throw error;
  }
};

const upsertEmail = async (
  email: EmailMessage,
  accountId: string,
  index: number,
) => {
  console.log("upserting email: ", index);

  try {
    let emailLabelType: "inbox" | "sent" | "draft" = "inbox";
    if (
      email.sysLabels.includes("inbox") ||
      email.sysLabels.includes("important")
    ) {
      emailLabelType = "inbox";
    } else if (email.sysLabels.includes("sent")) {
      emailLabelType = "sent";
    } else if (email.sysLabels.includes("draft")) {
      emailLabelType = "draft";
    }

    //1. Upsert EmailAddress Records
    const addressesToUpsert = new Map<string, EmailAddress>();

    for (const address of [
      email.from,
      ...email.to,
      ...email.cc,
      ...email.bcc,
      ...email.replyTo,
    ]) {
      addressesToUpsert.set(address.address, address);
    }

    const upsertedAddresses: Awaited<ReturnType<typeof upsertEmailAddress>>[] =
      [];

    for (const address of addressesToUpsert.values()) {
      const upsertedAddress = await upsertEmailAddress(address, accountId);
      upsertedAddresses.push(upsertedAddress);
    }

    const addressMap = new Map(
      upsertedAddresses
        .filter(Boolean)
        .map((address) => [address!.address, address]),
    );

    const fromAddress = addressMap.get(email.from.address);

    if (!fromAddress) {
      console.error(
        `Failed to upsert from-addresses from email ${email.bodySnippet}`,
      );
      return;
    }

    const toAddresses = email.to
      .map((address) => addressMap.get(address.address))
      .filter(Boolean);
    const ccAddresses = email.cc
      .map((address) => addressMap.get(address.address))
      .filter(Boolean);
    const bccAddresses = email.bcc
      .map((address) => addressMap.get(address.address))
      .filter(Boolean);
    const replyToAddresses = email.replyTo
      .map((address) => addressMap.get(address.address))
      .filter(Boolean);

    //2. Upsert Thread
    const thread = await db.thread.upsert({
      where: { id: email.threadId },
      update: {
        subject: email.subject,
        accountId,
        lastMessageDate: new Date(email.sentAt),
        done: false,
        participantIds: [
          ...new Set([
            fromAddress.id,
            ...toAddresses.map((addr) => addr!.id),
            ...ccAddresses.map((addr) => addr!.id),
            ...bccAddresses.map((addr) => addr!.id),
          ]),
        ],
      },
      create: {
        id: email.threadId,
        accountId,
        subject: email.subject,
        done: false,
        draftStatus: emailLabelType === "draft",
        inboxStatus: emailLabelType === "inbox",
        sentStatus: emailLabelType === "sent",
        lastMessageDate: new Date(email.sentAt),
        participantIds: [
          ...new Set([
            fromAddress.id,
            ...toAddresses.map((addr) => addr!.id),
            ...ccAddresses.map((addr) => addr!.id),
            ...bccAddresses.map((addr) => addr!.id),
          ]),
        ],
      },
    });

    //3. Upsert Email
    await db.email.upsert({
      where: { id: email.id },
      update: {
        threadId: thread.id,
        createdTime: new Date(email.createdTime),
        lastModifiedTime: new Date(),
        sentAt: new Date(email.sentAt),
        receivedAt: new Date(email.receivedAt),
        internetMessageId: email.internetMessageId,
        subject: email.subject,
        sysLabels: email.sysLabels,
        keywords: email.keywords,
        sysClassifications: email.sysClassifications,
        sensitivity: email.sensitivity,
        meetingMessageMethod: email.meetingMessageMethod,
        fromId: fromAddress.id,
        to: { set: toAddresses.map((a) => ({ id: a!.id })) },
        cc: { set: ccAddresses.map((a) => ({ id: a!.id })) },
        bcc: { set: bccAddresses.map((a) => ({ id: a!.id })) },
        replyTo: { set: replyToAddresses.map((a) => ({ id: a!.id })) },
        hasAttachments: email.hasAttachments,
        internetHeaders: email.internetHeaders as any,
        body: email.body,
        bodySnippet: email.bodySnippet,
        inReplyTo: email.inReplyTo,
        references: email.references,
        threadIndex: email.threadIndex,
        nativeProperties: email.nativeProperties as any,
        folderId: email.folderId,
        omitted: email.omitted,
        emailLabel: emailLabelType,
      },
      create: {
        id: email.id,
        emailLabel: emailLabelType,
        threadId: thread.id,
        createdTime: new Date(email.createdTime),
        lastModifiedTime: new Date(),
        sentAt: new Date(email.sentAt),
        receivedAt: new Date(email.receivedAt),
        internetMessageId: email.internetMessageId,
        subject: email.subject,
        sysLabels: email.sysLabels,
        internetHeaders: email.internetHeaders as any,
        keywords: email.keywords,
        sysClassifications: email.sysClassifications,
        sensitivity: email.sensitivity,
        meetingMessageMethod: email.meetingMessageMethod,
        fromId: fromAddress.id,
        to: { connect: toAddresses.map((a) => ({ id: a!.id })) },
        cc: { connect: ccAddresses.map((a) => ({ id: a!.id })) },
        bcc: { connect: bccAddresses.map((a) => ({ id: a!.id })) },
        replyTo: { connect: replyToAddresses.map((a) => ({ id: a!.id })) },
        hasAttachments: email.hasAttachments,
        body: email.body,
        bodySnippet: email.bodySnippet,
        inReplyTo: email.inReplyTo,
        references: email.references,
        threadIndex: email.threadIndex,
        nativeProperties: email.nativeProperties as any,
        folderId: email.folderId,
        omitted: email.omitted,
      },
    });

    const threadEmails = await db.email.findMany({
      where: { threadId: thread.id },
      orderBy: { receivedAt: "asc" },
    });

    let threadFolderType = "sent";
    for (const threadEmail of threadEmails) {
      if (threadEmail.emailLabel === "inbox") {
        threadFolderType = "inbox";
        break; //If any thread email is labelled as inbox then the whole thread is in inbox
      } else if (threadEmail.emailLabel === "draft") {
        threadFolderType = "draft"; //Set to draft and continue checking for inbox
      }
    }

    await db.thread.update({
      where: { id: thread.id },
      data: {
        draftStatus: threadFolderType === "draft",
        inboxStatus: threadFolderType === "inbox",
        sentStatus: threadFolderType === "sent",
      },
    });

    //4. Upsert Attachemnts
    for (const attachment of email.attachments) {
      await upsertEmailAttachement(email.id, attachment);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma error for email ${email.id}: ${error.message}`);
    } else {
      console.error(`Unknown error for email ${email.id}: ${error as any}`);
    }
  }
};

const upsertEmailAddress = async (address: EmailAddress, accountId: string) => {
  try {
    const existingAddress = await db.emailAddress.findUnique({
      where: {
        accountId_address: {
          accountId: accountId,
          address: address.address ?? "",
        },
      },
    });

    if (existingAddress) {
      return await db.emailAddress.update({
        where: { id: existingAddress.id },
        data: { name: address.name, raw: address.raw },
      });
    } else {
      return await db.emailAddress.create({
        data: {
          address: address.address,
          name: address.name,
          raw: address.raw,
          accountId,
        },
      });
    }
  } catch (error) {
    console.error("Failed to upset email address", error);
    return null;
  }
};

const upsertEmailAttachement = async (
  emailId: string,
  attachment: EmailAttachment,
) => {
  try {
    await db.emailAttachment.upsert({
      where: { id: attachment.id ?? "" },
      update: {
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
        content: attachment.content,
        contentLocation: attachment.contentLocation,
      },
      create: {
        id: attachment.id,
        emailId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
        content: attachment.content,
        contentLocation: attachment.contentLocation,
      },
    });
  } catch (error) {
    console.error(
      `Failed to upser attachment for email ${emailId}: ${error as any}`,
    );
  }
};
