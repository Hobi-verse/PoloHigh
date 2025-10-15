const mongoose = require("mongoose");
const Product = require("../models/Product");

// Test Product Model
async function testProductModel() {
  console.log("\n🧪 Testing Product Model...\n");

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ciyatake-test", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing products
    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    // Test 1: Create a basic product
    console.log("\n📝 Test 1: Creating a product...");
    const product = await Product.create({
      slug: "classic-white-tee",
      title: "Classic White Tee",
      description: "A timeless white t-shirt made from premium cotton",
      category: "clothing",
      basePrice: 2075,
      media: [
        {
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
          thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
          alt: "Classic White Tee",
          isPrimary: true,
          type: "image",
        },
      ],
      variants: [
        {
          sku: "CWT-WHT-XS",
          size: "xs",
          color: { name: "white", hex: "#FFFFFF" },
          stockLevel: 20,
        },
        {
          sku: "CWT-WHT-S",
          size: "s",
          color: { name: "white", hex: "#FFFFFF" },
          stockLevel: 30,
        },
        {
          sku: "CWT-WHT-M",
          size: "m",
          color: { name: "white", hex: "#FFFFFF" },
          stockLevel: 50,
        },
        {
          sku: "CWT-WHT-L",
          size: "l",
          color: { name: "white", hex: "#FFFFFF" },
          stockLevel: 40,
        },
      ],
      benefits: ["100% Cotton", "Machine Washable", "Classic Fit"],
      details: {
        description: "Premium quality cotton t-shirt",
        features: ["Soft fabric", "Durable stitching", "Comfortable fit"],
      },
      tags: ["basic", "essential", "cotton"],
    });

    console.log("✅ Product created:", product.slug);
    console.log("   - Total Stock:", product.totalStock);
    console.log("   - Available:", product.isAvailable);
    console.log("   - Image URL:", product.imageUrl);
    console.log("   - ID (virtual):", product.id);

    // Test 2: Get available sizes and colors
    console.log("\n📝 Test 2: Testing helper methods...");
    const sizes = product.getAvailableSizes();
    const colors = product.getAvailableColors();
    console.log("✅ Available sizes:", sizes);
    console.log("✅ Available colors:", colors);

    // Test 3: Frontend format transformation
    console.log("\n📝 Test 3: Testing frontend format...");
    const frontendData = product.toFrontendFormat();
    console.log("✅ Frontend format:");
    console.log(JSON.stringify(frontendData, null, 2));

    // Test 4: Get variant by SKU
    console.log("\n📝 Test 4: Testing variant lookup...");
    const variant = product.getVariantBySku("CWT-WHT-M");
    console.log("✅ Variant found:", variant?.sku, "- Stock:", variant?.stockLevel);

    // Test 5: Update stock and check total
    console.log("\n📝 Test 5: Testing stock updates...");
    product.variants[0].stockLevel = 0;
    product.updateTotalStock();
    await product.save();
    console.log("✅ Updated stock - New total:", product.totalStock);

    // Test 6: Create product with multiple colors
    console.log("\n📝 Test 6: Creating multi-color product...");
    const multiColorProduct = await Product.create({
      slug: "running-shoes",
      title: "Running Shoes",
      category: "shoes",
      basePrice: 7470,
      media: [
        {
          url: "https://images.unsplash.com/photo-1542291026",
          isPrimary: true,
        },
      ],
      variants: [
        {
          sku: "RS-BLK-M",
          size: "m",
          color: { name: "black", hex: "#000000" },
          stockLevel: 15,
        },
        {
          sku: "RS-WHT-M",
          size: "m",
          color: { name: "white", hex: "#FFFFFF" },
          stockLevel: 20,
        },
        {
          sku: "RS-BLK-L",
          size: "l",
          color: { name: "black", hex: "#000000" },
          stockLevel: 10,
        },
      ],
    });

    const multiColors = multiColorProduct.getAvailableColors();
    const multiSizes = multiColorProduct.getAvailableSizes();
    console.log("✅ Multi-color product colors:", multiColors);
    console.log("✅ Multi-color product sizes:", multiSizes);

    console.log("\n✅ All Product Model tests passed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB\n");
  }
}

// Run tests
testProductModel();
