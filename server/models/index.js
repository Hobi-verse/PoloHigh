// Export all models from a central location
module.exports = {
  User: require("./User"),
  OTP: require("./OTP"),
  Product: require("./Product"),
  Category: require("./Category"),
  Cart: require("./Cart"),
  Wishlist: require("./Wishlist"),
  Order: require("./Order"),
  Address: require("./Address"),
  PaymentMethod: require("./PaymentMethod"),
  CustomerProfile: require("./CustomerProfile"),
  Review: require("./Review"),
  ActivityLog: require("./ActivityLog"),
  Report: require("./Report"),
  Coupon: require("./Coupon"),
  TokenBlacklist: require("./TokenBlacklist"),
};
