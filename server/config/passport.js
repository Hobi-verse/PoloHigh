const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const CustomerProfile = require("../models/CustomerProfile");

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile);

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists with same email
        const existingUserByEmail = await User.findOne({
          email: profile.emails?.[0]?.value,
        });

        if (existingUserByEmail) {
          // Link Google account to existing user
          existingUserByEmail.googleId = profile.id;
          existingUserByEmail.isVerified = true;
          
          // Update profile picture if not set
          if (!existingUserByEmail.profilePicture && profile.photos?.[0]?.value) {
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
          // Generate a temporary mobile number or leave empty
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

        console.log("New Google user created:", newUser._id);
        return done(null, newUser);
        
      } catch (error) {
        console.error("Google OAuth Error:", error);
        return done(error, null);
      }
    }
  )
);

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