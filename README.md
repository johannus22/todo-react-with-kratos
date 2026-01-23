# Todo App with Ory Kratos Authentication

A modern React + TypeScript + Vite todo application with Ory Kratos authentication integration. Features user registration, login, logout, and protected routes with session management.

## Features

- ✅ User authentication (register, login, logout)
- ✅ Protected routes with session management
- ✅ Todo CRUD operations
- ✅ Modern UI with Tailwind CSS and Pixel Retro UI
- ✅ Docker-based Ory Kratos setup
- ✅ TypeScript for type safety

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm
- **Docker** and **Docker Compose**
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd todo-app
```

### 2. Set Up Ory Kratos with Docker

**Option A: Using the setup script (recommended)**

On Windows (PowerShell):
```powershell
.\setup-ory.ps1
```

On Linux/Mac:
```bash
chmod +x setup-ory.sh
./setup-ory.sh
```

**Option B: Manual setup**

1. Create a `.env` file in the project root:
   ```bash
   echo "VITE_ORY_URL=http://localhost:4433" > .env
   ```

2. Start Ory services (Kratos and Keto):
   ```bash
   docker-compose up -d
   ```

3. Wait for services to be ready (about 15–20 seconds), then verify:
   ```bash
   curl http://localhost:4433/health/ready
   ```

   You should see: `{"status":"ok"}`

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Test the Application

1. Open `http://localhost:5173` in your browser
2. Click "Register" to create a new account
3. After registration, you'll be redirected to the dashboard
4. Try logging out and logging back in
5. Create and manage your todos

## Docker Services

The `docker-compose.yml` file sets up the following services:

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **kratos** | 4433 | Ory Kratos Public API (used by React app) |
| **kratos** | 4434 | Ory Kratos Admin API (for admin operations) |
| **kratos-db** | 5432 | PostgreSQL database for Kratos |
| **kratos-migrate** | - | Runs database migrations on startup |
| **keto** | 4466 | Ory Keto Read API (permission checks, expand) |
| **keto** | 4467 | Ory Keto Write API (create/delete relation tuples) |
| **keto-db** | 5433 | PostgreSQL database for Keto |
| **keto-migrate** | - | Runs Keto migrations on startup |

### Service Details

- **kratos-db**: PostgreSQL 15 database that stores user identities and sessions
- **kratos-migrate**: Automatically runs database migrations before Kratos starts
- **kratos**: Main Ory Kratos service running in development mode with hot-reload
- **keto-db**: PostgreSQL 15 database for Keto relation tuples (permissions)
- **keto-migrate**: Runs Keto schema migrations before Keto starts
- **keto**: Ory Keto authorization; Read (4466) for checks, Write (4467) for relation changes

### Backend: Ory Keto environment variables

Your backend (e.g. on port 8787) should use:

| Variable | Value | Use |
|----------|--------|-----|
| `KETO_READ_URL` | `http://localhost:4466` | Permission checks (`check`, `expand`), listing relation tuples |
| `KETO_WRITE_URL` | `http://localhost:4467` | Creating/deleting relation tuples (e.g. on todo create, share, revoke) |

- **`KETO_READ_URL`** must point to the **Read API (port 4466)**. If it is set to `http://localhost:4467`, that is the Write API; permission checks will not work correctly on that port.
- **`KETO_WRITE_URL`** is used when creating relations (e.g. grant owner on new todo) or deleting them (revoke).

### Managing Docker Services

**Start services:**
```bash
docker-compose up -d
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kratos
docker-compose logs -f kratos-db
```

**Restart services:**
```bash
docker-compose restart kratos
```

**Check service status:**
```bash
docker-compose ps
```

**Remove all data (including database):**
```bash
docker-compose down -v
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_ORY_URL=http://localhost:4433
```

### Ory Kratos Configuration

The main Kratos configuration is in `kratos/kratos.yml`. Key settings:

- **CORS**: Configured to allow requests from `http://localhost:5173`
- **UI URLs**: Points to your React app routes (login, register, etc.)
- **Database**: Uses PostgreSQL via Docker
- **Sessions**: Cookie-based sessions with secure settings

