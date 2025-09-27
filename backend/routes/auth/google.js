// routes/auth/google.js
import "dotenv/config";
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../../models/user.js";

const router = express.Router();


const DEFAULT_BASE =
  process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 4000}`;

const BASE_URL =
  process.env.PUBLIC_URL?.replace(/\/$/, "") ||
  DEFAULT_BASE.replace(/\/$/, "");


const CALLBACK_URL =
  (process.env.GOOGLE_CALLBACK_URL &&
    process.env.GOOGLE_CALLBACK_URL.replace(/\/$/, "")) ||
  `${BASE_URL}/api/auth/google/callback`;


const FRONTEND_URL =
  (process.env.FRONTEND_URL && process.env.FRONTEND_URL.replace(/\/$/, "")) ||
  "http://localhost:5173";

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    callbackURL: CALLBACK_URL,
    //callbackURL: "/api/auth/google/callback",
    proxy: true,
  },
  async (_at, _rt, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase() || null;
      const user = await User.findOneAndUpdate(
        { googleId: profile.id },
        { googleId: profile.id, email, name: profile.displayName, avatar: profile.photos?.[0]?.value },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      done(null, user);
    } catch (e) { done(e); }
  }
));

// Get current user info
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dummy-secret");
    
    // Get user from database
    const user = await User.findById(decoded.sub);
    
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.json({ success: false, message: 'Invalid token' });
  }
});

// Real Google OAuth (uncomment when you have real credentials)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Mock Google OAuth for testing (comment out when using real credentials)
// router.get("/google", async (req, res) => {
//   try {
//     // Create mock user without database dependency
//     const mockUser = {
//       _id: "mock-user-id-123",
//       googleId: "mock-google-id",
//       email: "test@example.com",
//       name: "Test User",
//       avatar: "https://via.placeholder.com/150"
//     };
//     
//     // Generate JWT token
//     const token = jwt.sign({ sub: mockUser._id }, process.env.JWT_SECRET || "dummy-secret", { expiresIn: "2h" });
//     
//     // Send HTML page that posts message to parent window
//     res.send(`
//       <html>
//         <body>
//           <script>
//             window.opener.postMessage({
//               type: 'GOOGLE_AUTH_SUCCESS',
//               token: '${token}',
//               user: {
//                 id: '${mockUser._id}',
//                 name: '${mockUser.name}',
//                 email: '${mockUser.email}',
//                 avatar: '${mockUser.avatar}'
//               }
//             }, '${process.env.FRONTEND_URL || 'http://localhost:5173'}');
//             window.close();
//           </script>
//           <p>Mock login successful! This window should close automatically.</p>
//         </body>
//       </html>
//     `);
//   } catch (error) {
//     console.error('Mock auth error:', error);
//     res.status(500).send('Mock authentication failed');
//   }
// });

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=google" }),
  (req, res) => {
    const token = jwt.sign({ sub: req.user._id }, process.env.JWT_SECRET || "dummy-secret", { expiresIn: "2h" });
    
    // Send HTML page that posts message to parent window
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              token: '${token}',
              user: {
                id: '${req.user._id}',
                name: '${req.user.name}',
                email: '${req.user.email}',
                avatar: '${req.user.avatar || ''}'
              }
            }, '${process.env.FRONTEND_URL || 'http://localhost:5173'}');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
);

export default router;
