import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchProductsSummary,
  updateProduct as updateProductRequest,
  deleteProduct as deleteProductRequest,
} from "../../api/admin.js";
import { fetchProductById } from "../../api/catalog.js";
import ProductUpload from "../../components/admin/products/ProductUpload.jsx";

const FALLBACK_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5QzEzLjEwNDYgOSAxNCA5Ljg5NTQzIDE0IDExQzE0IDEyLjEwNDYgMTMuMTA0NiAxMyAxMiAxM0MxMC44OTU0IDEzIDEwIDEyLjEwNDYgMTAgMTFDMTAgOS44OTU0MyAxMC44OTU0IDkgMTIgOVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTMgNkMzIDQuMzQzMTUgNC4zNDMxNSAzIDYgM0gxOEMxOS42NTY5IDMgMjEgNC4zNDMxNSAyMSA2VjE4QzIxIDE5LjY1NjkgMTkuNjU2OSAyMSAxOCAyMUg2QzQuMzQzMTUgMjEgMyAxOS42NTY5IDMgMThWNlpNNiA1QzUuNDQ3NzIgNSA1IDUuNDQ3NzIgNSA2VjE0LjU4NThMNy4yOTI4OSAxMi4yOTI5QzcuNjgzNDIgMTEuOTAyNCA4LjMxNjU4IDExLjkwMjQgOC43MDcxMSAxMi4yOTI5TDEzIDEzLjU4NThMMTYuMjkyOSA5LjI5Mjg5QzE2LjY4MzQgOC45MDIzNyAxNy4zMTY2IDguOTAyMzcgMTcuNzA3MSA5LjI5Mjg5TDE5IDE0LjU4NThWNkMxOSA1LjQ0NzcyIDE4LjU1MjMgNSAxOCA1SDZaIiBmaWxsPSIjOUNBNEFGIi8+Cjwvc3ZnPgo=";

const toTitleCase = (value = "") =>
  value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const mapProductToAdminCard = (product, index = 0) => {
  const id = product.id ?? product.slug ?? `product-${index}`;
  const price = Number(product.price ?? product.basePrice ?? 0);
  const stock =
    product.totalStock ??
    product.stock ??
    product.inventory ??
    product.quantity ??
    0;

  return {
    id,
    name: product.title ?? product.name ?? "Untitled product",
    price,
    stock,
    category: product.category
      ? toTitleCase(product.category)
      : "Uncategorised",
    status: product.isAvailable ? "Active" : "Inactive",
    image: product.imageUrl || FALLBACK_IMAGE,
  };
};

