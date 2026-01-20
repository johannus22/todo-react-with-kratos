# Ory Kratos Docker Setup

This guide explains how to run Ory Kratos with Docker for the React Todo App.

## Prerequisites

- Docker and Docker Compose installed
- Ports 4433, 4434, and 5432 available

## Quick Start

1. **Start Ory Kratos with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Check if services are running:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f kratos
   ```

4. **Create `.env` file in the project root:**
   ```bash
   cp .env.example .env
   ```

   Make sure `.env` contains:
   ```
   VITE_ORY_URL=http://localhost:4433
   ```

5. **Start your React app:**
   ```bash
   npm run dev
   ```

## Services

- **Kratos Public API**: `http://localhost:4433` - Used by your React app
- **Kratos Admin API**: `http://localhost:4434` - For admin operations
- **PostgreSQL**: `localhost:5432` - Database for Kratos

## Configuration

### CORS Settings

The `kratos.yml` file is configured to allow requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Alternative React dev server)

If you're using a different port, update the `allowed_origins` in `kratos/kratos.yml`.

### UI URLs

The configuration points to your React app routes:
- Login: `http://localhost:5173/login`
- Register: `http://localhost:5173/register`
- Settings: `http://localhost:5173/settings`
- Recovery: `http://localhost:5173/recovery`
- Verification: `http://localhost:5173/verification`

### Return URLs

After successful login/registration, users are redirected to:
- `http://localhost:5173/todos`

Update these in `kratos/kratos.yml` if your app uses different routes.

## Testing

1. **Check Kratos health:**
   ```bash
   curl http://localhost:4433/health/ready
   ```

2. **Test whoami endpoint:**
   ```bash
   curl -H "Accept: application/json" http://localhost:4433/sessions/whoami
   ```

3. **Access your React app:**
   - Open `http://localhost:5173`
   - Try registering a new user
   - Try logging in

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser:
1. Check that your React app origin is in `kratos/kratos.yml` `allowed_origins`
2. Ensure `allow_credentials: true` is set
3. Restart Kratos: `docker-compose restart kratos`

### Database Connection Issues

If migrations fail:
1. Check database is running: `docker-compose ps kratos-db`
2. Check database logs: `docker-compose logs kratos-db`
3. Restart services: `docker-compose down && docker-compose up -d`

### Session Not Persisting

If sessions aren't working:
1. Check browser console for cookie issues
2. Verify `credentials: 'include'` is used in fetch calls
3. Check Kratos logs: `docker-compose logs kratos`

### Port Conflicts

If ports are already in use:
1. Edit `docker-compose.yml` to use different ports
2. Update `VITE_ORY_URL` in `.env` accordingly
3. Update `kratos.yml` port configuration

## Stopping Services

```bash
docker-compose down
```

To remove volumes (deletes database data):
```bash
docker-compose down -v
```

## Production Considerations

⚠️ **This setup is for development only!**

For production:
1. Change all secrets in `kratos/kratos.yml`
2. Use proper TLS certificates
3. Configure proper email SMTP settings
4. Use environment variables for sensitive data
5. Set up proper backup strategy for database
6. Configure proper CORS origins (not wildcards)
7. Use secure cookie settings

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# Restart Kratos
docker-compose restart kratos

# Rebuild and restart
docker-compose up -d --build

# Access Kratos container shell
docker-compose exec kratos sh

# Check database
docker-compose exec kratos-db psql -U kratos -d kratos
```
