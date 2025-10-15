import { useCallback, useEffect, useMemo, useState } from "react";
import UserNavbar from "../../components/user/common/UserNavbar.jsx";
import Breadcrumbs from "../../components/common/Breadcrumbs.jsx";
import CartItem from "../../components/user/cart/CartItem.jsx";
import SavedItem from "../../components/user/cart/SavedItem.jsx";
import OrderSummary from "../../components/user/cart/OrderSummary.jsx";
import CouponPanel from "../../components/user/cart/CouponPanel.jsx";
import {
  fetchCart,
  removeCartItem,
  updateCartItem,
  saveCartItemForLater,
  moveCartItemToCart,
  emptyCart,
} from "../../api/cart.js";
import {
  autoApplyBestCoupon,
  fetchAvailableCoupons,
  validateCoupon,
} from "../../api/coupons.js";

const TAX_RATE = 0.1;

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

  if (error?.payload?.data?.message) {
    return error.payload.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const CartPage = ({ isLoggedIn = false }) => {
  const [cart, setCart] = useState(() => emptyCart());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableError, setAvailableError] = useState("");
  const [lastValidatedSignature, setLastValidatedSignature] = useState("");

  const refreshCart = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const nextCart = await fetchCart({ signal });
      if (signal?.aborted) {
        return;
      }

      setCart(nextCart);
      setActionError("");
    } catch (apiError) {
      if (signal?.aborted) {
        return;
      }

      setError(apiError);
      setCart(emptyCart());
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshCart({ signal: controller.signal });

    return () => controller.abort();
  }, [refreshCart]);

  const cartItems = useMemo(
    () => cart.items.filter((item) => !item.savedForLater),
    [cart.items]
  );

  const savedItems = useMemo(
    () => cart.items.filter((item) => item.savedForLater),
    [cart.items]
  );

  const cartSignature = useMemo(
    () =>
      cartItems
        .map((item) => `${item.productId ?? item.id}:${item.quantity}`)
        .join("|"),
    [cartItems]
  );

  const totals = useMemo(() => {
    const subtotal = Number.isFinite(cart.totals.subtotal)
      ? cart.totals.subtotal
      : cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const estimatedTax = Math.round(subtotal * TAX_RATE);

    return {
      subtotal,
      estimatedTax,
    };
  }, [cart.totals.subtotal, cartItems]);

  const couponPayload = useMemo(() => {
    const orderAmount = Math.max(0, totals.subtotal);
    const items = cartItems
      .map((item) => {
        const productId = item.productId ?? item.id ?? item.variantSku ?? null;
        if (!productId) {
          return null;
        }

        return {
          productId,
          quantity: item.quantity ?? 1,
          price: item.price ?? 0,
        };
      })
      .filter(Boolean);

    return { orderAmount, items };
  }, [cartItems, totals.subtotal]);

  const loadAvailableCoupons = useCallback(
    async ({ signal } = {}) => {
      if (!isLoggedIn) {
        setAvailableCoupons([]);
        setAvailableError("");
        setAvailableLoading(false);
        return;
      }

      setAvailableLoading(true);
      setAvailableError("");

      try {
        const { coupons } = await fetchAvailableCoupons({ signal });
        if (signal?.aborted) {
          return;
        }

        setAvailableCoupons(coupons);
      } catch (apiError) {
        if (signal?.aborted) {
          return;
        }

        setAvailableCoupons([]);
        setAvailableError(
          resolveErrorMessage(
            apiError,
            "We couldn't load your coupons right now."
          )
        );
      } finally {
        if (!signal?.aborted) {
          setAvailableLoading(false);
        }
      }
    },
    [isLoggedIn]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (isLoggedIn) {
      loadAvailableCoupons({ signal: controller.signal });
    } else {
      setAvailableCoupons([]);
      setAvailableError("");
    }

    return () => controller.abort();
  }, [isLoggedIn, loadAvailableCoupons]);

  const handleQuantityChange = async (itemId, quantity) => {
    const nextQuantity = Math.max(1, quantity);
    setActionError("");

    try {
      const updatedCart = await updateCartItem(itemId, {
        quantity: nextQuantity,
      });
      setCart(updatedCart);
      setCouponError("");
      setLastValidatedSignature("");
    } catch (apiError) {
      setActionError(
        apiError?.message || "We couldn't update the quantity. Please retry."
      );
      refreshCart().catch(() => {});
    }
  };

  const handleRemove = async (itemId) => {
    setActionError("");

    try {
      const updatedCart = await removeCartItem(itemId);
      setCart(updatedCart);
      setCouponError("");
      setLastValidatedSignature("");
    } catch (apiError) {
      setActionError(
        apiError?.message || "We couldn't remove that item just yet."
      );
      refreshCart().catch(() => {});
    }
  };

  const handleSaveForLater = async (itemId) => {
    setActionError("");

    try {
      const updatedCart = await saveCartItemForLater(itemId);
      setCart(updatedCart);
      setCouponError("");
      setLastValidatedSignature("");
    } catch (apiError) {
      setActionError(
        apiError?.message || "We couldn't save that item for later."
      );
      refreshCart().catch(() => {});
    }
  };

  const handleMoveToCart = async (itemId) => {
    setActionError("");

    try {
      const updatedCart = await moveCartItemToCart(itemId);
      setCart(updatedCart);
      setCouponError("");
      setLastValidatedSignature("");
    } catch (apiError) {
      setActionError(
        apiError?.message || "We couldn't move that item back to your cart."
      );
      refreshCart().catch(() => {});
    }
  };

  const handleRemoveSaved = (itemId) => {
    handleRemove(itemId);
  };

  const handleApplyCoupon = useCallback(
    async (code) => {
      const trimmed = code?.trim().toUpperCase();
      if (!trimmed) {
        setCouponError("Enter a coupon code to continue.");
        return;
      }

      if (!couponPayload.items.length) {
        setCouponError("Add items to your cart before applying a coupon.");
        return;
      }

      setCouponLoading(true);
      setCouponError("");

      try {
        const { coupon } = await validateCoupon({
          code: trimmed,
          ...couponPayload,
        });
        setCouponResult(coupon);
        setLastValidatedSignature(cartSignature);
      } catch (apiError) {
        setCouponResult(null);
        setLastValidatedSignature("");
        setCouponError(
          resolveErrorMessage(
            apiError,
            "We couldn't apply that coupon just yet."
          )
        );
      } finally {
        setCouponLoading(false);
      }
    },
    [cartSignature, couponPayload]
  );

  const handleAutoApplyCoupon = useCallback(async () => {
    if (!couponPayload.items.length) {
      setCouponError("Add items to your cart before applying coupons.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const { coupon } = await autoApplyBestCoupon(couponPayload);
      setCouponResult(coupon);
      setLastValidatedSignature(cartSignature);
    } catch (apiError) {
      setCouponResult(null);
      setLastValidatedSignature("");
      setCouponError(
        resolveErrorMessage(
          apiError,
          "No coupons could be applied to your cart right now."
        )
      );
    } finally {
      setCouponLoading(false);
    }
  }, [cartSignature, couponPayload]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponResult(null);
    setCouponError("");
    setLastValidatedSignature("");
  }, []);

  useEffect(() => {
    if (!couponResult?.code) {
      return;
    }

    if (cartSignature === lastValidatedSignature) {
      return;
    }

    const controller = new AbortController();
    setCouponLoading(true);
    setCouponError("");

    validateCoupon(
      { code: couponResult.code, ...couponPayload },
      { signal: controller.signal }
    )
      .then(({ coupon }) => {
        if (controller.signal.aborted) {
          return;
        }

        setCouponResult(coupon);
        setLastValidatedSignature(cartSignature);
      })
      .catch((apiError) => {
        if (controller.signal.aborted) {
          return;
        }

        setCouponResult(null);
        setLastValidatedSignature("");
        setCouponError(
          resolveErrorMessage(
            apiError,
            "We couldn't keep your coupon after updating the cart."
          )
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCouponLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    cartSignature,
    couponPayload,
    couponResult?.code,
    lastValidatedSignature,
  ]);

  return (
    <div className="min-h-screen bg-[#07150f] text-emerald-50">
      <UserNavbar isLoggedIn={isLoggedIn} />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Shopping Cart" }]}
        />

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            Shopping Cart
          </h1>
          <p className="text-sm text-emerald-200/80">
            Review your items before heading to checkout.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.55fr)]">
          <div className="space-y-4">
            {error ? (
              <div className="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-10 text-center text-sm text-rose-100">
                We couldn&apos;t load your cart. Please try again.
                <button
                  type="button"
                  onClick={() => refreshCart()}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-rose-200/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-100 hover:bg-rose-100/10"
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-emerald-200/70">
                Loading your cart...
              </div>
            ) : cartItems.length ? (
              cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  onSaveForLater={handleSaveForLater}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-emerald-300/40 bg-white/5 p-10 text-center text-sm text-emerald-200/70">
                Your cart is empty. Browse products to add them here.
              </div>
            )}
          </div>

          <OrderSummary
            subtotal={totals.subtotal}
            estimatedTax={totals.estimatedTax}
            shippingLabel={
              couponResult?.freeShipping ? "Free (coupon)" : "Free"
            }
            discount={couponResult?.discountApplied ?? 0}
            couponCode={couponResult?.code ?? ""}
            onRemoveCoupon={handleRemoveCoupon}
          >
            <CouponPanel
              appliedCoupon={couponResult}
              isApplying={couponLoading}
              applyError={couponError}
              onApply={handleApplyCoupon}
              onAutoApply={handleAutoApplyCoupon}
              onRemove={handleRemoveCoupon}
              availableCoupons={availableCoupons}
              availableLoading={availableLoading}
              availableError={availableError}
              onRefresh={() => loadAvailableCoupons({})}
              isLoggedIn={isLoggedIn}
            />
          </OrderSummary>
        </section>

        {actionError ? (
          <div className="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-6 text-sm text-rose-100">
            {actionError}
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-[0_16px_40px_rgba(8,35,25,0.25)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Saved for later
              </h2>
              <p className="text-sm text-emerald-200/75">
                Items you love, ready whenever you are.
              </p>
            </div>
            {savedItems.length ? (
              <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-200/70">
                {savedItems.length} item{savedItems.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            {savedItems.length ? (
              savedItems.map((item) => (
                <SavedItem
                  key={item.id}
                  item={item}
                  onMoveToCart={handleMoveToCart}
                  onRemove={handleRemoveSaved}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-emerald-300/40 bg-[#0d221c] p-8 text-center text-sm text-emerald-200/70">
                No items saved for later yet. Tap "Save for later" on any
                product to add it here.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CartPage;
