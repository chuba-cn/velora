import React, { useCallback, useEffect, useRef, useState } from "react";

interface Item {
  id: number;
  name: string
}

const InfiniteScrollList: React.FC = () => {

  const [ items, setItems ] = useState<Item[]>([]);
  const [ page, setPage ] = useState<number>(1);
  const [ hasMore, setHasMore ] = useState<boolean>(true);
  const [ loading, setLoading ] = useState<boolean>(false);

  const observer = useRef<IntersectionObserver | null>(null)
  
  //Manually fetch data
  const fetchItems = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/items?page=${page}`)
      if (!response.ok) {
        throw new Error("Failed to fetch items")
      }

      const data = (await response.json()) as { items: Item[], nextPage: number | null };
      setItems((prevItems) => [ ...prevItems, ...items ]);
      setHasMore(data.nextPage !== null)
      setPage(data.nextPage ?? page + 1)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false);
    }
  },  [items])

  useEffect(() => {
    void fetchItems(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entires) => {
      if (entires[ 0 ]?.isIntersecting && hasMore) {
        void fetchItems(page)
      }
    });

    if (node) observer.current.observe(node);
  }, [ fetchItems, hasMore, loading, page ]);

  return (
    <div className="list-container">
      {items.map((item, index) => {
        const isLastItem = index === items.length - 1;
        return (
          <div
            key={item.id}
            ref={isLastItem ? lastItemRef : null}
            className="list-item"
          >
            {item.name}
          </div>
        );
      })}

      {loading && <p>Loading more...</p>}
    </div>
  );
}

export default InfiniteScrollList