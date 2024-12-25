/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { api } from "@/trpc/react"
import {useRegisterActions} from "kbar";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

const useAccountSwitching = () => {
  const { data: accounts } = api.account.getAccounts.useQuery();
  const [ _, setAccountId ] = useLocalStorage("accountId", "");

  //Some fake data for demonstration purposes
  const mainAction = [
    {
      id: "accountsAction",
      name: "Switch Account",
      shortcut: [ "e", "s" ],
      section: "Accounts"
    }
  ];

  React.useEffect(() => { 
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey && /^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const index = parseInt(event.key) - 1;
        if (accounts && accounts.length > index) {
          setAccountId(accounts[ index ]!.id);
        }
      }
    }

    window.addEventListener("keydown", handler);
    
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [ accounts, setAccountId ]);

  useRegisterActions(mainAction.concat((accounts?.map((acc, index) => {
    return {
      id: acc.id,
      name: acc.name,
      parent: "accountsAction",
      perform: () => {
        setAccountId(acc.id)
      },
      keywords: [ acc.name, acc.emailAddress ].filter(Boolean),
      shortcut: [],
      section: "Accounts",
      subtitle: acc.emailAddress,
      priority: 1000
    }
  })) ?? []), [accounts])
}

export default useAccountSwitching