### Frontend Configuration

- **Vite**: Development server runs on port 5173
- **React Router**: Handles client-side routing
- **API Base URL**: Configured via `VITE_ORY_URL` environment variable

## Project Structure

```
todo-app/
├── src/
│   ├── components/       # React components
│   │   ├── AddTodoForm.tsx
│   │   ├── OryForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── TodoItem.tsx
│   │   └── TodoList.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useTodos.ts
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Logout.tsx
│   │   ├── MFA.tsx
│   │   ├── Register.tsx
│   │   └── Todos.tsx
│   ├── services/         # API services
│   │   ├── api.ts        # Todo API
│   │   └── ory.ts        # Ory Kratos integration
│   └── types/            # TypeScript types
│       └── todo.ts
├── kratos/               # Ory Kratos configuration
│   ├── kratos.yml
│   └── identity.schema.json
├── database/             # Database schema
│   └── schema.sql
├── docker-compose.yml    # Docker services configuration
├── setup-ory.ps1         # Windows setup script
├── setup-ory.sh          # Linux/Mac setup script
└── README.md             # This file
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Troubleshooting

### Docker Issues

**Services won't start:**
```bash
# Check if ports are available
netstat -an | grep -E "4433|4434|5432"

# Check Docker logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

**Database connection errors:**
```bash
# Check database is running
docker-compose ps kratos-db

# View database logs
docker-compose logs kratos-db

# Restart database
docker-compose restart kratos-db
```

### Frontend Issues

**CORS errors:**
- **Kratos (auth):** Ensure `VITE_ORY_URL=http://localhost:4433` is in your `.env`; check `kratos/kratos.yml` has your frontend URL in `allowed_origins`; restart Kratos: `docker-compose restart kratos`
- **Todo API (backend on 8787):** The backend must allow your frontend origin (e.g. `http://localhost:5173` or `http://localhost:3000`) in `Access-Control-Allow-Origin` and `X-User-Id` in `Access-Control-Allow-Headers`. See **API.md → CORS Configuration**.

**Session not persisting:**
- Check browser console for cookie issues
- Verify cookies are enabled in your browser
- Ensure `credentials: 'include'` is used in fetch calls (already configured)
- Check Kratos logs: `docker-compose logs kratos`

**Login/Logout not working:**
- Verify Ory Kratos is running: `curl http://localhost:4433/health/ready`
- Check browser network tab for failed requests
- Review Kratos logs: `docker-compose logs -f kratos`

### Port Conflicts

If ports 4433, 4434, or 5432 are already in use:

1. Edit `docker-compose.yml` to use different ports
2. Update `VITE_ORY_URL` in `.env` accordingly
3. Update `kratos/kratos.yml` port configuration
4. Restart services

## Development

### Adding New Features

1. **New Protected Route**: Wrap your component with `<ProtectedRoute>`
2. **New API Endpoint**: Add to `src/services/api.ts`
3. **New Ory Flow**: Extend `src/services/ory.ts` with new flow types

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- React Router for navigation

## Production Deployment

⚠️ **This setup is for development only!**

For production deployment:

1. **Security:**
   - Change all secrets in `kratos/kratos.yml`
   - Use proper TLS certificates
   - Configure secure cookie settings
   - Use environment variables for sensitive data

2. **Email:**
   - Configure proper SMTP settings for email verification
   - Set up email templates

3. **Database:**
   - Use managed PostgreSQL service
   - Set up proper backup strategy
   - Configure connection pooling

4. **CORS:**
   - Configure specific allowed origins (not wildcards)
   - Remove development URLs

5. **Build:**
   ```bash
   npm run build
   ```
   Deploy the `dist/` folder to your hosting service

## Additional Resources

- [Ory Kratos Documentation](https://www.ory.sh/docs/kratos/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

For detailed Ory Kratos setup instructions, see [README-ORY.md](README-ORY.md)

## License

[Your License Here]
