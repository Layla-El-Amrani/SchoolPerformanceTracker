import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "academic-performance-analysis-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, 
      async (email, password, done) => {
        try {
          console.log(`Login attempt for email: ${email}`);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log(`User not found: ${email}`);
            return done(null, false);
          }
          
          const isPasswordValid = await comparePasswords(password, user.password);
          console.log(`Password validation for ${email}: ${isPasswordValid}`);
          
          if (!isPasswordValid) {
            return done(null, false);
          }
          
          return done(null, user);
        } catch (error) {
          console.error("Authentication error:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, username, password } = req.body;
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        email,
        username,
        password: await hashPassword(password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal that the user doesn't exist
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      // Generate reset token
      const resetToken = randomUUID();
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour
      
      // Update user with reset token
      await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);
      
      // Create password reset link
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      
      // In production, we would send an email here
      console.log(`Reset password link for ${email}: ${resetLink}`);
      
      res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/set-new-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      // Find user with this reset token
      const users = storage.getUsers();
      const user = users.find(u => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > new Date());
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Update user's password and clear reset token
      const hashedPassword = await hashPassword(password);
      await storage.updateUserWithPassword(user.id, hashedPassword);
      await storage.updateUserResetToken(user.id, null, null);
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  return app;
}
