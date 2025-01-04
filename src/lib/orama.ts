/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { db } from "@/server/db";
import { type AnyOrama, create, insert, search } from "@orama/orama";
import {persist, restore} from "@orama/plugin-data-persistence"

export class OramaClient {
  private orama!: AnyOrama;
  private accountId: string;

  constructor (accountId: string) {
    this.accountId = accountId;
  }

  async saveIndex() {
    const index = await persist(this.orama, "json")

    await db.account.update({
      where: {
        id: this.accountId
      },
      data: {
        oramaIndex: index as Buffer
      }
    });
  }

  async initialize() {
    const account = await db.account.findUnique({
      where: {
        id: this.accountId
      }
    });

    if (!account) {
      throw new Error("Account not found");
    }

    if (account.oramaIndex) {
      this.orama = await restore("json", account.oramaIndex as any)
    } else {
      this.orama = create({
        schema: {
          subject: 'string',
          body: "string",
          rawBody: "string",
          from: "string",
          to: "string[]",
          sentAt: "string",
          threadId: "string",
          // embeddings: "vector[1536]"
        }
      })
    }

    await this.saveIndex()
  }

  async search({ term }: { term: string }) {
    return await search(this.orama, {
      term
    })
  }

  async insert(document: any) {
    await insert(this.orama, document);
    await this.saveIndex();
  }
}