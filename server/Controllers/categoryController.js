const Category = require("../models/Category");
const Product = require("../models/Product");

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    // Build filter
    const filter = {};
    if (!includeInactive) {
      filter.isActive = true;
    }

    // Get all categories
    const categories = await Category.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .select("-__v");

    // Format response
    const formattedCategories = categories.map((cat) => ({
      id: cat.slug,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      heroImage: cat.heroImage,
      productCount: cat.productCount,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    }));

    res.status(200).json({
      success: true,
      count: formattedCategories.length,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("Get All Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true })
      .populate("parentCategory", "slug name")
      .select("-__v");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get subcategories
    const subcategories = await Category.find({
      parentCategory: category._id,
      isActive: true,
    }).select("slug name productCount");

    // Format response
    const categoryData = {
      id: category.slug,
      slug: category.slug,
      name: category.name,
      description: category.description,
      heroImage: category.heroImage,
      parentCategory: category.parentCategory
        ? {
          slug: category.parentCategory.slug,
          name: category.parentCategory.name,
        }
        : null,
      filters: category.filters,
      productCount: category.productCount,
      displayOrder: category.displayOrder,
      subcategories: subcategories.map((sub) => ({
        slug: sub.slug,
        name: sub.name,
        productCount: sub.productCount,
      })),
      seo: category.seo,
    };

    res.status(200).json({
      success: true,
      category: categoryData,
    });
  } catch (error) {
    console.error("Get Category By Slug Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// @desc    Get category filters (available sizes, colors, price ranges)
// @route   GET /api/categories/:slug/filters
// @access  Public
exports.getCategoryFilters = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If filters are already defined in category, return them
    if (category.filters && Object.keys(category.filters).length > 0) {
      return res.status(200).json({
        success: true,
        filters: category.filters,
      });
    }

    // Otherwise, compute filters from products in this category
    const products = await Product.find({
      category: slug,
      isActive: true,
    });

    // Extract unique sizes
    const sizesSet = new Set();
    products.forEach((product) => {
      product.variants
        .filter((v) => v.isActive)
        .forEach((v) => sizesSet.add(v.size));
    });

    // Extract unique colors
    const colorsMap = new Map();
    products.forEach((product) => {
      product.variants
        .filter((v) => v.isActive)
        .forEach((v) => {
          if (!colorsMap.has(v.color.name)) {
            colorsMap.set(v.color.name, v.color.hex || v.color.name);
          }
        });
    });

    // Calculate price ranges
    const prices = products.map((p) => p.basePrice).filter(Boolean);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const priceRanges = [
      { label: "Under ₹1000", min: 0, max: 1000 },
      { label: "₹1000 - ₹3000", min: 1000, max: 3000 },
      { label: "₹3000 - ₹5000", min: 3000, max: 5000 },
      { label: "₹5000 - ₹10000", min: 5000, max: 10000 },
      { label: "Above ₹10000", min: 10000, max: maxPrice + 1 },
    ].filter((range) => range.max >= minPrice && range.min <= maxPrice);

    const filters = {
      sizes: Array.from(sizesSet),
      colors: Array.from(colorsMap.entries()).map(([name, hex]) => ({
        name,
        hex,
      })),
      priceRanges,
    };

    res.status(200).json({
      success: true,
      filters,
    });
  } catch (error) {
    console.error("Get Category Filters Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category filters",
      error: error.message,
    });
  }
};

// @desc    Get products by category
// @route   GET /api/categories/:slug/products
// @access  Public
exports.getCategoryProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      minPrice,
      maxPrice,
      sizes,
      colors,
      sort = "-createdAt",
      page = 1,
      limit = 12,
    } = req.query;

    // Check if category exists
    const category = await Category.findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Build filter query
    const filter = { category: slug, isActive: true };

    // Price range filter
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseInt(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseInt(maxPrice);
    }

    // Size filter
    if (sizes) {
      const sizeArray = Array.isArray(sizes) ? sizes : [sizes];
      filter["variants.size"] = { $in: sizeArray };
    }

    // Color filter
    if (colors) {
      const colorArray = Array.isArray(colors) ? colors : [colors];
      filter["variants.color.name"] = { $in: colorArray };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    // Get total count
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Transform to frontend format
    const formattedProducts = products.map((p) => p.toFrontendFormat());

    res.status(200).json({
      success: true,
      category: {
        slug: category.slug,
        name: category.name,
      },
      count: formattedProducts.length,
      total: totalProducts,
      page: parseInt(page),
      totalPages,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Get Category Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category products",
      error: error.message,
    });
  }
};

