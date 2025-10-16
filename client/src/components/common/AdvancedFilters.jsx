import { useState, useEffect, useCallback } from "react";
import { fetchCategoryTree } from "../../api/categories.js";

const GENDER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Women", label: "Women" },
  { value: "Men", label: "Men" },
  { value: "Kids", label: "Kids" },
  { value: "Unisex", label: "Unisex" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Rating: High to Low" },
  { value: "newest", label: "Newest First" },
];

const PRICE_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹1000", min: 500, max: 1000 },
  { label: "₹1000 - ₹2000", min: 1000, max: 2000 },
  { label: "₹2000 - ₹5000", min: 2000, max: 5000 },
  { label: "₹5000 - ₹10000", min: 5000, max: 10000 },
  { label: "Above ₹10000", min: 10000, max: 999999 },
];

const COMMON_COLORS = [
  { name: "black", hex: "#000000" },
  { name: "white", hex: "#FFFFFF" },
  { name: "red", hex: "#DC2626" },
  { name: "blue", hex: "#2563EB" },
  { name: "green", hex: "#059669" },
  { name: "pink", hex: "#EC4899" },
  { name: "purple", hex: "#7C3AED" },
  { name: "yellow", hex: "#EAB308" },
  { name: "orange", hex: "#EA580C" },
  { name: "brown", hex: "#92400E" },
  { name: "grey", hex: "#6B7280" },
  { name: "navy", hex: "#1E3A8A" },
];

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

const RATING_OPTIONS = [
  { label: "4★ & above", value: 4 },
  { label: "3★ & above", value: 3 },
  { label: "2★ & above", value: 2 },
  { label: "1★ & above", value: 1 },
];

