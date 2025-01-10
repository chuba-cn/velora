/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import Image from "next/image";
import { FREE_CREDITS_PER_DAY } from "@/constants";
import StripeButton from "./StripeButton";
import { getSubscriptionStatus } from "@/lib/stripe-action";
import { motion } from "motion/react";
import useThreads from "@/hooks/useThreads";
import { api } from "@/trpc/react";

const PremiuimBanner = () => {
  const [ isSubscribed, setIsSubscribed ] = React.useState<boolean>(false);
  const { accountId } = useThreads();
  const{ data } = api.account.getChatbotInteractionsCount.useQuery({ accountId })

  React.useEffect(() => {
    void (async () => {
      const subscriptionStatus = await getSubscriptionStatus();

      setIsSubscribed(subscriptionStatus);
    })();
  }, []);

  if (!isSubscribed) {
    return (
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg border bg-gray-900 p-4 md:flex-row">
        <Image
          src="/bot.webp"
          alt="bot image"
          width={180}
          height={180}
          className="h-[180px] w-auto md:absolute md:-bottom-6 md:-right-10"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Basic Plan</h1>
            <p className="text-sm text-gray-400 md:max-w-full">
              {data?.remainingCredits ?? FREE_CREDITS_PER_DAY} / {FREE_CREDITS_PER_DAY} messages remaining
            </p>
          </div>
          <div className="h-4"></div>
          <p className="text-sm text-gray-400 md:max-w-[calc(100%-150px)]">
            Upgrade to pro to ask as many questions as you want!
          </p>
          <div className="h-4"></div>
          <StripeButton />
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <motion.div
        layout
        className="relative flex flex-col gap-4 overflow-hidden rounded-lg border bg-gray-900 p-4 md:flex-row"
      >
        <Image
          src="/bot.webp"
          alt="bot image"
          width={180}
          height={180}
          className="h-[180px] w-auto md:absolute md:-bottom-6 md:-right-10"
        />
        <div>
          <h1 className="text-xl font-semibold text-white">Premium Plan</h1>
          <div className="h-2"></div>
          <p className="text-sm text-gray-400 md:max-w-[calc(100%-70px)] text-wrap">
            Ask as many questions as you want
          </p>
          <div className="h-4"></div>
          <StripeButton />
        </div>
      </motion.div>
    );
  }
  return <div>PremiuimBanner</div>;
};

export default PremiuimBanner;
