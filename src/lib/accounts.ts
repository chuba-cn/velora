/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import axios from "axios";
import type {
  SyncUpdatedResponse,
  SyncResponse,
  EmailMessage,
  EmailAddress,
} from "./../types";
import { db } from "@/server/db";
import { syncEmailsToDatabase } from "./sync-to-db";

/**
 * Represents an email account.
 *
 * @property {string} token - The Aurinko API token for the account.
 *
 * @example
 * const account = new Account("my_token");
 * const { emails, deltaToken } = await account.performInitialSync();
 * console.log("Synced", emails.length, "emails");
 * console.log("Delta token:", deltaToken);
 */
export class Account {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Initiates the email synchronization process with the Aurinko API.
   *
   * @returns {Promise<SyncResponse>} The response data from the API, containing sync tokens and status.
   *
   * @throws {Error} Throws an error if the request fails.
   */
  private async startSync() {
    const response = await axios.post<SyncResponse>(
      "https://api.aurinko.io/v1/email/sync",
      {},
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          daysWithin: 30,
          bodyType: "html",
        },
      },
    );

    return response.data;
  }

  /**
   * Gets the updated emails since the last sync, or the next page of updated emails.
   *
   * @param {Object} options - Options for the request.
   * @param {string} [options.deltaToken] - The delta token to request emails newer than.
   * @param {string} [options.pageToken] - The page token to request the next page of emails.
   *
   * @returns {Promise<SyncUpdatedResponse>} The response data from the API, containing the updated emails and sync tokens.
   *
   * @throws {Error} Throws an error if the request fails.
   */
  private async getUpdatedEmails({
    deltaToken,
    pageToken,
  }: {
    deltaToken?: string;
    pageToken?: string;
  }) {
    const params: Record<string, string> = {};

    if (deltaToken) params.deltaToken = deltaToken;
    if (pageToken) params.pageToken = pageToken;

    const response = await axios.get<SyncUpdatedResponse>(
      "https://api.aurinko.io/v1/email/sync/updated",
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params,
      },
    );

    return response.data;
  }

  /**
   * Perform an initial sync of emails from the Aurinko API.
   *
   * The method starts the sync process and waits for it to complete. It then fetches all
   * updated emails since the last sync, and returns all the emails fetched, along with the
   * latest delta token to be stored for future incremental syncs.
   *
   * @returns {Promise<{ emails: EmailMessage[], deltaToken: string }>} The response data from the API, containing the emails and sync tokens.
   *
   * @throws {Error} Throws an error if the request fails.
   */
  async performInitialSync() {
    try {
      //Start the sync process
      let syncResponse = await this.startSync();
      while (!syncResponse.ready) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        syncResponse = await this.startSync();
      }

      // Get the bookmark delta token
      let storedDeltaToken: string = syncResponse.syncUpdatedToken;

      let updatedResponse = await this.getUpdatedEmails({
        deltaToken: storedDeltaToken,
      });

      if (updatedResponse.nextDeltaToken) {
        // Sync has completed
        storedDeltaToken = updatedResponse.nextDeltaToken;
      }
      let allEMails: EmailMessage[] = updatedResponse.records;

      //Fetch all pages if there are more
      while (updatedResponse.nextPageToken) {
        updatedResponse = await this.getUpdatedEmails({
          pageToken: updatedResponse.nextPageToken,
        });
        allEMails = allEMails.concat(updatedResponse.records);
        if (updatedResponse.nextDeltaToken) {
          // Sync has completed
          storedDeltaToken = updatedResponse.nextDeltaToken;
        }
      }

      console.log("Intial sync completed!", allEMails.length, "emails synced");

      //Return latest next delta token to be stored in the database for future incremental syncs
      return {
        emails: allEMails,
        deltaToken: storedDeltaToken,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error syncing emails:",
          JSON.stringify(error.response?.data),
          null,
          2,
        );
      } else {
        console.error("Unexpected error syncing emails:", error);
      }
    }
  }

  async sendEmail({
    from,
    subject,
    body,
    inReplyTo,
    references,
    to,
    cc,
    bcc,
    replyTo,
    threadId
   }: {
    from: EmailAddress,
    subject: string,
    body: string,
    inReplyTo?: string,
    references?: string,
    to: EmailAddress[],
    cc?: EmailAddress[],
    bcc?: EmailAddress[],
    replyTo?: EmailAddress,
    threadId?: string,
  }) {
    try {
      const response = await axios.post("https://api.aurinko.io/v1/email/messages", {
        from,
        subject,
        body,
        inReplyTo,
        references,
        to,
        cc,
        bcc,
        replyTo: [replyTo],
        threadId
      }, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          returnIds: true
        }
      }
      )

      console.log("Email sent ", response.data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return response.data;
    } catch (error) {
      if(axios.isAxiosError(error)) {
        console.error("Error sending email: ", JSON.stringify(error.response?.data, null, 2));
      } else {
        console.error("Error sending email: ", error)
      }

      throw error
    }
  }

  async syncEmails() {
    const account = await db.account.findUnique({
      where: { accessToken: this.token }
    });

    if(!account) {
      throw new Error("Account not found");
    }
    if(!account.nextDeltaToken) {
      return await this.performInitialSync(); //Account has not been synced before so perform initial sync
    }

    let response = await this.getUpdatedEmails({
      deltaToken: account.nextDeltaToken
    })

    let storedDeltaToken = account.nextDeltaToken;
    let allEmails: EmailMessage[] = response.records;

    if(response.nextDeltaToken) {
      storedDeltaToken = response.nextDeltaToken;
    }

    while (response.nextPageToken) {
      response = await this.getUpdatedEmails({ pageToken: response.nextPageToken });
      allEmails.concat(response.records);

      if(response.nextDeltaToken) {
        storedDeltaToken = response.nextDeltaToken;
      }
    }

    try {
      void syncEmailsToDatabase(allEmails, account.id)
    } catch (error) {
      console.error("Error syncing emails to database: ", error);
    }

    await db.account.update({
      where: { id: account.id },
      data: {
        nextDeltaToken: storedDeltaToken
      }
    });

    return {
      emails: allEmails,
      deltaToken: storedDeltaToken
    }
  }
}