const FilterSection = ({ title, children, isOpen, onToggle }) => (
  <div className="border-b border-text-muted/30 pb-4 last:border-b-0">
  <button
    onClick={onToggle}
    className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-text-base transition-colors hover:text-primary"
  >
    {title}
    <svg
      className={`h-5 w-5 transform transition-transform duration-200 ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>
  {isOpen && (
    <div className="mt-3 pl-2 space-y-3">
      {children}
    </div>
  )}
</div>
);

const AdvancedFilters = ({
  filters,
  onFiltersChange,
  productCount,
  onClearFilters,
}) => {
  const [openSections, setOpenSections] = useState({
    allProducts: true,
    gender: true,
    category: true,
    subcategory: false,
    color: false,
    size: false,
    price: false,
    rating: false,
  });

  const [categoryTree, setCategoryTree] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  // Load categories when component mounts or gender changes
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const params =
          filters.gender !== "all" ? { gender: filters.gender } : {};
        const { categories } = await fetchCategoryTree(params);
        setCategoryTree(categories || []);

        // Set available categories based on gender
        if (filters.gender !== "all" && categories) {
          setAvailableCategories(
            categories.map((cat) => ({
              value: cat.slug,
              label: cat.name,
              children: cat.children || [],
            }))
          );
        } else {
          // If no gender selected, show all main categories
          const allCategories = [];
          (categories || []).forEach((cat) => {
            allCategories.push({
              value: cat.slug,
              label: cat.name,
              children: cat.children || [],
            });
          });
          setAvailableCategories(allCategories);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        setAvailableCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [filters.gender]);

  // Update subcategories when category changes
  useEffect(() => {
    if (filters.category && filters.category !== "all") {
      const selectedCategory = availableCategories.find(
        (cat) => cat.value === filters.category
      );
      if (selectedCategory && selectedCategory.children) {
        setAvailableSubcategories(
          selectedCategory.children.map((subcat) => ({
            value: subcat.slug,
            label: subcat.name,
          }))
        );
      } else {
        setAvailableSubcategories([]);
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [filters.category, availableCategories]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilter = (key, value) => {
    // If gender changes, reset category and subcategory
    if (key === "gender") {
      onFiltersChange({
        ...filters,
        gender: value,
        category: "all",
        subcategory: "all",
      });
    }
    // If category changes, reset subcategory
    else if (key === "category") {
      onFiltersChange({
        ...filters,
        category: value,
        subcategory: "all",
      });
    }
    // For other filters, just update normally
    else {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    }
  };

  const toggleArrayFilter = (key, value) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];

    updateFilter(key, newArray);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "category") return value !== "all";
    if (key === "subcategory") return value !== "all";
    if (key === "gender") return value !== "all";
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== "";
  });

  return (
    <div className="w-full lg:w-80">
      <div className="sticky top-4">
        <div className="rounded-xl border border-secondary/40 bg-background shadow-xl shadow-black/40">
          <div className="border-b border-text-muted/30 p-6">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-bold uppercase tracking-wider text-text-base">
      Filters
    </h2>
    {hasActiveFilters && (
      <button
        onClick={onClearFilters}
        className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
      >
        Clear All
      </button>
    )}
  </div>
  <p className="mt-2 text-sm text-text-muted">
    {productCount}+ Products
  </p>
          </div>

          <div className="space-y-6 p-6 text-emerald-100">
            {/* All Products Button */}
            <div className="pb-4">
              <button
                onClick={() => onClearFilters()}
                className={`w-full rounded-lg py-3 px-4 text-left font-semibold transition-all ${
                  !hasActiveFilters
                    ? "bg-primary text-background shadow-md hover:opacity-90"
                    : "bg-secondary/60 text-text-base hover:bg-secondary"
                }`}
              >
                All Products
              </button>
            </div>

            {/* Gender Filter */}
            <FilterSection
              title="Gender"
              isOpen={openSections.gender}
              onToggle={() => toggleSection("gender")}
            >
              <div className="space-y-2">
                {GENDER_OPTIONS.map((gender) => (
                  <label
                    key={gender.value}
                    className="group flex cursor-pointer items-center"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={gender.value}
                      checked={filters.gender === gender.value}
                      onChange={(e) => updateFilter("gender", e.target.value)}
                      className="mr-3 h-4 w-4 cursor-pointer border-secondary/60 bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    />
                    <span className="text-sm text-text-base transition-colors group-hover:text-primary">
                      {gender.label}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Category Filter */}
            <FilterSection
  title="Category"
  isOpen={openSections.category}
  onToggle={() => toggleSection("category")}
>
  {loadingCategories ? (
    <p className="text-sm text-text-muted">
      Loading categories...
    </p>
  ) : (
    <div className="space-y-2">
      <label className="group flex cursor-pointer items-center">
        <input
          type="radio"
          name="category"
          value="all"
          checked={filters.category === "all"}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="mr-3 h-4 w-4 cursor-pointer border-secondary/60 bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        />
        <span className="text-sm text-text-base transition-colors group-hover:text-primary">
          All Categories
        </span>
      </label>
      {availableCategories.map((category) => (
        <label
          key={category.value}
          className="group flex cursor-pointer items-center"
        >
          <input
            type="radio"
            name="category"
            value={category.value}
            checked={filters.category === category.value}
            onChange={(e) =>
              updateFilter("category", e.target.value)
            }
            // Applying the consistent, redesigned style
            className="mr-3 h-4 w-4 cursor-pointer border-secondary/60 bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          />
          <span className="text-sm text-text-base transition-colors group-hover:text-primary">
            {category.label}
          </span>
        </label>
      ))}
    </div>
  )}
</FilterSection>

            {/* Subcategory Filter - Only show if category is selected */}
            {filters.category &&
              filters.category !== "all" &&
              availableSubcategories.length > 0 && (
                <FilterSection
  title="Subcategory"
  isOpen={openSections.subcategory}
  onToggle={() => toggleSection("subcategory")}
>
  <div className="space-y-2">
    <label className="group flex cursor-pointer items-center">
      <input
        type="radio"
        name="subcategory"
        value="all"
        checked={filters.subcategory === "all"}
        onChange={(e) =>
          updateFilter("subcategory", e.target.value)
        }
        className="mr-3 h-4 w-4 cursor-pointer border-secondary/60 bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      />
      <span className="text-sm text-text-base transition-colors group-hover:text-primary">
        All Subcategories
      </span>
    </label>
    {availableSubcategories.map((subcategory) => (
      <label
        key={subcategory.value}
        className="group flex cursor-pointer items-center"
      >
        <input
          type="radio"
          name="subcategory"
          value={subcategory.value}
          checked={filters.subcategory === subcategory.value}
          onChange={(e) =>
            updateFilter("subcategory", e.target.value)
          }
          className="mr-3 h-4 w-4 cursor-pointer border-secondary/60 bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        />
        <span className="text-sm text-text-base transition-colors group-hover:text-primary">
          {subcategory.label}
        </span>
      </label>
    ))}
  </div>
</FilterSection>
              )}

            {/* Color Filter */}
            <FilterSection
  title="Color"
  isOpen={openSections.color}
  onToggle={() => toggleSection("color")}
>
  <div className="grid grid-cols-4 gap-3">
    {COMMON_COLORS.map((color) => (
      <button
        key={color.name}
        onClick={() => toggleArrayFilter("colors", color.name)}
        className={`group relative flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-all hover:scale-105 ${
          filters.colors?.includes(color.name)
            ? "border-primary ring-2 ring-primary/50" // Active state
            : "border-secondary/60 hover:border-primary" // Inactive and hover states
        }`}
        title={
          color.name.charAt(0).toUpperCase() + color.name.slice(1)
        }
      >
        <div
          className={`h-8 w-8 rounded-md ${
            // Special border for white to make it visible
            color.name === "white" ? "border-2 border-text-muted/60" : ""
          }`}
          style={{ backgroundColor: color.hex }}
        />
        {filters.colors?.includes(color.name) && (
          <svg
            className={`absolute h-5 w-5 ${
              // Adjust checkmark color for legibility
              color.name === "white" || color.name === "yellow"
                ? "text-background"
                : "text-text-base"
            } drop-shadow-lg`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    ))}
  </div>
</FilterSection>

            {/* Size Filter */}
            <FilterSection
  title="Size"
  isOpen={openSections.size}
  onToggle={() => toggleSection("size")}
>
  <div className="grid grid-cols-4 gap-2">
    {COMMON_SIZES.map((size) => (
      <button
        key={size}
        onClick={() => toggleArrayFilter("sizes", size)}
        className={`rounded-lg border py-2.5 px-3 text-sm font-semibold transition-all hover:scale-105 ${
          filters.sizes?.includes(size)
            ? "border-primary bg-primary/20 text-primary shadow-sm" // Active state
            : "border-secondary/60 text-text-base hover:border-primary hover:bg-secondary/60" // Inactive and hover states
        }`}
      >
        {size}
      </button>
    ))}
  </div>
</FilterSection>

            {/* Price Filter */}
            <FilterSection
  title="Price"
  isOpen={openSections.price}
  onToggle={() => toggleSection("price")}
>
  <div className="space-y-2">
    {PRICE_RANGES.map((range, index) => (
      <label
        key={index}
        className="group flex cursor-pointer items-center"
      >
        <input
          type="checkbox"
          checked={filters.priceRanges?.some(
            (r) => r.min === range.min && r.max === range.max
          )}
          onChange={(e) => {
            const currentRanges = filters.priceRanges || [];
            if (e.target.checked) {
              updateFilter("priceRanges", [
                ...currentRanges,
                range,
              ]);
            } else {
              updateFilter(
                "priceRanges",
                currentRanges.filter(
                  (r) =>
                    !(r.min === range.min && r.max === range.max)
                )
              );
            }
          }}
          className="mr-3 h-4 w-4 cursor-pointer rounded border-secondary/60 bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        />
        <span className="text-sm text-text-base transition-colors group-hover:text-primary">
          {range.label}
        </span>
      </label>
    ))}
  </div>
</FilterSection>

            {/* Rating Filter */}
            <FilterSection
  title="Rating"
  isOpen={openSections.rating}
  onToggle={() => toggleSection("rating")}
>
  <div className="space-y-2">
    {RATING_OPTIONS.map((rating) => (
      <label
        key={rating.value}
        className="group flex cursor-pointer items-center"
      >
        <input
          type="radio"
          name="rating"
          value={rating.value}
          checked={filters.minRating === rating.value}
          onChange={(e) =>
            updateFilter("minRating", Number(e.target.value))
          }
          className="mr-3 h-4 w-4 cursor-pointer border-secondary/60 bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        />
        <span className="text-sm text-text-base transition-colors group-hover:text-primary">
          {rating.label}
        </span>
      </label>
    ))}
  </div>
</FilterSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SORT_OPTIONS };
export default AdvancedFilters;
