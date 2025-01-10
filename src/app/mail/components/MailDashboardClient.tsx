"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import React from "react";
import type { LayoutData, CollapsedData } from "@/lib/cookieReader";

const ComposeButton = dynamic(
  () => {
    return import("../components/ComposeButton");
  },
  { ssr: false },
);

const Mail = dynamic(
  () => {
    return import("../components/Mail");
  },
  { ssr: false },
);

interface MailDashboardClientProps {
  defaultLayout?: LayoutData;
  defaultCollapsed?: CollapsedData;
}

const MailDashboardClient: React.FC<MailDashboardClientProps> = ({
  defaultLayout,
  defaultCollapsed,
}) => {
  return (
    <React.Fragment>
      <div className="absolute bottom-3 left-3 z-50">
        <div className="flex items-center gap-2">
          <UserButton />
          <ThemeToggle />
          <ComposeButton />
        </div>
      </div>
      <div className="hidden h-screen flex-col overflow-scroll md:flex">
        <Mail
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </div>
    </React.Fragment>
  );
};

export default MailDashboardClient;