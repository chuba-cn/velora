import { getCookieData } from "@/lib/cookieReader"
import MailDashboardClient from "./components/MailDashboardClient";

export default async function MailDashboardPage() {
  const { defaultLayout, defaultCollapsed } = await getCookieData();

  return (
    <MailDashboardClient
      defaultLayout={defaultLayout}
      defaultCollapsed={defaultCollapsed}
    />
  );
}
