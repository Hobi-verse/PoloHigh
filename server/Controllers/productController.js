const Product = require("../models/Product");
const Category = require("../models/Category");

// Helper utilities for handling dynamic category creation
const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugifyCategory = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatCategoryName = (value = "") =>
  value
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const ensureUniqueCategorySlug = async (baseSlug = "") => {
  const safeBase = baseSlug || `category-${Date.now()}`;
  let slug = safeBase;
  let suffix = 1;

  // Continue generating suffixes until we find a free slug
  // eslint-disable-next-line no-await-in-loop
  while (await Category.exists({ slug })) {
    slug = `${safeBase}-${suffix++}`;
  }

  return slug;
};

const findCategoryByNameOrSlug = async (name, slugCandidate) => {
  const queries = [];

  if (slugCandidate) {
    queries.push({ slug: slugCandidate });
  }

  if (name) {
    queries.push({ name: new RegExp(`^${escapeRegex(name)}$`, "i") });
  }

  if (!queries.length) {
    return null;
  }

  return Category.findOne({ $or: queries });
};

const resolveCustomCategory = async (rawName, targetGender) => {
  const formattedName = formatCategoryName(rawName);
  const slugCandidate = slugifyCategory(formattedName);

  const existingCategory = await findCategoryByNameOrSlug(
    formattedName,
    slugCandidate
  );

  if (existingCategory) {
    let shouldSave = false;

    if (!existingCategory.isActive) {
      existingCategory.isActive = true;
      shouldSave = true;
    }

    if (targetGender && !existingCategory.targetGender) {
      existingCategory.targetGender = targetGender;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingCategory.save();
    }

    return existingCategory;
  }

  const slug = await ensureUniqueCategorySlug(slugCandidate);

  return Category.create({
    slug,
    name: formattedName,
    description: "",
    targetGender: targetGender || null,
    isActive: true,
  });
};

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      targetGender,
      minPrice,
      maxPrice,
      sizes,
      colors,
      tags,
      search,
      minRating,
      sort = "-createdAt",
      page = 1,
      limit = 12,
      inStock,
      includeInactive,
    } = req.query;

    // Build filter query
    const filter = {};

    if (includeInactive !== "true") {
      filter.isActive = true;
    }

    // Category filter
    if (category) {
      filter.category = category.toLowerCase();
    }

    // Subcategory filter - if subcategory is specified, use it instead of category
    if (subcategory && subcategory !== "all") {
      filter.category = subcategory.toLowerCase();
    }

    // Target Gender filter
    if (targetGender) {
      filter.targetGender = targetGender;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseInt(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseInt(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Size filter (check if any variant has the size)
    if (sizes) {
      const sizeArray = typeof sizes === 'string' ? sizes.split(',') : (Array.isArray(sizes) ? sizes : [sizes]);
      filter["variants.size"] = { $in: sizeArray.map(s => s.toUpperCase()) };
    }

    // Color filter (check if any variant has the color)
    if (colors) {
      const colorArray = typeof colors === 'string' ? colors.split(',') : (Array.isArray(colors) ? colors : [colors]);
      filter["variants.color.name"] = { $in: colorArray.map(c => c.toLowerCase()) };
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Search filter (title, description, tags)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // In stock filter
    if (inStock === "true") {
      filter.totalStock = { $gt: 0 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Handle sort options
    let sortQuery = {};
    switch (sort) {
      case "price-asc":
        sortQuery = { basePrice: 1 };
        break;
      case "price-desc":
        sortQuery = { basePrice: -1 };
        break;
      case "rating-desc":
        sortQuery = { averageRating: -1, reviewCount: -1 };
        break;
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "relevance":
      default:
        // Default relevance sort: featured first, then rating, then newest
        sortQuery = { featured: -1, averageRating: -1, createdAt: -1 };
        break;
    }

    // Execute query
    const products = await Product.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Transform to frontend format
    const formattedProducts = products.map((p) => p.toFrontendFormat());

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      total: totalProducts,
      page: parseInt(page),
      totalPages,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// @desc    Get single product by ID/slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find by slug (id in frontend)
    const product = await Product.findOne({ slug: id, isActive: true })
      .populate("relatedProductIds", "slug title basePrice media")
      .select("-__v");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Format related products
    const relatedProducts = product.relatedProductIds.map((p) => ({
      id: p.slug,
      title: p.title,
      price: p.basePrice,
      imageUrl: p.media?.[0]?.url || "",
    }));

    const effectiveMrp =
      Number.isFinite(product.mrp) && product.mrp > 0
        ? product.mrp
        : product.basePrice;
    const computedDiscount = Number.isFinite(product.discountPercentage)
      ? product.discountPercentage
      : effectiveMrp > 0 && effectiveMrp > product.basePrice
        ? Math.round(((effectiveMrp - product.basePrice) / effectiveMrp) * 100)
        : 0;

    // Prepare detailed response
    const productDetail = {
      id: product.slug,
      slug: product.slug,
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.basePrice,
      basePrice: product.basePrice,
      mrp: effectiveMrp,
      discountPercentage: computedDiscount,
      brand: product.brand ?? "Ciyatake",
      media: product.media,
      colors: product.getAvailableColors(),
      sizes: product.getAvailableSizes(),
      benefits: product.benefits,
      details: product.details,
      specifications: product.specifications,
      reviewHighlights: product.reviewHighlights,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      tags: product.tags,
      isAvailable: product.isAvailable,
      totalStock: product.totalStock,
      variants: product.variants,
      relatedProducts,
    };

    res.status(200).json({
      success: true,
      product: productDetail,
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// @desc    Create new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (
      productData.category &&
      productData.category.toLowerCase() === "other"
    ) {
      const customCategoryName = productData.customCategoryName?.trim();

      if (!customCategoryName) {
        return res.status(400).json({
          success: false,
          message: "New category name is required when selecting Other",
        });
      }

      const categoryDoc = await resolveCustomCategory(
        customCategoryName,
        productData.targetGender
      );

      productData.category = categoryDoc.slug;
    }

    if (productData.category) {
      productData.category = productData.category.toLowerCase();
    }

    delete productData.customCategoryName;

    // Check if product with same slug exists
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this slug already exists",
      });
    }

    // Create product
    const product = await Product.create(productData);

    // Update category product count
    if (productData.category) {
      await Category.findOneAndUpdate(
        { slug: productData.category },
        { $inc: { productCount: 1 } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: product.toFrontendFormat(),
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find product by slug
    const product = await Product.findOne({ slug: id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      updateData.category &&
      updateData.category.toLowerCase() === "other"
    ) {
      const customCategoryName = updateData.customCategoryName?.trim();

      if (!customCategoryName) {
        return res.status(400).json({
          success: false,
          message: "New category name is required when selecting Other",
        });
      }

      const categoryDoc = await resolveCustomCategory(
        customCategoryName,
        updateData.targetGender ?? product.targetGender
      );

      updateData.category = categoryDoc.slug;
    }

    if (updateData.category) {
      updateData.category = updateData.category.toLowerCase();
    }

    delete updateData.customCategoryName;

    // Update category count if category changed
    if (updateData.category && updateData.category !== product.category) {
      // Decrement old category
      await Category.findOneAndUpdate(
        { slug: product.category },
        { $inc: { productCount: -1 } }
      );
      // Increment new category
      await Category.findOneAndUpdate(
        { slug: updateData.category },
        { $inc: { productCount: 1 } }
      );
    }

    // Update product
    Object.assign(product, updateData);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: product.toFrontendFormat(),
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - set isActive to false
    const product = await Product.findOne({ slug: id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = false;
    await product.save();

    // Update category count
    await Category.findOneAndUpdate(
      { slug: product.category },
      { $inc: { productCount: -1 } }
    );

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// @desc    Update product stock (Admin only)
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, stockLevel } = req.body;

    if (!sku || stockLevel === undefined) {
      return res.status(400).json({
        success: false,
        message: "SKU and stockLevel are required",
      });
    }

    const product = await Product.findOne({ slug: id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find variant and update stock
    const variant = product.getVariantBySku(sku);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    variant.stockLevel = stockLevel;
    await product.save();

    // Check for low stock alert
    if (stockLevel < 10) {
      const ActivityLog = require("../models/ActivityLog");
      await ActivityLog.logProductActivity(product, "low_stock_alert");
    }

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      variant: {
        sku: variant.sku,
        stockLevel: variant.stockLevel,
      },
      totalStock: product.totalStock,
    });
  } catch (error) {
    console.error("Update Product Stock Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message,
    });
  }
};

// @desc    Get product variants by size/color
// @route   GET /api/products/:id/variants
// @access  Public
exports.getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, color } = req.query;

    const product = await Product.findOne({ slug: id, isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let variants = product.variants.filter((v) => v.isActive);

    // Filter by size
    if (size) {
      variants = variants.filter((v) => v.size === size);
    }

    // Filter by color
    if (color) {
      variants = variants.filter((v) => v.color.name === color);
    }

    res.status(200).json({
      success: true,
      variants,
    });
  } catch (error) {
    console.error("Get Product Variants Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
      error: error.message,
    });
  }
};

// @desc    Check product availability
// @route   GET /api/products/:id/availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku } = req.query;

    const product = await Product.findOne({ slug: id, isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (sku) {
      // Check specific variant
      const variant = product.getVariantBySku(sku);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
      }

      return res.status(200).json({
        success: true,
        available: variant.isActive && variant.stockLevel > 0,
        stockLevel: variant.stockLevel,
        sku: variant.sku,
      });
    }

    // Check overall product availability
    res.status(200).json({
      success: true,
      available: product.isAvailable,
      totalStock: product.totalStock,
    });
  } catch (error) {
    console.error("Check Availability Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check availability",
      error: error.message,
    });
  }
};
