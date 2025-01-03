/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "../actions/action";
import { readStreamableValue } from "ai/rsc";
import useThreads from "@/hooks/useThreads";
import { turndown } from "@/lib/turndown";

type AIComposeButtonProps = {
  isComposing: boolean;
  onGenerate: (token: string) => void;
  handleLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const AIComposeButton = ({
  isComposing,
  onGenerate,
  handleLoading,
}: AIComposeButtonProps) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [prompt, setPrompt] = React.useState<string>("");
  const { threads, threadId, account } = useThreads();

  const thread = threads?.find((t) => t.id === threadId);

  const aiGenerate = async () => {
    let context = "";

    if (!isComposing) {
      for (const email of thread?.emails ?? []) {
        const content = `
          Subject: ${email.subject}
          From: ${email.from.name}
          Sent: ${new Date(email.sentAt).toLocaleString()}
          Body: ${turndown.turndown(email.body ?? email.bodySnippet ?? "")}
        `;
        context += content;
      }
    }

    context += `My name is ${account?.name} amd my email is ${account?.emailAddress}`;

    const { output, loadingState } = await generateEmail(context, prompt);

    for await (const token of readStreamableValue(output)) {
      if (token) {
        onGenerate(token);
      }
    }

    for await (const loadingDelta of readStreamableValue(loadingState)) {
      if (loadingDelta) {
        handleLoading(loadingDelta.loading);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" onClick={() => setIsOpen(true)}>
          <Bot className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Smart Compose</DialogTitle>
          <DialogDescription>
            AI will help you compose your email.
          </DialogDescription>
          <div className="h-2"></div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt"
          />
          <div className="h-2"></div>
          <Button
            onClick={() => {
              void aiGenerate();
              setIsOpen(false);
              setPrompt("");
            }}
          >
            Generate
          </Button>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AIComposeButton;
