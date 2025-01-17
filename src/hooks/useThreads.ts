'use client'

import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import { atom, useAtom } from "jotai";
import { getQueryKey } from "@trpc/react-query";

export const threadIdAtom = atom<string | null>(null);

const useThreads = () => {
  const { data: accounts } = api.account.getAccounts.useQuery();
  const [ accountId ] = useLocalStorage("accountId", "");
  const [ tab ] = useLocalStorage<"inbox" | "draft" | "sent">("velora-tab", "inbox");
  const [ done ] = useLocalStorage<boolean>("velora-done", false);
  const [ threadId, setThreadId ] = useAtom(threadIdAtom);
  const queryKey = getQueryKey(api.account.getThreads, { accountId, tab, done }, "query");

  const { data: threads, isFetching, refetch } = api.account.getThreads.useQuery({
    accountId,
    tab,
    done
  }, {
    enabled: !!accountId && !!tab,
    placeholderData: (data) => data,
    refetchInterval: 5000
  })

  return {
    threads,
    isFetching,
    refetch,
    accountId,
    account: accounts?.find(account => account.id === accountId),
    threadId,
    setThreadId,
    queryKey
  }
};

export default useThreads;
