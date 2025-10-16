import { useCallback, useEffect, useMemo, useState } from "react";
import GenderCategoryNavbar from "../../components/user/common/GenderCategoryNavbar.jsx";
import AdvancedFilters, {
  SORT_OPTIONS,
} from "../../components/common/AdvancedFilters.jsx";
import ProductGrid from "../../components/common/ProductGrid.jsx";
import { fetchProducts } from "../../api/catalog.js";
import { fetchCategories } from "../../api/categories.js";

const toTitleCase = (value = "") =>
  value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const DEFAULT_CATEGORY_OPTIONS = [
  { label: "All Products", value: "all" },
  { label: "Sarees", value: "sarees" },
  { label: "Kurtis", value: "kurtis" },
  { label: "Kurta Sets", value: "kurta-sets" },
  { label: "Dupatta Sets", value: "dupatta-sets" },
  { label: "Suits & Dress Material", value: "suits-dress-material" },
  { label: "Lehengas", value: "lehengas" },
  { label: "Other Ethnic", value: "other-ethnic" },
];

const HERO_HIGHLIGHTS = [
  {
    id: "delivery",
    badge: "FD",
    title: "Fast Delivery",
    description: "Delivery in 2-3 days",
  },
  {
    id: "location",
    badge: "IN",
    title: "Location",
    description: "Pan India delivery",
  },
  {
    id: "offer",
    badge: "OF",
    title: "Special Offer",
    description: "Free shipping on orders above Rs 999",
  },
];

const DEFAULT_FILTERS = {
  category: "all",
  subcategory: "all",
  gender: "all",
  colors: [],
  sizes: [],
  priceRanges: [],
  minRating: null,
};

