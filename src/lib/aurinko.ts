"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";

interface AurinkoTokenResponse {
  accountId: number;
  accessToken: string;
  userId: string;
  userSession: string;
}

export const getAurinkoAuthUrl = async (
  serviceType: "Google" | "Office365",
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const params = new URLSearchParams({
    clientId: process.env.ARUINKO_CLIENT_ID!,
    serviceType,
    scopes: "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All",
    responseType: "code",
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
  });

  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};

export const exchangeCodeForAccessToken = async (code: string) => {
  try {
    const response = await axios.post<AurinkoTokenResponse>(
      `https://api.aurinko.io/v1/auth/token/${code}`,
      {},
      {
        auth: {
          username: process.env.ARUINKO_CLIENT_ID!,
          password: process.env.ARUINKO_CLIENT_SECRET!,
        },
        timeout: 15000
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios Error Details: ", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: error.response?.data,
        headers: error.response?.headers,
      });

      if (error.code === "ETIMEDOUT") {
        throw new Error("Request timed out. Check your network connection.");
      }
      if (error.code === "ENOTFOUND") {
        throw new Error("Unable to resolve the server address.");
      }
    }
    console.error("Unexpected Error: ", error);
    throw error;
  }
};

export const getAccountDetails = async (token: string) => {
  try {
    const response = axios.get("https://api.aurinko.io/v1/account", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return (await response).data as {
      email: string;
      name: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching account deatils: ", error.response?.data);
    } else {
      console.error("Unexpected error fetching account details: ", error);
    }
    throw error;
  }
};
