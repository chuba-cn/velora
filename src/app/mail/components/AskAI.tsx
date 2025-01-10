/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

// import React from "react";
// import { AnimatePresence, motion } from "motion/react";
// import { cn } from "@/lib/utils";
// import { Send, SparklesIcon, Trash } from "lucide-react";
// import { useChat } from "ai/react";
// import useThreads from "@/hooks/useThreads";
// import { toast } from "sonner";

// const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
//   const { accountId } = useThreads();
//   const { input, handleInputChange, handleSubmit, messages, setMessages} = useChat({
//     api: "/api/chat",
//     body: {
//       accountId,
//     },
//     onError: (error) => {
//       if (error.message.includes("Limit reached")) {
//         toast.error(
//           "You have reached the limit for today. Please upgrade to pro to ask as many questions as you want",
//         );
//       }
//     },
//     initialMessages: [],
//   });

//   const handleDelete = (id: string) => {
//     setMessages(messages.filter(message => message.id !== id));
//   }

//   React.useEffect(() => {
//     const messageContainer = document.getElementById("message-container");

//     if (messageContainer) {
//       messageContainer.scrollTo({
//         top: messageContainer.scrollHeight,
//         behavior: "smooth"
//       })
//     }
//   }, [ messages ]);

//   if (isCollapsed) return null;

//   return (
//     <div className="mb-14 p-4">
//       <motion.div className="flex flex-1 flex-col items-end justify-end rounded-lg border bg-gray-100 p-4 pb-4 shadow-inner dark:bg-gray-900">
//         <div
//           className="flex max-h-[50vh] w-full flex-col gap-2 overflow-y-scroll"
//           id="message-container"
//         >
//           <AnimatePresence mode="wait">
//             {messages.map((message) => {
//               return (
//                 <motion.div
//                   key={message.id}
//                   layout="position"
//                   className={cn(
//                     "z-10 mt-2 max-w-[250px] break-words rounded-2xl bg-gray-200 dark:bg-gray-800",
//                     {
//                       "self-end text-gray-900 dark:text-gray-100":
//                         message.role === "user",
//                       "self-start bg-blue-500 text-white dark:bg-blue-700":
//                         message.role === "assistant",
//                     },
//                   )}
//                   layoutId={`container-[${messages.length - 1}]`}
//                   transition={{
//                     type: "tween",
//                     duration: 0.2,
//                   }}
//                 >
//                   <div className="px-3 py-2 text-[15px] leading-[15px]">
//                     {message.content}
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </AnimatePresence>
//         </div>

//         {messages.length > 0 && <div className="h-4" />}

//         <div className="w-full">
//           {messages.length === 0 && (
//             <div className="mb-4">
//               <div className="flex items-center gap-4">
//                 <SparklesIcon className="size-6 text-green-600" />
//                 <div>
//                   <p className="text-gray-900 dark:text-gray-100">
//                     Ask AI anything about your emails
//                   </p>
//                   <p className="text-xs text-gray-500 dark:text-gray-400">
//                     Get answers to questions about your emails
//                   </p>
//                 </div>
//               </div>
//               <div className="h-2"></div>
//               <div className="flex flex-wrap items-center gap-2">
//                 <span
//                   onClick={() => {
//                     handleInputChange({
//                       target: { value: "What can I ask?" },
//                     } as React.ChangeEvent<HTMLInputElement>);
//                   }}
//                   className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200"
//                 >
//                   What can I ask?
//                 </span>
//                 <span
//                   onClick={() => {
//                     handleInputChange({
//                       target: { value: "When is my next flight?" },
//                     } as React.ChangeEvent<HTMLInputElement>);
//                   }}
//                   className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200"
//                 >
//                   When is my next flight?
//                 </span>
//                 <span
//                   onClick={() => {
//                     const event = {
//                       target: { value: "When is my next meeting?" },
//                     } as React.ChangeEvent<HTMLInputElement>;
//                     handleInputChange(event);
//                   }}
//                   className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200"
//                 >
//                   When is my next meeting?
//                 </span>
//               </div>
//             </div>
//           )}
//           <form className="flex w-full" onSubmit={handleSubmit}>
//             <input
//               className="text[15px] relative h-9 flex-grow rounded-full border border-gray-200 bg-white px-3 py-1 outline-none placeholder:text-[13px] placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus-visible:ring-blue-500/20 dark:focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-700"
//               placeholder="Ask AI anything about your emails"
//               value={input}
//               onChange={handleInputChange}
//             />
//             <motion.div
//               key={messages.length}
//               className="pointer-events-none absolute z-10 flex h-9 w-[250px] items-center overflow-hidden break-words rounded-full bg-gray-200 [word-break:break-word] dark:bg-gray-800"
//               layout="position"
//               layoutId={`container-[${messages.length}]`}
//               transition={{
//                 type: "tween",
//                 duration: 0.2,
//               }}
//               initial={{ opacity: 0.6, zIndex: -1 }}
//               animate={{ opacity: 0.6, zIndex: -1 }}
//               exit={{ opacity: 1, zIndex: 1 }}
//             >
//               <div className="px-3 py-2 text-[15px] leading-[15px] text-gray-900 dark:text-gray-100">
//                 {input}
//               </div>
//             </motion.div>
//             <button
//               className="ml-2 flex size-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800"
//               type="submit"
//             >
//               <Send className="size-4 text-gray-500 dark:text-gray-300" />
//             </button>
//           </form>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default AskAI;

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Send, SparklesIcon, Trash, RefreshCw, Loader2 } from "lucide-react";
import { useChat } from "ai/react";
import useThreads from "@/hooks/useThreads";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PremiuimBanner from "./PremiuimBanner";
import { api } from "@/trpc/react";

