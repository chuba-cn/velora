"use client";

import ThemeToggle from "@/components/ThemeToggle";
import dynamic from "next/dynamic";
import React from "react";

const Mail = dynamic(
  () => {
    return import("./components/Mail");
  },
  { ssr: false },
);

const MailDashboard = () => {
  return (
    <React.Fragment>
      <div className="absolute bottom-8 left-8">
        <ThemeToggle />
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
