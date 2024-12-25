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

const EmailEditor = ({
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
  const [value, setValue] = React.useState<string>("");
  const [expanded, setExpanded] = React.useState<boolean>(
    defualtToolbarExpanded
  );

  const CustomText = Text.extend({
    addKeyboardShortcuts() {
      return {
        "Meta-j": () => {
          console.log("Meta-j");
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    autofocus: false,
    extensions: [StarterKit, CustomText],
    onUpdate: ({ editor }) => {
      setValue(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div>
      <div className="flex border-0 p-4 py-2">
        <EmailEditorMenuBar editor={editor} />
      </div>

      <div className="space-y-2 p-4 pb-0">
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
        </div>
      </div>

      <div className="prose w-full px-4">
        <EditorContent editor={editor} value={value} />
      </div>

      <Separator />

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm">
          Tip: Press{" "}
          <kbd className="border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800">
            Cmd + J
          </kbd>{" "}
          for AI autocomplete
        </span>
        <Button
          onClick={async () => {
            editor?.commands?.clearContent();
            await handleSend(value);
          }}
          disabled={isSending}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default EmailEditor;
