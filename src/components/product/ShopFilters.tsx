"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useUpdateShopQuery() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };
}

export function InStockOnlyFilter({ checked }: { checked: boolean }) {
  const updateQuery = useUpdateShopQuery();

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => updateQuery("inStock", event.target.checked ? "true" : undefined)}
      className="rounded border-brand-mocha/30 text-brand-mocha focus:ring-brand-gold"
    />
  );
}

export function ShopSortSelector({
  sort,
}: {
  sort: "newest" | "price_asc" | "price_desc" | "popularity";
}) {
  const updateQuery = useUpdateShopQuery();

  return (
    <select
      value={sort}
      onChange={(event) => updateQuery("sort", event.target.value)}
      className="bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-1.5 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold cursor-pointer"
      aria-label="Sort products"
    >
      <option value="newest">Newest First</option>
      <option value="popularity">Popularity (Orders)</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
