"use client";

import useThreads from "@/hooks/useThreads";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import Avatar from "react-avatar";
import { Letter } from "react-letter";

type EmailDisplayProps = {
  email: RouterOutputs["account"]["getThreads"][0]["emails"][0];
};

const EmailDisplay = ({ email }: EmailDisplayProps) => {
  const { account } = useThreads();
  const isSentByCurrentUserAccount =
    account?.emailAddress === email.from.address;

  const letterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (letterRef.current) {
      const gmailQuote = letterRef.current.querySelector(
        'div[class*="_gmail_quote"]',
      );
      if (gmailQuote) {
        gmailQuote.innerHTML = "";
      }
    }
  }, [email]);

  return (
    <div
      ref={letterRef}
      className={cn(
        "rounded-md border p-4 transition-all hover:translate-x-2",
        {
          "border-l-4 border-l-gray-900": isSentByCurrentUserAccount,
        },
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isSentByCurrentUserAccount && (
            <Avatar
              name={email.from.name ?? email.from.address}
              email={email.from.address}
              size="35"
              textSizeRatio={2}
              round={true}
            />
          )}
          <span className="font-medium">
            {isSentByCurrentUserAccount ? "Me" : email.from.address}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(email.sentAt ?? new Date(), {
            addSuffix: true,
          })}
        </p>
      </div>
      <div className="h-4"></div>
      <Letter
        html={email?.body ?? ""}
        className="rounded-md bg-white text-black dark:bg-black dark:text-white"
      />
    </div>
  );
};

export default EmailDisplay;
