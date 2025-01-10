/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FREE_CREDITS_PER_DAY } from './../../../constants';
import { OramaClient } from "@/lib/orama";
import { getSubscriptionStatus } from "@/lib/stripe-action";
import { db } from "@/server/db";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { type Message } from "ai";
import { streamText } from "ai";

export const maxDuration = 30;

export const POST = async (request: Request) => {

  const today = new Date().toDateString();
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("UNAUTHORIZED", { status: 401 });
    }

    const isSubscribed = await getSubscriptionStatus();

    if (!isSubscribed) {
      const chatbotInteraction = await db.chatbotInteraction.findUnique({
        where: {
          userId,
          day:today
        }
      })

      if (!chatbotInteraction) {
        await db.chatbotInteraction.create({
          data: {
            day: today,
            userId,
            count: 1
          }
        })
      } else if (chatbotInteraction.count >= FREE_CREDITS_PER_DAY) {
        return new Response("You have reached the free limit for today", { status: 429 });
      }
    }

    const { accountId, messages } = (await request.json()) as {
      accountId: string;
      messages: Message[];
    };

    const orama = new OramaClient(accountId);
    await orama.initialize();

    const lastMessage = messages[messages.length - 1];

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const context = await orama.vectorSearch({ term: lastMessage?.content! });
    console.log(context.hits.length + "hits found");

    const prompt = `RESPONSE GUIDELINES:
      - Carefully analyze the entire context
      - Focus DIRECTLY on the specific question asked
      - Aim for a natural and inforative tone
      THE TIME NOW IS ${new Date().toLocaleString()}
     
     START CONTEXT BLOCK
     ${context.hits.map((hit) => JSON.stringify(hit.document)).join("\n")}
     END OF CONTEXT BLOCK

     QUESTION: ${lastMessage?.content}
     
     When responding, please keep in mind:
     - Be helpful, clever, and articulate.
     - Rely on the provided email context to inform your responses.
     - If the context does not contain enough information to answer a question, politely say you don't have enough information.
     - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
     - Do not invent or speculate about anything that is not directly supported by the email context.
     - Keep your responses concise and relevant to the user's questions or the email being composed.`;

    const result = streamText({
      model: google("gemini-1.5-pro-latest"),
      system:
        "You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.",
      prompt,
      temperature: 0.3,
      onFinish: async () => {
        await db.chatbotInteraction.update({
          where: {
            day: today,
            userId
          },
          data: {
            count: {
              increment: 1
            }
          }
        })
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("error", error);
    return new Response("INTERNAL SERVER ERROR", { status: 500 });
  }
};
