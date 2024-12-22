'use client';

import { useLocalStorage } from "usehooks-ts";
import Nav from "./Nav";
import { File, Inbox, Send } from "lucide-react";
import { api } from "@/trpc/react";

type SidebarProps = {
  isCollapsed: boolean;
}

const Sidebar = ({isCollapsed}: SidebarProps) => {
  const [ accountId ] = useLocalStorage("accountId", "");
  const [ tab ] = useLocalStorage<"inbox" | "draft" | "sent">("velora-tab", "inbox");

  const getThreads = (threadType: "inbox" | "draft" | "sent") => { 
    return api.account.getNumThreads.useQuery({
      accountId,
      tab: threadType
    })
  }

  const { data: inboxThreads } = getThreads("inbox");
  const { data: draftThreads } = getThreads("draft");
  const { data: sentThreads } = getThreads("sent");

  return (
    <Nav
      isCollapsed={ isCollapsed }
      links={ [
        {
          title: "Inbox",
          label: inboxThreads?.toString() ?? "0",
          icon: Inbox,
          variant: tab === "inbox" ? "default" : "ghost"
        },
        {
          title: "Draft",
          label: draftThreads?.toString() ?? "0",
          icon: File,
          variant: tab === "draft" ? "default" : "ghost"
        },
        {
          title: "Sent",
          label: sentThreads?.toString() ?? "0",
          icon: Send,
          variant: tab === "sent" ? "default" : "ghost"
        }
      ]}
    />
  )
}

export default Sidebar