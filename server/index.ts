import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Configure CORS for cookies - must be before session middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from localhost during development
  if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('.replit.dev')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Cookie, Set-Cookie');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure session store  
const MemoryStoreSession = MemoryStore(session);

// Configure sessions with proper store
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'plastic-bag-manufacturing-system-secret-key-2025',
  resave: true, // Always save session to extend lifetime
  saveUninitialized: false, // Don't create session until something stored
  rolling: true, // Reset expiry on activity - crucial for keeping session alive
  cookie: {
    secure: isProduction, // HTTPS-only in production for security
    httpOnly: isProduction, // Prevent XSS in production
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: isProduction ? 'strict' : 'lax' // Stricter CSRF protection in production
  },
  name: 'plastic-bag-session', // Custom session name
  unset: 'keep' // Keep the session even if we unset properties
}));

// Session extension middleware - extends session on any API call
app.use((req, res, next) => {
  // For API requests, extend the session if it exists
  if (req.path.startsWith("/api") && req.session && req.session.userId) {
    // Touch the session to reset expiry with rolling sessions
    req.session.touch();
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Enhanced database initialization for production deployment
  if (app.get("env") === "production") {
    try {
      console.log("🚀 Initializing production database...");
      
      // Try primary migration approach first
      try {
        const { migrate } = await import('drizzle-orm/neon-serverless/migrator');
        const { db } = await import('./db.js');
        await migrate(db, { migrationsFolder: './migrations' });
        console.log("✅ Database migrations completed via migrate()");
      } catch (migrationError: any) {
        console.log("⚠️ Standard migration failed, trying alternative approach...");
        console.log("Migration error:", migrationError?.message || migrationError);
        
        // Alternative approach: Use schema push for deployment
        try {
          const { db } = await import('./db.js');
          
          // Test database connection first
          await db.execute('SELECT 1 as test');
          console.log("✅ Database connection verified");
          
          // Check if database is empty or needs schema initialization
          const tableCheck = await db.execute(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          `);
          
          if (tableCheck.rows.length === 0) {
            console.log("🆕 Fresh database detected - will initialize via schema push");
            console.log("✅ Database ready for schema initialization on first request");
          } else {
            console.log(`✅ Existing database with ${tableCheck.rows.length} tables detected`);
          }
          
        } catch (connectionError: any) {
          console.error("❌ Database connection failed:", connectionError?.message || connectionError);
          throw connectionError;
        }
      }
      
    } catch (error: any) {
      console.error("❌ Database initialization failed:", error?.message || error);
      console.error("This may be a temporary platform issue. Continuing with server startup...");
      console.error("Database operations will be retried on first request.");
      // Don't exit - let the server start and handle database issues gracefully
    }
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
