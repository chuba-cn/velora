"use client";

import React from "react";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Text } from "@tiptap/extension-text";
import EmailEditorMenuBar from "./EmailEditorMenuBar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TagInput from "./TagInput";
import { Input } from "@/components/ui/input";
import { generateAutoCompletion } from "../actions/action";
import { readStreamableValue } from "ai/rsc";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import GhostExtension from "@/lib/extension";

const AIComposeButton = dynamic(
  () => {
    return import("./AiComposeButton");
  },
  { ssr: false },
);

type EmailEditorProps = {
  subject: string;
  setSubject: (value: string) => void;
  toValues: { label: string; value: string }[];
  setToValues: (value: { label: string; value: string }[]) => void;
  ccValues: { label: string; value: string }[];
  setCcValues: (value: { label: string; value: string }[]) => void;
  to: string[];
  handleSend: (value: string) => Promise<void>;
  isSending: boolean;
  defualtToolbarExpanded?: boolean;
};

const   EmailEditor = ({
  ccValues,
  handleSend,
  isSending,
  setCcValues,
  setSubject,
  setToValues,
  subject,
  to,
  toValues,
  defualtToolbarExpanded = false,
}: EmailEditorProps) => {
  const [ref] = useAutoAnimate();

  const [value, setValue] = React.useState<string>("");
  const [expanded, setExpanded] = React.useState<boolean>(
    defualtToolbarExpanded,
  );
  const [chunks, setChunks] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  console.log("AI loading state: ", isLoading);

  const CustomText = Text.extend({
    addKeyboardShortcuts(this) {
      return {
        "Mod-y": () => {
          void generateAiAutoComplete(this.editor.getText());
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    autofocus: false,
    extensions: [StarterKit, CustomText, GhostExtension],
    editorProps: {
      attributes: {
        placeholder: "Write your email here...",
      },
    },
    onUpdate: ({ editor }) => {
      setValue(editor.getHTML());
    },
    immediatelyRender: false,
  });

  const onGenerate = (token: string) => {
    editor?.commands?.insertContent(token);
  };

  const generateAiAutoComplete = async (editorText: string) => {
    const { output } = await generateAutoCompletion(editorText);

    for await (const chunk of readStreamableValue(output)) {
      if (chunk) setChunks(chunk);
    }
  };

  React.useEffect(() => {
    editor?.commands?.insertContent(chunks);
  }, [ editor, chunks ]);
  
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        editor &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName ?? "",
        )
      ) {
        editor.commands.focus();
      }
      if (event.key === "Escape" && editor) {
        editor.commands.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div>
      <div className="flex border-b p-4 py-2">
        <EmailEditorMenuBar editor={editor} />
      </div>

      <div ref={ref} className="space-y-2 p-4 pb-0">
        {expanded && (
          <>
            <TagInput
              label="To"
              onChange={setToValues}
              placeholder="Add Recepients"
              value={toValues}
            />
            <TagInput
              label="cc"
              onChange={setCcValues}
              placeholder="Add Recepients"
              value={ccValues}
            />
            <Input
              id="subject"
              placeholder="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </>
        )}

        <div className="flex items-center gap-2">
          <div
            className="cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="text-green-600">Draft </span>
            <span>to {to.join(", ")}</span>
          </div>
          <AIComposeButton
            isComposing={defualtToolbarExpanded}
            onGenerate={onGenerate}
            handleLoading={setIsLoading}
          />
        </div>

        {isLoading && (
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        )}
      </div>

      <div className="prose w-full px-4">
        <EditorContent editor={editor} value={value} />
      </div>

      <Separator />

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm">
          Tip: Press{" "}
          <kbd className="border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800">
            Cmd + Y
          </kbd>{" "}
          for AI autocomplete
        </span>
        <Button
          onClick={async () => {
            editor?.commands?.clearContent();
            await handleSend(value);
          }}
          disabled={isSending && !value}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default EmailEditor;
