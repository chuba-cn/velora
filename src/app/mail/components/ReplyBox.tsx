/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import EmailEditor from "./EmailEditor";
import useThreads from "@/hooks/useThreads";
import { api, type RouterOutputs } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const ReplyBox = () => {
  const { accountId, threadId } = useThreads();
  const { data: replyDetails } = api.account.getReplyDetails.useQuery({
    accountId,
    threadId: threadId ?? "",
    replyType: "reply",
  });

  if (!replyDetails) {
    return (
      <div className="flex items-start flex-col gap-2 w-full justify-center bg-primary/20 animate-pulse border-2 border-gray-200 pt-2">
        <Skeleton className="h-4 w-full rounded-sm" />
        <div className="h-10"></div>
        <Skeleton className="h-6 w-full rounded-sm" />
      </div>
    );
  }

  return <Component replyDetails={replyDetails} />;
};

type ComponentProps = {
  replyDetails: NonNullable<RouterOutputs["account"]["getReplyDetails"]>;
};

const Component = ({ replyDetails }: ComponentProps) => {
  const { accountId, threadId } = useThreads();

  const [subject, setSubject] = React.useState<string>(
    replyDetails.subject.startsWith("Re:")
      ? replyDetails.subject
      : `Re: ${replyDetails.subject}`,
  );
  const [toValues, setToValues] = React.useState<
    { label: string; value: string }[]
  >(
    replyDetails.to.map((to) => ({
      label: to.address ?? to.name,
      value: to.address,
    })) || [],
  );
  const [ccValues, setCcValues] = React.useState<
    { label: string; value: string }[]
  >(
    replyDetails.cc.map((cc) => ({
      label: cc.address ?? cc.name,
      value: cc.address,
    })) || [],
  );

  const sendEmail = api.account.sendEmail.useMutation();

  React.useEffect(() => {
    if (!replyDetails || !threadId) return;

    if (!replyDetails.subject.startsWith("Re: ")) {
      setSubject(`Re: ${replyDetails.subject}`);
    }

    setToValues(
      replyDetails.to.map((to) => ({
        label: to.address ?? to.name,
        value: to.address,
      })),
    );
    setCcValues(
      replyDetails.cc.map((cc) => ({
        label: cc.address ?? cc.name,
        value: cc.address,
      })),
    );
  }, [replyDetails, threadId]);

  const handleSend = async (value: string) => {
    if (!replyDetails) return;

    sendEmail.mutate(
      {
        accountId,
        threadId: threadId ?? undefined,
        body: value,
        subject,
        from: replyDetails.from,
        to: replyDetails.to.map((to) => ({
          address: to.address,
          name: to.name ?? "",
        })),
        cc: replyDetails.cc.map((cc) => ({
          address: cc.address,
          name: cc.name ?? "",
        })),
        replyTo: replyDetails.from,
        inReplyTo: replyDetails.id,
      },
      {
        onSuccess: () => {
          toast.success("Email Sent!");
        },
        onError: () => {
          console.error("Error sending email");
          toast.error("Error sending email");
        },
      },
    );
  };

  return (
    <EmailEditor
      subject={subject}
      setSubject={setSubject}
      toValues={toValues}
      setToValues={setToValues}
      ccValues={ccValues}
      setCcValues={setCcValues}
      to={replyDetails.to.map((to) => to.address)}
      handleSend={handleSend}
      isSending={sendEmail.isPending}
    />
  );
};

export default ReplyBox;
