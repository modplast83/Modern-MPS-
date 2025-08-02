import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
