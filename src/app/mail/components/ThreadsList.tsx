/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";
import { format, formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";
import useThreads from "@/hooks/useThreads";
import React, { type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import useVim from "@/components/kbar/hooks/use-vim";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const ThreadsList = () => {
  const { threads, threadId, setThreadId } = useThreads();
   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const [ parent ] = useAutoAnimate();
  const {selectedThreadIds, visualMode } = useVim();

  const groupedThreads = threads?.reduce(
    (acc, thread) => {
      const date = format(thread.lastMessageDate ?? new Date(), "yyyy-MM-dd");

      if (!acc[date]) {
        acc[date] = [];
      }

      acc[date].push(thread);
      return acc;
    },
    {} as Record<string, typeof threads>,
  );
    
  return (
    <div className="max-h-[calc(100vh-120px)] max-w-full overflow-y-scroll">
      <div className="flex flex-col gap-2 p-4 pt-0" ref={parent}>
        {Object.entries(groupedThreads ?? {}).map(([date, threads]) => {
          return (
            <React.Fragment key={date}>
              <div className="mt-5 text-xs font-medium text-muted-foreground first:mt-0">
                {/* {date} */}
                {format(new Date(date), "MMMM d, yyyy")}
              </div>
              {threads.map((thread) => {
                return (
                  <button
                    id={`thread-${thread.id}`}
                    onClick={() => setThreadId(thread.id)}
                    key={thread.id}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                      visualMode &&
                        selectedThreadIds.includes(thread.id) &&
                        "bg-blue-200 dark:bg-blue-900",
                      // { "bg-accent": thread.id === threadId },
                    )}
                  >
                    {threadId === thread.id && (
                      <motion.div
                        className="absolute inset-0 z-[-1] rounded-lg bg-black/10 dark:bg-white/20"
                        layoutId="thread-list-item"
                        transition={{
                          duration: 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    <div className="flex w-full flex-col gap-2">
                      <div className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">
                            {thread.emails.at(-1)?.from.name}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "ml-auto text-xs",
                            threadId === thread.id
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {formatDistanceToNow(
                            thread.emails.at(-1)?.sentAt ?? new Date(),
                            { addSuffix: true },
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-medium">
                        {thread.subject}
                      </div>
                    </div>

                    <div
                      className="line-clamp-2 text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          thread.emails.at(-1)?.bodySnippet ?? "",
                          {
                            USE_PROFILES: { html: true },
                          },
                        ),
                      }}
                    ></div>
                    {thread.emails[0]?.sysLabels.length && (
                      <div className="flex items-center gap-2">
                        {thread.emails[0]?.sysLabels.map((label) => {
                          return (
                            <Badge
                              key={label}
                              variant={getBadgeVariantFromLabel(label)}
                            >
                              {label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const getBadgeVariantFromLabel = (label: string): ComponentProps<typeof Badge>['variant'] => {
  if ([ "work" ].includes(label.toLowerCase())) {
    return "default"
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary"
}

export default ThreadsList;
