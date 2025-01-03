"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import React from "react";

const ComposeButton = dynamic(
  () => {
    return import("./components/ComposeButton");
  },
  { ssr: false },
);

const Mail = dynamic(
  () => {
    return import("./components/Mail");
  },
  { ssr: false },
);

const MailDashboard = () => {
  return (
    <React.Fragment>
      <div className="absolute bottom-3 left-3 z-50">
        <div className="flex items-center gap-2">
          <UserButton />
          <ThemeToggle />
          <ComposeButton />
        </div>
      </div>
      <Mail
        defaultLayout={[20, 32, 48]}
        defaultCollapsed={false}
        navCollapsedSize={4}
      />
    </React.Fragment>
  );
};

export default MailDashboard;
