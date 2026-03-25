const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const CustomerProfile = require("../models/CustomerProfile");
const env = require("./env");

if (env.googleClientId && env.googleClientSecret) {
  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${env.apiPrefix}/v1/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          const existingUserByEmail = await User.findOne({
            email: profile.emails?.[0]?.value,
          });

          if (existingUserByEmail) {
            existingUserByEmail.googleId = profile.id;
            existingUserByEmail.isVerified = true;

            if (
              !existingUserByEmail.profilePicture &&
              profile.photos?.[0]?.value
            ) {
              existingUserByEmail.profilePicture = profile.photos[0].value;
            }

            await existingUserByEmail.save();
            return done(null, existingUserByEmail);
          }

          // Create new user account
          const newUser = await User.create({
            googleId: profile.id,
            fullName: profile.displayName,
            email: profile.emails?.[0]?.value || "",
            profilePicture: profile.photos?.[0]?.value || "",
            isVerified: true,
            authProvider: "google",
            mobileNumber: "",
          });

          // Create customer profile
          await CustomerProfile.findOneAndUpdate(
            { userId: newUser._id },
            {
              userId: newUser._id,
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              profilePicture: profile.photos?.[0]?.value || "",
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          return done(null, newUser);
        } catch (error) {
          console.error("Google OAuth Error:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth disabled. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable."
  );
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
