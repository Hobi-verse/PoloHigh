import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ProductCard from "../../components/store/ProductCard";
import { LoadingState } from "../../components/ui/AsyncState";
import { getSectionBySlug, STORE_SECTIONS } from "../../constants/sections";
import { api } from "../../api/endpoints";

const CatalogPage = () => {
  const { section = "all" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const deferredSearch = useDeferredValue(searchInput);

  const activeSection = useMemo(() => getSectionBySlug(section), [section]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setNotice("");

        const query = {
          q: deferredSearch || undefined,
          category: activeSection?.searchCategory || undefined,
          sortBy: "relevance",
          limit: 24,
        };

        const response = await api.search.searchProducts(query);
        const nextProducts = response?.data?.results || response?.results || [];
        const nextPagination = response?.pagination || null;

        if (!active) {
          return;
        }

        startTransition(() => {
          setProducts(nextProducts);
          setPagination(nextPagination);
        });
      } catch (requestError) {
        if (!active) {
          return;
        }
        startTransition(() => {
          setProducts([]);
          setPagination(null);
        });
        setNotice(requestError?.message || "Unable to load products from backend.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [activeSection?.searchCategory, deferredSearch]);

  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

  const updateSearch = (value) => {
    setSearchInput(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <main className="container catalog-page">
      <section className="catalog-head">
        <div>
          <p className="catalog-head__eyebrow">Luxury Catalog</p>
          <h1>{activeSection?.title || "All Collections"}</h1>
        </div>
        <input
          className="catalog-search"
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Search products, notes, styles..."
          value={searchInput}
        />
      </section>

      <nav className="catalog-tabs">
        <Link className={section === "all" ? "is-active" : ""} to="/shop/all">
          All
        </Link>
        {STORE_SECTIONS.map((item) => (
          <Link
            className={section === item.slug ? "is-active" : ""}
            key={item.slug}
            to={`/shop/${item.slug}`}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      {loading ? <LoadingState message="Finding the right pieces..." /> : null}
      {!loading && notice ? <p className="notice-banner">{notice}</p> : null}
      {!loading && !products.length ? <p className="catalog-footnote">No products available.</p> : null}

      {!loading && products.length ? (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>
          {pagination ? (
            <p className="catalog-footnote">
              Showing {products.length} of {pagination.total} products
            </p>
          ) : null}
        </>
      ) : null}
    </main>
  );
};

export default CatalogPage;
