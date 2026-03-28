import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../components/store/ProductCard";
import { LoadingState } from "../../components/ui/AsyncState";
import { STORE_SECTIONS } from "../../constants/sections";
import { FRAGRANCE_IMAGE, HERO_SLIDES } from "../../constants/editorialProducts";
import { api } from "../../api/endpoints";

const resolveProductsFromSearch = (response) => {
  return response?.data?.results || response?.results || [];
};

const resolveCategories = (response) => {
  return response?.categories || response?.data?.categories || [];
};

const EMPTY_SECTION_PRODUCTS = Object.fromEntries(STORE_SECTIONS.map((section) => [section.slug, []]));
const HERO_CATEGORY_BY_SLIDE = {
  "autumn-edit": "clothing",
  "private-fragrance": "perfumes",
  "atelier-accessories": "accessories",
};

const HomePage = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionProducts, setSectionProducts] = useState(EMPTY_SECTION_PRODUCTS);
  const [heroCategories, setHeroCategories] = useState([]);

  const heroSlides = useMemo(() => {
    const categoriesBySlug = new Map(heroCategories.map((category) => [category.slug, category]));

    return HERO_SLIDES.map((slide) => {
      const heroCategory = categoriesBySlug.get(HERO_CATEGORY_BY_SLIDE[slide.id]);
      const categoryHeroImage = heroCategory?.heroImage;

      return {
        ...slide,
        imageUrl: categoryHeroImage?.url || slide.imageUrl,
        imageAlt: categoryHeroImage?.alt || slide.eyebrow,
      };
    });
  }, [heroCategories]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5500);

    return () => {
      window.clearInterval(timer);
    };
  }, [heroSlides.length]);

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      try {
        setLoading(true);
        setError("");

        const [entries, categoryResponse] = await Promise.all([
          Promise.all(
            STORE_SECTIONS.map(async (section) => {
              const searchPayload = await api.search.searchProducts({
                category: section.searchCategory,
                limit: 4,
                sortBy: "relevance",
              });
              const products = resolveProductsFromSearch(searchPayload);
              return [section.slug, products];
            })
          ),
          api.categories.list().catch(() => null),
        ]);

        if (!active) {
          return;
        }

        setSectionProducts(Object.fromEntries(entries));
        setHeroCategories(resolveCategories(categoryResponse));
      } catch (requestError) {
        if (!active) return;
        setSectionProducts(EMPTY_SECTION_PRODUCTS);
        setHeroCategories([]);
        setError(requestError?.message || "Unable to load products from backend.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      active = false;
    };
  }, []);

  const fragranceFeature = sectionProducts.perfumes?.[0] || null;

  const newArrivals = useMemo(() => {
    return [
      ...(sectionProducts["men-clothing"] || []),
      ...(sectionProducts.perfumes || []),
      ...(sectionProducts.accessories || []),
    ].slice(0, 4);
  }, [sectionProducts]);

  const fragranceFeatureImage =
    fragranceFeature?.imageUrl ||
    fragranceFeature?.media?.find((item) => item?.isPrimary)?.url ||
    fragranceFeature?.media?.[0]?.url ||
    FRAGRANCE_IMAGE;

  return (
    <main className="home-page">
      <section className="home-hero-shell">
        <div className="home-hero">
          {heroSlides.map((slide, index) => (
            <article
              aria-hidden={index !== activeSlide}
              className={`home-hero__slide${index === activeSlide ? " is-active" : ""}`}
              key={slide.id}
            >
              <img alt={slide.imageAlt} src={slide.imageUrl} />
              <div className="home-hero__overlay">
                <p className="home-hero__eyebrow">{slide.eyebrow}</p>
                <h1>{slide.title}</h1>
                <p className="home-hero__copy">{slide.description}</p>
                <div className="home-hero__actions">
                  <Link className="button button--gold" to={slide.ctaTo}>
                    {slide.ctaLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}

          <div className="home-hero__controls">
            <button
              aria-label="Previous slide"
              className="home-hero__arrow"
              onClick={() =>
                setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)
              }
              type="button"
            >
              Prev
            </button>
            <div className="home-hero__dots">
              {heroSlides.map((slide, index) => (
                <button
                  aria-label={`Go to ${slide.eyebrow}`}
                  className={`home-hero__dot${index === activeSlide ? " is-active" : ""}`}
                  key={slide.id}
                  onClick={() => setActiveSlide(index)}
                  type="button"
                />
              ))}
            </div>
            <button
              aria-label="Next slide"
              className="home-hero__arrow"
              onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {loading ? <LoadingState message="Loading luxury edit..." /> : null}
      {!loading && error ? <p className="notice-banner">{error}</p> : null}

      {!loading ? (
        <div className="home-grid">
          <section className="feature-story">
            <img alt={fragranceFeature?.title || "Signature fragrance"} src={fragranceFeatureImage} />
            <div className="feature-story__content">
              <p className="feature-story__eyebrow">The Signature Fragrance</p>
              <h2>{fragranceFeature?.title || "Velvet Moss: An Indulgent Scent"}</h2>
              <p>
                Layered with amber, cedarwood, and bergamot for a refined signature that lasts from
                dusk to midnight.
              </p>
              <Link className="button button--outline" to="/shop/perfumes">
                Discover the Scent
              </Link>
            </div>
          </section>

          <section className="new-arrivals-panel">
            <div className="new-arrivals-panel__head">
              <p>New Arrivals</p>
              <Link to="/shop/all">View all</Link>
            </div>

            <div className="arrival-grid">
              {newArrivals.length ? newArrivals.map((product) => (
                <ProductCard key={product.id || product.slug} product={product} />
              )) : <p className="catalog-footnote">No arrivals available right now.</p>}
            </div>
          </section>
        </div>
      ) : null}

      {!loading ? (
        <div className="sections-stack">
          {STORE_SECTIONS.map((section) => (
            <section className="section-block" key={section.slug}>
              <div className="section-block__header">
                <div>
                  <p className="section-block__eyebrow">{section.title}</p>
                  <h2>{section.description}</h2>
                </div>
                <Link className="section-block__link" to={`/shop/${section.slug}`}>
                  View all
                </Link>
              </div>

              <div className="product-grid">
                {(sectionProducts[section.slug] || []).length ? (
                  (sectionProducts[section.slug] || []).map((product) => (
                    <ProductCard key={product.id || product.slug} product={product} />
                  ))
                ) : (
                  <p className="catalog-footnote">No products available.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </main>
  );
};

export default HomePage;