// @desc    Create new category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    // Check if category with same slug exists
    const existingCategory = await Category.findOne({ slug: categoryData.slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }

    // If parent category is specified, verify it exists
    if (categoryData.parentCategory) {
      const parentExists = await Category.findById(categoryData.parentCategory);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    // Create category
    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: {
        id: category.slug,
        slug: category.slug,
        name: category.name,
        description: category.description,
      },
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:slug
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If parent category is being updated, verify it exists
    if (updateData.parentCategory) {
      const parentExists = await Category.findById(updateData.parentCategory);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }

      // Prevent circular reference
      if (updateData.parentCategory === category._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent",
        });
      }
    }

    // Update category
    Object.assign(category, updateData);
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: {
        id: category.slug,
        slug: category.slug,
        name: category.name,
        description: category.description,
      },
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:slug
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: slug,
      isActive: true,
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} active products. Please reassign or delete products first.`,
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({
      parentCategory: category._id,
      isActive: true,
    });

    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.`,
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

// @desc    Update category product count (called internally)
// @route   PATCH /api/categories/:slug/product-count
// @access  Private/Admin
exports.updateProductCount = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Count active products in this category
    const productCount = await Product.countDocuments({
      category: slug,
      isActive: true,
    });

    category.productCount = productCount;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Product count updated successfully",
      productCount,
    });
  } catch (error) {
    console.error("Update Product Count Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product count",
      error: error.message,
    });
  }
};

// @desc    Get category tree (hierarchical structure)
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = async (req, res) => {
  try {
    const { gender } = req.query;

    if (gender) {
      // If gender is specified, only return main categories that match the targetGender
      const mainCategoryFilter = { 
        isActive: true, 
        parentCategory: null,
        targetGender: gender 
      };

      // Get main categories (those without a parent) that match the gender
      const mainCategories = await Category.find(mainCategoryFilter)
        .sort({ displayOrder: 1, name: 1 })
        .select("slug name parentCategory productCount targetGender");

      // Build tree structure with subcategories
      const categoriesWithChildren = await Promise.all(
        mainCategories.map(async (mainCat) => {
          // Get all subcategories for this main category
          const subcategories = await Category.find({
            parentCategory: mainCat._id,
            isActive: true,
          })
            .sort({ displayOrder: 1, name: 1 })
            .select("slug name parentCategory productCount targetGender");

          // Format subcategories
          const children = subcategories.map((subCat) => ({
            id: subCat.slug,
            slug: subCat.slug,
            name: subCat.name,
            productCount: subCat.productCount,
            targetGender: subCat.targetGender,
            children: [],
          }));

          return {
            id: mainCat.slug,
            slug: mainCat.slug,
            name: mainCat.name,
            productCount: mainCat.productCount,
            targetGender: mainCat.targetGender,
            children: children,
          };
        })
      );

      res.status(200).json({
        success: true,
        categories: categoriesWithChildren,
        filter: { gender },
      });
    } else {
      // If no gender specified, return all categories in tree structure
      const categories = await Category.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select("slug name parentCategory productCount targetGender");

      // Build tree structure
      const categoryMap = new Map();
      const rootCategories = [];

      // First pass: create map of all categories
      categories.forEach((cat) => {
        categoryMap.set(cat._id.toString(), {
          id: cat.slug,
          slug: cat.slug,
          name: cat.name,
          productCount: cat.productCount,
          targetGender: cat.targetGender,
          children: [],
        });
      });

      // Second pass: build tree
      categories.forEach((cat) => {
        const node = categoryMap.get(cat._id.toString());
        if (cat.parentCategory) {
          const parent = categoryMap.get(cat.parentCategory.toString());
          if (parent) {
            parent.children.push(node);
          } else {
            rootCategories.push(node);
          }
        } else {
          rootCategories.push(node);
        }
      });

      res.status(200).json({
        success: true,
        categories: rootCategories,
      });
    }
  } catch (error) {
    console.error("Get Category Tree Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category tree",
      error: error.message,
    });
  }
};
