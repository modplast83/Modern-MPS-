# Deployment Checklist for MPBF Next

This checklist ensures successful deployment to Replit Deployments.

## Pre-Deployment Steps

### 1. Environment Variables ✅
- [x] DATABASE_URL configured in development
- [ ] DATABASE_URL will be set in Replit Deployments environment variables
- [ ] NODE_ENV will be automatically set to "production" in deployment

### 2. Database Migration Status ✅
- [x] Migration files exist in `/migrations` directory
- [x] Database schema is compatible with production
- [x] Migration script handles both fresh and existing databases
- [x] Data integrity is preserved during schema updates

### 3. Application Build ✅
- [x] Frontend builds successfully with `vite build`
- [x] Backend bundles correctly with `esbuild`
- [x] All TypeScript compilation passes
- [x] Health check endpoint available at `/api/health`

### 4. Dependencies ✅
- [x] All production dependencies are in package.json
- [x] Database driver (@neondatabase/serverless) is included
- [x] Build tools are properly configured
- [x] No development-only dependencies in production build

## Deployment Configuration

### 1. Build Process
```bash
# Automatic build process during deployment:
1. npm run build (vite + esbuild)
2. Database migration (handled in server startup)
3. Health check verification
```

### 2. Runtime Configuration
- **Start Command**: `npm start` (runs `node dist/index.js`)
- **Health Check**: `GET /api/health`
- **Port**: Automatically assigned by Replit
- **Environment**: NODE_ENV=production

### 3. Database Setup
The application handles database setup automatically:
- Connects using DATABASE_URL environment variable
- Runs migrations on startup if needed
- Creates tables if they don't exist
- Preserves existing data during updates

## Troubleshooting Common Issues

### Database Connection Issues
```
Error: Database migrations could not be applied
```
**Solutions**:
1. Verify DATABASE_URL is set in Deployments environment variables
2. Ensure database is accessible from deployment environment
3. Check database URL format (should start with postgresql:// or postgres://)

### Migration Failures
```
Error: underlying platform issue
```
**Solutions**:
1. Run `node scripts/prepare-deployment.js` locally to verify setup
2. Check that migration files are not corrupted
3. Ensure database has proper permissions

### Build Failures
```
Error: Application cannot access the database during deployment initialization
```
**Solutions**:
1. Ensure DATABASE_URL is available during build process
2. Check that all dependencies are properly installed
3. Verify TypeScript compilation passes

## Deployment Steps

### 1. In Replit Interface
1. Open your Repl
2. Click the "Deploy" button in the top-right
3. Configure environment variables:
   - Set `DATABASE_URL` to your production database URL
4. Click "Deploy"

### 2. Verification
1. Wait for build to complete (usually 2-3 minutes)
2. Check deployment logs for any errors
3. Visit the deployed URL
4. Test the health check endpoint: `[your-url]/api/health`
5. Verify login functionality with test accounts

### 3. Post-Deployment
1. Test core functionality:
   - User authentication
   - Dashboard data loading
   - Database operations
2. Monitor application logs for any issues
3. Verify all API endpoints are working

## Environment Variables Required

### Required for Deployment
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production" (automatic)

### Optional (if using AI features)
- `OPENAI_API_KEY`: For AI assistant functionality

## Support

If deployment fails with platform issues:
1. Contact Replit support team
2. Provide deployment logs and error messages
3. Reference this deployment configuration

## Test Accounts for Verification
After deployment, test with these accounts:
- `admin/admin123` (System Administrator)
- `demo/demo123` (Demo User)
- `test/test123` (Test User)

---
*Last updated: January 2025*
*Project: MPBF Next - Arabic ERP System*