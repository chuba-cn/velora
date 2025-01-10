import { cookies } from "next/headers";

export interface LayoutData {
  columns: [number, number, number];
}

export interface CollapsedData {
  isCollapsed: boolean;
}

interface CookieData {
  defaultLayout?: LayoutData;
  defaultCollapsed?: CollapsedData;
}

export async function getCookieData(): Promise<CookieData> {
  const cookieStore = await cookies();

  let defaultLayout: LayoutData | undefined;
  let defaultCollapsed: CollapsedData | undefined;

  try {
    const layoutCookie = cookieStore.get("react-resizable-panels:layout:mail");
    if (layoutCookie) {
      defaultLayout = JSON.parse(layoutCookie.value) as LayoutData;
    }
  } catch (e) {
    console.error("Failed to parse layout cookie:", e);
  }

  try {
    const collapsedCookie = cookieStore.get("react-resizable-panels:collapsed");
    if (collapsedCookie) {
      defaultCollapsed = JSON.parse(collapsedCookie.value) as CollapsedData;
    }
  } catch (e) {
    console.error("Failed to parse collapsed cookie:", e);
  }

  return {
    defaultLayout,
    defaultCollapsed,
  };
}
