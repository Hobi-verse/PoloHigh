import ProductCard from "./ProductCard.jsx";

const ProductGrid = ({ products = [], onSelectProduct }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {products.map((product) => (
      <ProductCard
        key={product.id ?? product.title}
        onSelect={onSelectProduct}
        {...product}
        to={product.to ?? (product.id ? `/products/${product.id}` : undefined)}
      />
    ))}
  </div>
);

export default ProductGrid;
