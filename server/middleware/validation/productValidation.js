// Product validation middleware
exports.validateProduct = (req, res, next) => {
  const errors = [];
  const { slug, title, category, basePrice, variants, customCategoryName, targetGender } = req.body;

  // Required fields
  if (!slug || slug.trim() === "") {
    errors.push("Product slug is required");
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push("Slug must contain only lowercase letters, numbers, and hyphens");
  }

  if (!title || title.trim() === "") {
    errors.push("Product title is required");
  }

  // Validate targetGender
  const validGenders = ["Men", "Women", "Kids", "Unisex"];
  if (!targetGender || !validGenders.includes(targetGender)) {
    errors.push("Target gender is required and must be one of: Men, Women, Kids, Unisex");
  }

  if (!category || category.trim() === "") {
    errors.push("Product category is required");
  } else if (category.trim().toLowerCase() === "other") {
    if (!customCategoryName || customCategoryName.trim() === "") {
      errors.push("Custom category name is required when selecting Other");
    } else if (customCategoryName.trim().length > 60) {
      errors.push("Custom category name must be 60 characters or fewer");
    }
  }

  if (!basePrice) {
    errors.push("Product base price is required");
  } else if (isNaN(basePrice) || basePrice < 0) {
    errors.push("Base price must be a positive number");
  }

  // Validate variants if provided
  if (variants && Array.isArray(variants)) {
    if (variants.length === 0) {
      errors.push("At least one variant is required");
    }

    variants.forEach((variant, index) => {
      if (!variant.sku || variant.sku.trim() === "") {
        errors.push(`Variant ${index + 1}: SKU is required`);
      }

      if (!variant.size || variant.size.trim() === "") {
        errors.push(`Variant ${index + 1}: Size is required`);
      }

      if (!variant.color || !variant.color.name) {
        errors.push(`Variant ${index + 1}: Color name is required`);
      }

      if (variant.stockLevel !== undefined) {
        if (isNaN(variant.stockLevel) || variant.stockLevel < 0) {
          errors.push(`Variant ${index + 1}: Stock level must be a non-negative number`);
        }
      }

      if (variant.priceOverride !== undefined) {
        if (isNaN(variant.priceOverride) || variant.priceOverride < 0) {
          errors.push(`Variant ${index + 1}: Price override must be a positive number`);
        }
      }
    });

    // Check for duplicate SKUs
    const skus = variants.map((v) => v.sku);
    const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    if (duplicateSkus.length > 0) {
      errors.push(`Duplicate SKUs found: ${duplicateSkus.join(", ")}`);
    }
  }

  // Validate media if provided
  if (req.body.media && Array.isArray(req.body.media)) {
    req.body.media.forEach((media, index) => {
      if (!media.url || media.url.trim() === "") {
        errors.push(`Media ${index + 1}: URL is required`);
      }
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Product update validation (fields are optional)
exports.validateProductUpdate = (req, res, next) => {
  const errors = [];
  const { slug, basePrice, variants, category, customCategoryName, targetGender } = req.body;

  // Validate targetGender if provided
  if (targetGender !== undefined) {
    const validGenders = ["Men", "Women", "Kids", "Unisex"];
    if (!validGenders.includes(targetGender)) {
      errors.push("Target gender must be one of: Men, Women, Kids, Unisex");
    }
  }

  // Validate slug format if provided
  if (slug !== undefined) {
    if (slug.trim() === "") {
      errors.push("Product slug cannot be empty");
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push("Slug must contain only lowercase letters, numbers, and hyphens");
    }
  }

  // Validate base price if provided
  if (basePrice !== undefined) {
    if (isNaN(basePrice) || basePrice < 0) {
      errors.push("Base price must be a positive number");
    }
  }

  if (category && category.trim().toLowerCase() === "other") {
    if (!customCategoryName || customCategoryName.trim() === "") {
      errors.push("Custom category name is required when selecting Other");
    } else if (customCategoryName.trim().length > 60) {
      errors.push("Custom category name must be 60 characters or fewer");
    }
  }

  // Validate variants if provided
  if (variants && Array.isArray(variants)) {
    variants.forEach((variant, index) => {
      if (variant.sku && variant.sku.trim() === "") {
        errors.push(`Variant ${index + 1}: SKU cannot be empty`);
      }

      if (variant.size && variant.size.trim() === "") {
        errors.push(`Variant ${index + 1}: Size cannot be empty`);
      }

      if (variant.stockLevel !== undefined) {
        if (isNaN(variant.stockLevel) || variant.stockLevel < 0) {
          errors.push(`Variant ${index + 1}: Stock level must be a non-negative number`);
        }
      }

      if (variant.priceOverride !== undefined) {
        if (isNaN(variant.priceOverride) || variant.priceOverride < 0) {
          errors.push(`Variant ${index + 1}: Price override must be a positive number`);
        }
      }
    });
  }

  // Validate media if provided
  if (req.body.media && Array.isArray(req.body.media)) {
    req.body.media.forEach((media, index) => {
      if (media.url && media.url.trim() === "") {
        errors.push(`Media ${index + 1}: URL cannot be empty`);
      }
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Stock update validation
exports.validateStockUpdate = (req, res, next) => {
  const errors = [];
  const { sku, stockLevel } = req.body;

  if (!sku || sku.trim() === "") {
    errors.push("SKU is required");
  }

  if (stockLevel === undefined || stockLevel === null) {
    errors.push("Stock level is required");
  } else if (isNaN(stockLevel) || stockLevel < 0) {
    errors.push("Stock level must be a non-negative number");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};
