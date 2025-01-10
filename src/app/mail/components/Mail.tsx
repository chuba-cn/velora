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
import SearchBar from "./SearchBar";
import AskAI from "./AskAI";
import { useLocalStorage } from "usehooks-ts";
import type { LayoutData, CollapsedData } from "@/lib/cookieReader";



type MailProps = {
  defaultLayout: LayoutData | undefined;
  navCollapsedSize: number;
  defaultCollapsed: CollapsedData | undefined;
};

const Mail = ({
  defaultLayout = { columns: [30, 25, 45] },
  navCollapsedSize,
  defaultCollapsed = {isCollapsed: false}
}: MailProps) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed.isCollapsed);
  const [done, setDone] = useLocalStorage("velora-done", false);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={ (sizes: number[]) => {
          const layoutData: LayoutData = {
            columns: sizes as [number, number, number],
          };
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
            layoutData,
          )}`;
        }}
        className="h-full min-h-screen items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout.columns[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={40}
          onCollapse={() => {
            setIsCollapsed(true);
            const collapsedData: CollapsedData = { isCollapsed: true };
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              collapsedData,
            )}`;
          }}
          onResize={() => {
            setIsCollapsed(false);
            const collapsedData: CollapsedData = { isCollapsed: false };
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              collapsedData,
            )}`;
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
            <AskAI isCollapsed={isCollapsed} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={defaultLayout.columns[1]} minSize={20}>
          <Tabs
            defaultValue="inbox"
            value={done ? "done" : "inbox"}
            onValueChange={(tab) => {
              if (tab === "done") {
                setDone(true);
              } else {
                setDone(false);
              }
            }}
          >
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
            <SearchBar />
            <TabsContent value="inbox" className="m-0">
              <ThreadsList />
            </TabsContent>
            <TabsContent value="done" className="m-0">
              <ThreadsList />
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={defaultLayout.columns[2]} minSize={30}>
          {/* Threads Display */}
          <ThreadsDisplay />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
};

export default Mail;