const formatPrice = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const resolveErrorMessage = (error, fallback) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.payload?.message) {
    return error.payload.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [productToView, setProductToView] = useState(null);
  const [drawerState, setDrawerState] = useState({
    open: false,
    mode: "create",
    productId: null,
  });
  const [drawerKey, setDrawerKey] = useState(0);
  const [actionNotice, setActionNotice] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchProductsSummary({
        limit: 50,
        sort: "-createdAt",
      });
      const nextProducts = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
        ? response.items
        : [];

      const normalizedProducts = nextProducts.map(mapProductToAdminCard);
      setProducts(normalizedProducts);

      const idsToEnrich = normalizedProducts
        .filter((product) => !product.stock)
        .slice(0, 24)
        .map((product) => product.id)
        .filter(Boolean);

      if (idsToEnrich.length) {
        Promise.all(
          idsToEnrich.map((productId) =>
            fetchProductById(productId)
              .then((detail) =>
                detail
                  ? {
                      id: productId,
                      stock: detail.totalStock ?? 0,
                      status: detail.isAvailable ? "Active" : "Inactive",
                    }
                  : null
              )
              .catch(() => null)
          )
        )
          .then((updates) => {
            const validUpdates = updates.filter(Boolean);
            if (!validUpdates.length) {
              return;
            }

            setProducts((current) =>
              current.map((product) => {
                const update = validUpdates.find(
                  (entry) => entry.id === product.id
                );
                if (!update) {
                  return product;
                }

                return {
                  ...product,
                  stock: update.stock,
                  status: update.status ?? product.status,
                };
              })
            );
          })
          .catch((enrichError) => {
            console.warn("Unable to enrich product inventory", enrichError);
          });
      }
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!actionNotice?.message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setActionNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [actionNotice]);

  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter(
      (product) => product.status === "Active"
    ).length;
    const lowStock = products.filter(
      (product) => (product.stock ?? 0) < 20
    ).length;
    const categories = new Set(products.map((product) => product.category))
      .size;

    return {
      total,
      active,
      lowStock,
      categories,
    };
  }, [products]);

  const setRowAction = (productId, status) => {
    setActionNotice(null);
    setActionLoading((current) => ({
      ...current,
      [productId]: status,
    }));
  };

  const clearRowAction = (productId) => {
    setActionLoading((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const handleToggleStatus = async (productId) => {
    if (!productId) {
      return;
    }

    const targetProduct = products.find((product) => product.id === productId);
    if (!targetProduct) {
      return;
    }

    const nextIsActive = targetProduct.status !== "Active";

    setRowAction(productId, "toggling");

    try {
      await updateProductRequest(productId, { isActive: nextIsActive });

      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? {
                ...product,
                status: nextIsActive ? "Active" : "Inactive",
              }
            : product
        )
      );

      setActionNotice({
        type: "success",
        message: `Product ${
          nextIsActive ? "published" : "archived"
        } successfully.`,
      });

      void loadProducts();
    } catch (requestError) {
      setActionNotice({
        type: "error",
        message: resolveErrorMessage(
          requestError,
          "Unable to update product status. Please try again."
        ),
      });
    } finally {
      clearRowAction(productId);
    }
  };

  const handleDeleteProduct = (product) => {
    setActionNotice(null);
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) {
      return;
    }

    const productId = productToDelete.id;
    setRowAction(productId, "deleting");

    try {
      await deleteProductRequest(productId);
      setProducts((current) =>
        current.filter((product) => product.id !== productId)
      );
      setActionNotice({
        type: "success",
        message: "Product archived successfully.",
      });
      setShowDeleteModal(false);
      setProductToDelete(null);
      void loadProducts();
    } catch (requestError) {
      setActionNotice({
        type: "error",
        message: resolveErrorMessage(
          requestError,
          "Unable to delete product. Please try again."
        ),
      });
    } finally {
      clearRowAction(productId);
    }
  };

  const handleViewProduct = (product) => {
    setActionNotice(null);
    setProductToView(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (productId) => {
    if (!productId) {
      return;
    }

    setActionNotice(null);
    setDrawerKey((current) => current + 1);
    setDrawerState({
      open: true,
      mode: "edit",
      productId,
    });
  };

  const handleDrawerClose = useCallback(() => {
    setDrawerState({
      open: false,
      mode: "create",
      productId: null,
    });
  }, []);

  const openCreateDrawer = useCallback(() => {
    setActionNotice(null);
    setDrawerKey((current) => current + 1);
    setDrawerState({
      open: true,
      mode: "create",
      productId: null,
    });
  }, []);

  const handleProductSaved = useCallback(
    (_product, { mode: resultMode } = {}) => {
      const finalMode = resultMode ?? drawerState.mode ?? "create";

      setActionNotice({
        type: "success",
        message:
          finalMode === "edit"
            ? "Product updated successfully."
            : "Product created successfully.",
      });

      handleDrawerClose();
      void loadProducts();
    },
    [drawerState.mode, handleDrawerClose, loadProducts]
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Products</h2>
          <p className="mt-1 text-slate-600">
            Manage your catalog, inventory, and merchandising from a single
            place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/products/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white shadow-lg transition hover:bg-emerald-700 hover:shadow-xl"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Go to uploader
          </Link>

          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/60 bg-white px-4 py-3 font-medium text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800 hover:shadow"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            Quick create
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total products"
          value={loading ? "…" : metrics.total}
          tone="emerald"
        />
        <MetricCard
          label="Active"
          value={loading ? "…" : metrics.active}
          tone="blue"
          icon="check"
        />
        <MetricCard
          label="Low stock"
          value={loading ? "…" : metrics.lowStock}
          tone="amber"
          icon="alert"
        />
        <MetricCard
          label="Categories"
          value={loading ? "…" : metrics.categories}
          tone="purple"
          icon="grid"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          {resolveErrorMessage(
            error,
            "Unable to load products right now. Please try again."
          )}
        </div>
      ) : null}

      {actionNotice?.message ? (
        <div
          className={`rounded-2xl border p-4 text-sm shadow-sm ${
            actionNotice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {actionNotice.message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-emerald-100/30 px-6 py-4">
          <h3 className="text-lg font-semibold text-emerald-900">
            Product catalog
          </h3>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
          {(loading ? Array.from({ length: 6 }) : products).map(
            (product, index) => (
              <ProductCard
                key={product?.id ?? index}
                loading={loading}
                product={product}
                isBusy={Boolean(product && actionLoading[product.id])}
                busyState={product ? actionLoading[product.id] : undefined}
                onView={() => product && handleViewProduct(product)}
                onEdit={() => product && handleEditProduct(product.id)}
                onToggle={() => product && handleToggleStatus(product.id)}
                onDelete={() => product && handleDeleteProduct(product)}
              />
            )
          )}
        </div>
      </div>

      {showDeleteModal && productToDelete ? (
        <DeleteModal
          product={productToDelete}
          busy={Boolean(actionLoading[productToDelete.id])}
          onCancel={() => {
            setShowDeleteModal(false);
            setProductToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      ) : null}

      {showViewModal && productToView ? (
        <ViewModal
          product={productToView}
          onClose={() => {
            setShowViewModal(false);
            setProductToView(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setProductToView(null);
            handleEditProduct(productToView.id);
          }}
          onDelete={() => {
            setShowViewModal(false);
            setProductToView(null);
            handleDeleteProduct(productToView);
          }}
        />
      ) : null}

      {drawerState.open ? (
        <CreateDrawer mode={drawerState.mode} onClose={handleDrawerClose}>
          <ProductUpload
            key={drawerKey}
            mode={drawerState.mode}
            productId={drawerState.productId}
            onSuccess={handleProductSaved}
          />
        </CreateDrawer>
      ) : null}
    </section>
  );
};

const MetricCard = ({ label, value, tone = "emerald", icon = "box" }) => {
  const tones = {
    emerald: {
      background: "from-emerald-50 to-emerald-100/50",
      border: "border-emerald-200",
      icon: "text-emerald-700",
      badge: "bg-emerald-200",
    },
    blue: {
      background: "from-blue-50 to-blue-100/50",
      border: "border-blue-200",
      icon: "text-blue-700",
      badge: "bg-blue-200",
    },
    amber: {
      background: "from-amber-50 to-amber-100/50",
      border: "border-amber-200",
      icon: "text-amber-700",
      badge: "bg-amber-200",
    },
    purple: {
      background: "from-purple-50 to-purple-100/50",
      border: "border-purple-200",
      icon: "text-purple-700",
      badge: "bg-purple-200",
    },
  };

  const toneStyles = tones[tone] ?? tones.emerald;

  const iconPath = {
    box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    alert:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
    grid: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  };

  return (
    <div
      className={`rounded-xl border ${toneStyles.border} bg-gradient-to-r ${toneStyles.background} p-4 shadow-sm transition hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneStyles.badge}`}
        >
          <svg
            className={`h-5 w-5 ${toneStyles.icon}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={iconPath[icon] ?? iconPath.box}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({
  loading,
  product,
  isBusy,
  busyState,
  onView,
  onEdit,
  onToggle,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-emerald-100/50 bg-gradient-to-br from-white to-emerald-50/20 p-5">
        <div className="mb-4 h-32 w-full rounded-lg bg-slate-200" />
        <div className="mb-2 h-4 rounded bg-slate-200" />
        <div className="mb-4 h-3 w-3/5 rounded bg-slate-200" />
        <div className="mb-4 flex justify-between">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/4 rounded bg-slate-200" />
        </div>
        <div className="h-9 rounded bg-slate-200" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const statusIsActive = product.status === "Active";

  return (
    <div className="group rounded-xl border border-emerald-100/60 bg-gradient-to-br from-white to-emerald-50/30 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative mb-4 overflow-hidden rounded-lg bg-slate-100">
        <div className="aspect-square">
          <img
            src={product.image ?? FALLBACK_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>
        <span
          className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow ${
            statusIsActive ? "bg-emerald-500" : "bg-slate-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              statusIsActive ? "bg-emerald-200" : "bg-slate-200"
            }`}
          />
          {product.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {product.name}
          </h3>
          <p className="text-sm text-emerald-600">{product.category}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">Price</p>
              <p className="font-semibold text-emerald-700">
                {formatPrice(product.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Stock</p>
              <p
                className={`font-semibold ${
                  (product.stock ?? 0) < 20
                    ? "text-amber-600"
                    : "text-slate-700"
                }`}
              >
                {product.stock ?? 0}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            disabled={isBusy}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              statusIsActive ? "bg-emerald-600" : "bg-slate-300"
            } ${isBusy ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                statusIsActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3">
          <ActionButton label="View" onClick={onView} />
          <ActionButton
            label="Edit"
            variant="primary"
            onClick={onEdit}
            busy={busyState === "editing"}
          />
          <ActionButton
            label="Delete"
            variant="danger"
            onClick={onDelete}
            busy={busyState === "deleting"}
          />
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({
  label,
  variant = "default",
  onClick,
  busy = false,
}) => {
  const variants = {
    default: "border border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        busy ? "cursor-not-allowed opacity-60" : ""
      } ${variants[variant] ?? variants.default}`}
    >
      {busy ? <Spinner /> : null}
      {label}
    </button>
  );
};

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
);

const DeleteModal = ({ product, busy, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Delete product
          </h3>
          <p className="text-sm text-slate-600">
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <img
            src={product.image ?? FALLBACK_IMAGE}
            alt={product.name}
            className="h-12 w-12 rounded-lg object-cover"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div>
            <p className="font-medium text-slate-900">{product.name}</p>
            <p className="text-sm text-slate-500">{product.category}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Deleting…
            </span>
          ) : (
            "Delete product"
          )}
        </button>
      </div>
    </div>
  </div>
);

const ViewModal = ({ product, onClose, onEdit, onDelete }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h3 className="text-xl font-semibold text-slate-900">
          Product details
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </header>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl bg-slate-100">
            <img
              src={product.image ?? FALLBACK_IMAGE}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${
              product.status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                product.status === "Active" ? "bg-emerald-400" : "bg-slate-400"
              }`}
            />
            {product.status}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-2xl font-bold text-slate-900">
              {product.name}
            </h4>
            <p className="text-emerald-600">{product.category}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-600">Price</p>
              <p className="text-2xl font-bold text-emerald-800">
                {formatPrice(product.price)}
              </p>
            </div>
            <div
              className={`${
                (product.stock ?? 0) < 20 ? "bg-amber-50" : "bg-slate-50"
              } rounded-lg p-4`}
            >
              <p
                className={`text-sm font-medium ${
                  (product.stock ?? 0) < 20
                    ? "text-amber-600"
                    : "text-slate-600"
                }`}
              >
                Stock remaining
              </p>
              <p
                className={`text-2xl font-bold ${
                  (product.stock ?? 0) < 20
                    ? "text-amber-800"
                    : "text-slate-800"
                }`}
              >
                {product.stock ?? 0}
              </p>
            </div>
          </div>

          <dl className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <dt>SKU</dt>
              <dd className="font-medium">#{product.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd className="font-medium">{product.status}</dd>
            </div>
          </dl>

          <div className="rounded-lg bg-slate-50 p-4">
            <h5 className="mb-2 font-medium text-slate-900">
              Quick description
            </h5>
            <p className="text-sm text-slate-600">
              High-quality {product.name.toLowerCase()} from our curated
              selection. Crafted for everyday wear with attention to detail and
              durability.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-emerald-700"
            >
              Edit product
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CreateDrawer = ({ children, mode = "create", onClose }) => {
  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-black/20 md:block" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l border-emerald-100 bg-gradient-to-b from-white via-white to-emerald-50 shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-emerald-100 bg-white/90 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit product" : "Quick create"}
            </h3>
            <p className="text-sm text-slate-600">
              {isEdit
                ? "Update product information without leaving this page."
                : "Fill out the form below to add a new product without leaving this page."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
};

export default Products;
