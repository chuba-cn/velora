/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useAtom } from "jotai";
import React, { Suspense } from "react";
import { isSearchingAtom, searchValueAtom } from "./SearchBar";
import { api } from "@/trpc/react";
import { useDebounceValue } from "usehooks-ts";
import useThreads from "@/hooks/useThreads";
import DOMPurify from "dompurify";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type EmailDocument = {
  subject: string;
  from: string;
  to: string[];
  rawBody: string;
  threadId: string;
  sentAt: string;
  body: string;
};

type SearchHit = {
  id: string;
  document: EmailDocument;
  score: number;
};

interface SearchResults {
  hits: SearchHit[];
}

type EmailHitProps = {
  hit: SearchHit;
};

type SearchResultsProps = {
  searchResults: SearchResults | undefined;
};

const EmailHit = ({ hit }: EmailHitProps) => {
  const { setThreadId } = useThreads();
  const [_, setIsSearching] = useAtom(isSearchingAtom);

  return (
    <li
      className="cursor-pointer list-none rounded-md border p-4 transition-all hover:bg-gray-100 dark:hover:bg-gray-900"
      onClick={() => {
        if (!hit.document.threadId) {
          toast.error("This message is not part of a thread");
          return;
        }

        setIsSearching(false);
        setThreadId(hit.document.threadId);
      }}
    >
      <h3 className="text-base font-medium">{hit.document.subject}</h3>
      <p className="text-sm text-gray-500">{hit.document.from}</p>
      <p className="text-sm text-gray-500">{hit.document.to.join(", ")}</p>
      <p
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(hit.document.rawBody, {
            USE_PROFILES: { html: true, svg: true },
          }),
        }}
        className="mt-2 text-sm"
      ></p>
    </li>
  );
};

const SearchResults = ({ searchResults }: SearchResultsProps) => {
  if (searchResults?.hits?.length === 0) {
    return <p>No emails found matching your search query</p>;
  }

  return (
    <>
      {searchResults?.hits.map((hit) => (
        <ul key={hit.id} className="flex flex-col gap-2">
          <EmailHit hit={hit} />
        </ul>
      ))}
    </>
  );
};

const SearchLoader = () => {
  return (
    <div className="flex flex-col items-start justify-between space-y-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
};

const SearchDisplay = () => {
  const [searchValue] = useAtom(searchValueAtom);
  const [debouncedSearchValue] = useDebounceValue(searchValue, 500);
  const deferredSearchValue = React.useDeferredValue(searchValue);

  const { accountId } = useThreads();
  const search = api.account.searchEmails.useMutation();

  React.useEffect(() => {
    if (!debouncedSearchValue || !accountId) return;

    search.mutate({
      accountId,
      query: debouncedSearchValue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue, accountId]);

  const showSkeleton = search.isPending && !search.data;

  return (
    <div className="max-h-[calc(100vh-50px)] overflow-y-scroll p-4">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm text-gray-600 dark:text-gray-400">
          Your search for &quot;{searchValue}&quot; came back with...
        </h2>
        {search.isPending && (
          <Loader2 className="size-4 animate-spin text-gray-400" />
        )}
      </div>

      {showSkeleton ? (
        <SearchLoader />
      ) : (
        <div className={search.isPending ? "opacity-50" : ""}>
          <SearchResults
            searchResults={
              search.data
                ? {
                    hits: search.data.hits.map((hit) => ({
                      id: hit.id,
                      document: {
                        subject: hit.document.subject as string,
                        from: hit.document.from as string,
                        to: hit.document.to as string[],
                        rawBody: hit.document.rawBody as string,
                        threadId: hit.document.threadId as string,
                        sentAt: hit.document.sentAt as string,
                        body: hit.document.body as string,
                      },
                      score: hit.score,
                    })),
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
};

export default SearchDisplay;