const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { accountId } = useThreads();
  const utils = api.useUtils();
  const {
    input,
    handleInputChange,
    handleSubmit,
    messages,
    setMessages,
    isLoading,
    error,
    reload,
  } = useChat({
    api: "/api/chat",
    body: { accountId },
    onError: (error) => {
      if (error.message.includes("You have reached the free limit")) {
        toast.error(
          "You have reached the limit for today. Please upgrade to the pro plan to get unlimited messages.",
        );
      }
    },
    onFinish: () => {
      void utils.account.getChatbotInteractionsCount.refetch();
    }
  });

  React.useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (isCollapsed) return null;

  return (
    <div className="mx-auto mb-14 w-full max-w-2xl p-4">
      <PremiuimBanner />

      <div className="h-4"></div>

      <motion.div className="flex flex-1 flex-col items-end justify-end rounded-lg border bg-gray-100 p-4 pb-4 shadow-inner dark:bg-gray-900">
        <div
          className="flex max-h-[50vh] w-full flex-col gap-2 overflow-y-auto overflow-x-hidden"
          id="message-container"
        >
          <AnimatePresence mode="wait">
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                <motion.div
                  layout="position"
                  layoutId={`container-[${messages.length - 1}]`}
                  transition={{
                    type: "tween",
                    duration: 0.2,
                  }}
                  className={cn(
                    "group relative z-10 mt-2 max-w-[80%] break-words rounded-2xl px-3 py-2 sm:max-w-[70%]",
                    {
                      "self-end bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100":
                        message.role === "user",
                      "self-start bg-blue-500 text-white dark:bg-blue-700":
                        message.role === "assistant",
                    },
                  )}
                >
                  <div className="text-sm">{message.content}</div>
                </motion.div>
              </React.Fragment>
            ))}
            {isLoading && (
              <motion.div className="mb-4 mt-2 self-start">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-4 w-full rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {"Something went wrong. Please retry"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reload()}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {messages.length > 0 && <div className="h-4" />}

        {messages.length === 0 && (
          <div className="mb-4 w-full">
            <div className="flex items-center gap-4">
              <SparklesIcon className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-gray-900 dark:text-gray-100">
                  Ask AI anything about your emails
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get answers to questions about your emails
                </p>
              </div>
            </div>
            <div className="h-2" />
            <div className="flex flex-wrap items-center gap-2">
              {[
                "What can I ask?",
                "When is my next flight?",
                "When is my next meeting?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() =>
                    handleInputChange({
                      target: { value: suggestion },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="flex w-full" onSubmit={handleSubmit}>
          <input
            type="text"
            className="py- relative h-9 flex-grow rounded-full border border-gray-200 bg-white px-3 text-[15px] outline-none placeholder:text-[13px] placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus-visible:ring-blue-500/20 dark:focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-700"
            placeholder="Ask AI anything about your emails"
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button
            className={cn(
              "ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800",
              isLoading && "cursor-not-allowed opacity-50",
            )}
            type="submit"
            disabled={isLoading}
          >
            <Send className="h-4 w-4 text-gray-500 dark:text-gray-300" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AskAI;