const HomePage = ({ isLoggedIn }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryOptions, setCategoryOptions] = useState(
    DEFAULT_CATEGORY_OPTIONS
  );
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [productsLimit, setProductsLimit] = useState(48);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortOption, setSortOption] = useState("relevance");
  const [hasApiCategories, setHasApiCategories] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const loadCategories = useCallback(async ({ signal } = {}) => {
    setCategoryLoading(true);
    setCategoryError(null);

    try {
      const { categories } = await fetchCategories({}, { signal });

      if (signal?.aborted) {
        return;
      }

      const apiOptions = (Array.isArray(categories) ? categories : [])
        .map((category) => {
          const value =
            category.slug ?? category.id ?? category.name ?? category.raw?.slug;

          if (!value) {
            return null;
          }

          const rawValue = value.toString().trim();
          const normalizedValue = rawValue
            .toLowerCase()
            .replace(/[\s&]+/g, "-")
            .replace(/-+/g, "-");

          return {
            value: normalizedValue,
            label: category.name ?? toTitleCase(rawValue),
          };
        })
        .filter(Boolean);

      if (!apiOptions.length) {
        setHasApiCategories(false);
        return;
      }

      setCategoryOptions(() => {
        const map = new Map();

        DEFAULT_CATEGORY_OPTIONS.forEach((option) => {
          map.set(option.value, option);
        });

        apiOptions.forEach((option) => {
          if (option.value === "all") {
            map.set("all", {
              value: "all",
              label: option.label ?? "All Products",
            });
            return;
          }

          if (!map.has(option.value)) {
            map.set(option.value, option);
            return;
          }

          const existing = map.get(option.value);
          map.set(option.value, {
            ...existing,
            label: option.label ?? existing.label,
          });
        });

        return Array.from(map.values());
      });

      setHasApiCategories(true);
      setFilters((previous) => ({
        ...previous,
        category: apiOptions.some(
          (option) => option.value === previous.category
        )
          ? previous.category
          : "all",
      }));
    } catch (apiError) {
      if (signal?.aborted) {
        return;
      }

      setCategoryError(apiError);
      setHasApiCategories(false);
    } finally {
      if (!signal?.aborted) {
        setCategoryLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCategories({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadCategories]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 240);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const loadProducts = useCallback(
    async ({ signal } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const query = { limit: productsLimit };

        // Apply filters to query
        if (filters.category && filters.category !== "all") {
          query.category = filters.category;
        }
        if (filters.subcategory && filters.subcategory !== "all") {
          query.category = filters.subcategory; // Use subcategory as the actual category filter
        }
        if (filters.gender && filters.gender !== "all") {
          query.targetGender = filters.gender;
        }
        if (filters.colors && filters.colors.length > 0) {
          query.colors = filters.colors.join(",");
        }
        if (filters.sizes && filters.sizes.length > 0) {
          query.sizes = filters.sizes.join(",");
        }
        if (filters.minRating) {
          query.minRating = filters.minRating;
        }
        if (filters.priceRanges && filters.priceRanges.length > 0) {
          const minPrice = Math.min(...filters.priceRanges.map((r) => r.min));
          const maxPrice = Math.max(...filters.priceRanges.map((r) => r.max));
          query.minPrice = minPrice;
          query.maxPrice = maxPrice;
        }
        if (sortOption && sortOption !== "relevance") {
          query.sort = sortOption;
        }

        const { items, total } = await fetchProducts(query, { signal });

        if (signal?.aborted) {
          return;
        }

        const nextProducts = Array.isArray(items) ? items : [];
        setProducts(nextProducts);
        const totalNumber = Number(total);
        setTotalProducts(
          Number.isFinite(totalNumber) ? totalNumber : nextProducts.length
        );

        if (!hasApiCategories && nextProducts.length) {
          const derivedMap = new Map();

          nextProducts.forEach((product) => {
            const value = product.category;
            if (!value) {
              return;
            }

            const normalizedValue = value
              .toString()
              .trim()
              .toLowerCase()
              .replace(/[\s&]+/g, "-")
              .replace(/-+/g, "-");

            if (!derivedMap.has(normalizedValue)) {
              derivedMap.set(normalizedValue, {
                value: normalizedValue,
                label: toTitleCase(normalizedValue),
              });
            }
          });

          if (derivedMap.size) {
            setCategoryOptions((current) => {
              const map = new Map();

              DEFAULT_CATEGORY_OPTIONS.forEach((option) => {
                map.set(option.value, option);
              });

              current.forEach((option) => {
                if (option?.value && !map.has(option.value)) {
                  map.set(option.value, option);
                }
              });

              derivedMap.forEach((option, key) => {
                if (!map.has(key)) {
                  map.set(key, option);
                }
              });

              return Array.from(map.values());
            });
          }
        }
      } catch (apiError) {
        if (signal?.aborted) {
          return;
        }

        setError(apiError);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [hasApiCategories, filters, sortOption, productsLimit]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadProducts({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matches = products.filter((product) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [product.title, product.brand, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    // Products are already filtered by the API based on filters
    // Just apply search term filtering here
    return matches;
  }, [products, searchTerm]);

  const handleRetryCategories = () => {
    if (!categoryLoading) {
      loadCategories();
    }
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm("");
    setProductsLimit(48);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleLoadMoreItems = () => {
    setProductsLimit((previous) => previous + 24);
  };

  const handleScrollToTop = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedCount = filteredProducts.length;
  const totalCount = totalProducts || displayedCount;

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "category") return value !== "all";
    if (key === "subcategory") return value !== "all";
    if (key === "gender") return value !== "all";
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== "";
  });

  const isDefaultView = !hasActiveFilters && searchTerm.trim() === "";

  return (
    <div className="min-h-screen bg-background text-text-base">
      <GenderCategoryNavbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={setSearchTerm}
        isLoggedIn={isLoggedIn}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
  {/* Header Section */}
  <div className="mb-10 text-center">
    <h1 className="text-4xl font-bold tracking-tight text-text-base">
      Products For You
    </h1>
    <p className="mt-3 text-base text-text-muted">
      Discover our complete collection with advanced filters
    </p>
  </div>

  <div className="flex flex-col gap-8 lg:flex-row">
    {/* Filters Sidebar */}
    <AdvancedFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      productCount={totalCount}
      onClearFilters={handleClearFilters}
    />

    {/* Main Content */}
    <div className="flex-1 space-y-6 rounded-2xl border border-secondary/40 bg-secondary/20 p-6 shadow-xl shadow-black/40">
      {/* Sort and Results Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Showing {displayedCount} of {totalCount} products
        </p>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
          {!isDefaultView && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm font-semibold text-primary transition-opacity hover:opacity-80"
            >
              Clear all filters
            </button>
          )}

          <div className="w-full sm:w-48">
            <label className="sr-only" htmlFor="homepage-sort">
              Sort products
            </label>
            <select
              id="homepage-sort"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              className="w-full rounded-lg border border-secondary/60 bg-background px-3 py-2 text-sm text-text-base transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {SORT_OPTIONS.map((option) => (
                <option
  key={option.value}
  value={option.value}
  className="bg-background text-text-base"
>
  Sort by: {option.label}
</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading States (Error state styling is kept for clarity) */}
      {categoryLoading && (
        <p className="text-sm text-text-muted">Loading categories…</p>
      )}
      {categoryError && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span className="font-medium">Unable to load categories.</span>
          <button type="button" onClick={handleRetryCategories} className="rounded border border-rose-400 px-3 py-1 font-semibold text-rose-100 transition-colors hover:bg-rose-500/20">
            Retry
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex min-h-[16rem] items-center justify-center text-text-muted">
          Loading products...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-12 text-center">
          <p className="text-rose-100">We couldn't load products right now.</p>
          <button type="button" onClick={() => loadProducts()} className="rounded-lg border border-rose-400 px-4 py-2 font-semibold text-rose-100 transition-colors hover:bg-rose-500/20">
            Retry loading products
          </button>
        </div>
      ) : filteredProducts.length ? (
        <ProductGrid products={filteredProducts} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-secondary/60 bg-background p-12 text-center">
          <p className="text-text-muted">
            No products match your current filters.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-background transition hover:opacity-90"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* "Load More" Button */}
      {!loading && !error && filteredProducts.length > 0 && filteredProducts.length < totalCount && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMoreItems}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
          >
            More Items
          </button>
        </div>
      )}
    </div>
  </div>
</main>
      {showScrollTop && (
        <button
  type="button"
  onClick={handleScrollToTop}
  aria-label="Back to top"
  className="fixed bottom-6 right-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-background shadow-lg shadow-black/50 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M5 11l7-7 7 7" />
    <path d="M12 18V4" />
  </svg>
</button>
      )}
    </div>
  );
};

export default HomePage;
