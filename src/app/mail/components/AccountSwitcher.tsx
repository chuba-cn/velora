"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAurinkoAuthUrl } from "@/lib/aurinko";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";

type AccountSwitcherProps = {
  isCollapsed: boolean;
};

const AccountSwitcher = ({ isCollapsed }: AccountSwitcherProps) => {
  const { data } = api.account.getAccounts.useQuery();
  const [accountId, setAccountId] = useLocalStorage("accountId", "");

  if (!data) return null;

  return (
    <Select defaultValue={accountId} onValueChange={setAccountId}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&_svg]:hidden",
        ) }
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          <span className={cn({"hidden": !isCollapsed})}>
            {data.find(account => account.id === accountId)?.emailAddress[0]}
          </span>
          <span className={cn({"hidden": isCollapsed, "ml-2": true})}>
            {data.find(account => account.id === accountId)?.emailAddress}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        { data.map((account) => {
          return (
            <SelectItem key={account.id} value={account.id}>
              {account.emailAddress}
            </SelectItem>
          )
        }) }
        
        <div
          onClick={ async () => {
            try {
              const authUrl = await getAurinkoAuthUrl("Google");
              window.location.href = authUrl;
            } catch (error) {
              if (error instanceof Error && error.message.includes("You have reached the maximum number of accounts for your subscription")) {
                toast.error(
                  "You have reached the maximum number of accounts for your subscription",
                );
              }
            }
          }}
          className="flex relative hover:bg-gray-50 w-full cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent"
        >
          <Plus className="size-4 mr-1" />
          Add account
        </div>
      </SelectContent>
    </Select>
  );
};

export default AccountSwitcher;
