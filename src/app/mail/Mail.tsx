"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TabsContent } from "@radix-ui/react-tabs";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useState } from "react";
import AccountSwitcher from "./AccountSwitcher";
import Sidebar from "./Sidebar";
import ThreadsList from "./ThreadsList";
import ThreadsDisplay from "./ThreadsDisplay";

type MailProps = {
  defaultLayout: number[] | undefined;
  navCollapsedSize: number;
  defaultCollapsed: boolean;
};

const Mail = ({
  defaultLayout = [20, 32, 48],
  navCollapsedSize,
  defaultCollapsed,
}: MailProps) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes) => {
          console.log(sizes);
        }}
        className="h-full min-h-screen items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={40}
          onCollapse={() => {
            setIsCollapsed(true);
          }}
          onResize={() => {
            setIsCollapsed(false);
          }}
          className={cn(
            isCollapsed &&
              `min-w-[50px] transition-all duration-300 ease-in-out`,
          )}
        >
          <div className="flex h-full flex-1 flex-col">
            <div
              className={cn(
                `flex h-[52px] items-center justify-between`,
                isCollapsed ? "h-[52px]" : "px-2",
              )}
            >
              {/* Account Switcher */}
              <AccountSwitcher isCollapsed={false} />
            </div>
            <Separator />
            {/* Sidebar */}
            <Sidebar isCollapsed={isCollapsed} />
            <div className="flex-1"></div>
            {/* AI */}
            Ask AI
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="inbox">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="inbox"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Inbox
                </TabsTrigger>
                <TabsTrigger
                  value="done"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Done
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            {/* Search Bar */}
            Search Bar
            <TabsContent value="inbox">
              <ThreadsList />
            </TabsContent>
            <TabsContent value="done">
              <ThreadsList />
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          {/* Threads Display */}
          <ThreadsDisplay />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
};

export default Mail;