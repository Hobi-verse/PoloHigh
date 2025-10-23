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
          email: profile.emails?.[0]?.value?.toLowerCase(),
        });

        if (existingUserByEmail) {
          // Link Google account to existing user
          existingUserByEmail.googleId = profile.id;
          existingUserByEmail.isVerified = true;
          if (!existingUserByEmail.email) {
            existingUserByEmail.profileSetupRequired = true;
          }

          // Update profile picture if not set
          if (!existingUserByEmail.profilePicture && profile.photos?.[0]?.value) {
            existingUserByEmail.profilePicture = profile.photos[0].value;
          }

          await existingUserByEmail.save();

          // Ensure customer profile exists for linked account
          try {
            console.log(`🔄 Ensuring customer profile for linked Google account: ${existingUserByEmail._id}`);
            const customerProfile = await CustomerProfile.findOneAndUpdate(
              { userId: existingUserByEmail._id },
              { 
                userId: existingUserByEmail._id,
                membership: {
                  tier: "Bronze",
                  memberSince: new Date(),
                  nextTier: {
                    name: "Silver",
                    progressPercent: 0,
                    pointsNeeded: 1000
                  }
                }
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`✅ Google link - Customer profile ensured:`, {
              userId: existingUserByEmail._id,
              profileId: customerProfile._id,
              email: existingUserByEmail.email,
              tier: customerProfile.membership.tier
            });
          } catch (profileError) {
            console.error("❌ Google link - Ensure customer profile error:", profileError);
          }

          return done(null, existingUserByEmail);
        }

        // Create new user account
        const newUser = await User.create({
          googleId: profile.id,
          fullName: profile.displayName,
          email: profile.emails?.[0]?.value?.toLowerCase() || "",
          profilePicture: profile.photos?.[0]?.value || "",
          isVerified: true,
          authProvider: "google",
          profileSetupRequired: false, // Email is available from Google
        });

        // Create customer profile for Google user
        try {
          console.log(`🔄 Creating customer profile for Google signup user: ${newUser._id}`);
          const customerProfile = await CustomerProfile.findOneAndUpdate(
            { userId: newUser._id },
            {
              userId: newUser._id,
              membership: {
                tier: "Bronze",
                memberSince: new Date(),
                nextTier: {
                  name: "Silver",
                  progressPercent: 0,
                  pointsNeeded: 1000
                }
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          console.log(`✅ Google signup - Customer profile created:`, {
            userId: newUser._id,
            profileId: customerProfile._id,
            email: newUser.email,
            googleId: newUser.googleId,
            tier: customerProfile.membership.tier
          });
        } catch (profileError) {
          console.error("❌ Google signup - Create customer profile error:", profileError);
        }

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