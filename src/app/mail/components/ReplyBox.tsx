/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import EmailEditor from "./EmailEditor";
import useThreads from "@/hooks/useThreads";
import { api, type RouterOutputs } from "@/trpc/react";
import { Loader2 } from "lucide-react";

const ReplyBox = () => {
  const { accountId, threadId } = useThreads();
  const { data: replyDetails } = api.account.getReplyDetails.useQuery({
    accountId,
    threadId: threadId ?? "",
    replyType: "reply",
  });

  if (!replyDetails) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2  size={20} className="animate-spin dark:text-white text-black/40"/>
      </div>
    )
  };

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
    replyDetails.to.map((to) => ({ label: to.address ?? to.name, value: to.address })) ||
      [],
  );
  const [ccValues, setCcValues] = React.useState<
    { label: string; value: string }[]
  >(
    replyDetails.cc.map((cc) => ({
      label: cc.address ?? cc.name,
      value: cc.address,
    })) || [],
  );

  // const sendEmail = api.mail.sendEmail.useMutation();

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

  }, [ replyDetails, threadId ])
  
   const handleSend = async (value: string) => {
     console.log("Email Sent", value);
   };

  return (
    <EmailEditor
      subject={ subject }
      setSubject={ setSubject }
      
      toValues={ toValues }
      setToValues={ setToValues }
      
      ccValues={ ccValues }
      setCcValues={ setCcValues }
      
      to={ replyDetails.to.map(to => to.address) }
      handleSend={ handleSend }
      isSending={false}
    />
  )
};

export default ReplyBox;
