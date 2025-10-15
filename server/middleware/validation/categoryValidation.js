// Category validation middleware
exports.validateCategory = (req, res, next) => {
  const errors = [];
  const { slug, name } = req.body;

  // Required fields
  if (!slug || slug.trim() === "") {
    errors.push("Category slug is required");
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push("Slug must contain only lowercase letters, numbers, and hyphens");
  }

  if (!name || name.trim() === "") {
    errors.push("Category name is required");
  }

  // Validate display order if provided
  if (req.body.displayOrder !== undefined) {
    if (isNaN(req.body.displayOrder) || req.body.displayOrder < 0) {
      errors.push("Display order must be a non-negative number");
    }
  }

  // Validate product count if provided
  if (req.body.productCount !== undefined) {
    if (isNaN(req.body.productCount) || req.body.productCount < 0) {
      errors.push("Product count must be a non-negative number");
    }
  }

  // Validate hero image if provided
  if (req.body.heroImage && typeof req.body.heroImage === "object") {
    if (!req.body.heroImage.url || req.body.heroImage.url.trim() === "") {
      errors.push("Hero image URL is required if hero image is provided");
    }
  }

  // Validate filters if provided
  if (req.body.filters && typeof req.body.filters === "object") {
    // Validate sizes array
    if (req.body.filters.sizes && !Array.isArray(req.body.filters.sizes)) {
      errors.push("Filters.sizes must be an array");
    }

    // Validate colors array
    if (req.body.filters.colors && !Array.isArray(req.body.filters.colors)) {
      errors.push("Filters.colors must be an array");
    } else if (req.body.filters.colors) {
      req.body.filters.colors.forEach((color, index) => {
        if (!color.name || color.name.trim() === "") {
          errors.push(`Filters.colors[${index}]: name is required`);
        }
      });
    }

    // Validate price ranges array
    if (req.body.filters.priceRanges && !Array.isArray(req.body.filters.priceRanges)) {
      errors.push("Filters.priceRanges must be an array");
    } else if (req.body.filters.priceRanges) {
      req.body.filters.priceRanges.forEach((range, index) => {
        if (!range.label || range.label.trim() === "") {
          errors.push(`Filters.priceRanges[${index}]: label is required`);
        }
        if (range.min === undefined || isNaN(range.min) || range.min < 0) {
          errors.push(`Filters.priceRanges[${index}]: min must be a non-negative number`);
        }
        if (range.max === undefined || isNaN(range.max) || range.max < 0) {
          errors.push(`Filters.priceRanges[${index}]: max must be a non-negative number`);
        }
        if (range.min !== undefined && range.max !== undefined && range.min > range.max) {
          errors.push(`Filters.priceRanges[${index}]: min cannot be greater than max`);
        }
      });
    }
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

// Category update validation (fields are optional)
exports.validateCategoryUpdate = (req, res, next) => {
  const errors = [];
  const { slug, displayOrder, productCount } = req.body;

  // Validate slug format if provided
  if (slug !== undefined) {
    if (slug.trim() === "") {
      errors.push("Category slug cannot be empty");
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push("Slug must contain only lowercase letters, numbers, and hyphens");
    }
  }

  // Validate display order if provided
  if (displayOrder !== undefined) {
    if (isNaN(displayOrder) || displayOrder < 0) {
      errors.push("Display order must be a non-negative number");
    }
  }

  // Validate product count if provided
  if (productCount !== undefined) {
    if (isNaN(productCount) || productCount < 0) {
      errors.push("Product count must be a non-negative number");
    }
  }

  // Validate hero image if provided
  if (req.body.heroImage && typeof req.body.heroImage === "object") {
    if (req.body.heroImage.url && req.body.heroImage.url.trim() === "") {
      errors.push("Hero image URL cannot be empty");
    }
  }

  // Validate filters if provided (same as create)
  if (req.body.filters && typeof req.body.filters === "object") {
    if (req.body.filters.sizes && !Array.isArray(req.body.filters.sizes)) {
      errors.push("Filters.sizes must be an array");
    }

    if (req.body.filters.colors && !Array.isArray(req.body.filters.colors)) {
      errors.push("Filters.colors must be an array");
    } else if (req.body.filters.colors) {
      req.body.filters.colors.forEach((color, index) => {
        if (color.name && color.name.trim() === "") {
          errors.push(`Filters.colors[${index}]: name cannot be empty`);
        }
      });
    }

    if (req.body.filters.priceRanges && !Array.isArray(req.body.filters.priceRanges)) {
      errors.push("Filters.priceRanges must be an array");
    } else if (req.body.filters.priceRanges) {
      req.body.filters.priceRanges.forEach((range, index) => {
        if (range.label && range.label.trim() === "") {
          errors.push(`Filters.priceRanges[${index}]: label cannot be empty`);
        }
        if (range.min !== undefined && (isNaN(range.min) || range.min < 0)) {
          errors.push(`Filters.priceRanges[${index}]: min must be a non-negative number`);
        }
        if (range.max !== undefined && (isNaN(range.max) || range.max < 0)) {
          errors.push(`Filters.priceRanges[${index}]: max must be a non-negative number`);
        }
        if (
          range.min !== undefined &&
          range.max !== undefined &&
          range.min > range.max
        ) {
          errors.push(`Filters.priceRanges[${index}]: min cannot be greater than max`);
        }
      });
    }
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
