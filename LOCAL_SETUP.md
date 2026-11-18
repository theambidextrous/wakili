# Local Development Setup with Docker

This guide helps you set up the Wakili project locally using Docker for PostgreSQL and MailHog.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- Python 3.9+
- Virtual environment activated

## Quick Start

### 1. Start Docker Services

```bash
# From the project root directory
docker-compose up -d

# Verify services are running
docker-compose ps
```

This will start:
- **PostgreSQL** on `localhost:5433` (host) -> container `5432`
 - Note: host port was changed to 5433 in docker-compose to avoid conflicts
- **MailHog** SMTP on `localhost:1025`
- **MailHog Web UI** on `http://localhost:8025`

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env.local

# Update .env.local with your settings (most defaults should work for local dev)
```

### 3. Install Python Dependencies

```bash
cd core
pip install -r requirements.txt
pip install -r api/requirements.txt
pip install alembic
```

### 4. Run Database Migrations

Choose one approach:

**Option A: Using Makefile (Recommended)**
```bash
# From project root
make migrate
```

**Option B: Using Python CLI**
```bash
python cli.py migrate
```

**Option C: Direct Alembic**
```bash
alembic -c alembic.ini upgrade head
```

### 5. Run the Application

Choose one approach:

**Option A: Using Makefile (Runs migrations + app)**
```bash
# From project root
make dev
```

**Option B: Using Python CLI**
```bash
python cli.py dev
```

**Option C: Direct run (assuming migrations are done)**
```bash
cd core
python main.py
```

The API will be available at `http://localhost:8000`

## Testing Email Locally

### View Sent Emails

Open your browser and go to: **http://localhost:8025**

You'll see:
- All emails sent during development
- Email content (HTML and plain text)
- Headers and metadata
- Option to release emails to real SMTP

### Mailbox Features

- **Search emails** by subject, sender, recipient
- **View email** in multiple formats (HTML, raw, source)
- **Release to real SMTP** for actual sending
- **Delete emails** to clean up test data

### Example: Test Email Verification

1. Register a new account:
```bash
curl -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

2. Check MailHog at `http://localhost:8025` to see the verification email

3. Extract the 6-digit code from the email

4. Verify the email:
```bash
curl -X POST http://localhost:8000/api/v1/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f mailhog
docker-compose logs -f postgres
```

### Reset Database
```bash
# Stop services and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U wak_pg_db_user -d wak_pg_db_svc
```

### Access MailHog CLI
```bash
docker-compose exec mailhog /app/MailHog -version
```

## Environment Variables for Local Development

```env
# .env.local file

# API Configuration
JWT_SECRET_KEY=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_HOURS=24

# PostgreSQL (Docker) - matches docker-compose.yml
PG_HOST=localhost
PG_PORT=5433
PG_DB=wak_pg_db_svc
PG_USER=wak_pg_db_user
PG_PASSWORD=password

# MailHog (Docker)
SMTP_HOST=localhost
SMTP_PORT=1025
SENDER_EMAIL=noreply@wakili.local
SENDER_PASSWORD=
APP_URL=http://localhost:8000

# LanceDB
LANCE_DB_PATH=../data/lancedb
LANCE_TABLE_NAME=kenya_laws
```

## Troubleshooting

### Port Already in Use

If port 1025 or 5432 is already in use:

```bash
# Find process using port 1025
lsof -i :1025

# Or change ports in docker-compose.yml
# Change "1025:1025" to "1026:1025" for MailHog
```

### Database Connection Failed

Ensure PostgreSQL is running:
```bash
docker-compose ps postgres
```

If not running:
```bash
docker-compose up -d postgres
```

### Can't Access MailHog Web UI

Check if MailHog is running:
```bash
docker-compose logs mailhog
```

Verify port:
```bash
curl http://localhost:8025
```

### Database Already Initialized

If the database schema is out of sync:

```bash
# Clear the database volume
docker-compose down -v

# Restart services
docker-compose up -d

# The app will reinitialize tables on first run
```

## Available Commands (Makefile & CLI)

### Using Makefile (Recommended)

From the project root, run:

```bash
make help              # Show all available commands
make install           # Install all dependencies
make docker-up         # Start Docker services
make docker-down       # Stop Docker services
make migrate           # Run pending migrations
make migrate-status    # Check migration status
make migrate-reset     # Reset database (downgrade all, upgrade)
make run               # Start the API
make dev               # Run migrations + start API (all-in-one)
make clean             # Remove Python cache
make reset-db          # Full reset (docker down -v, docker up, migrate)
```

### Using Python CLI

From the project root, run:

```bash
python cli.py migrate       # Run pending migrations
python cli.py run          # Start the API
python cli.py dev          # Run migrations + start API
python cli.py reset-db     # Reset database
python cli.py status       # Check migration status
python cli.py help         # Show CLI help
```

### Quick Start One-Liner

```bash
# Setup everything and run (migrations + app)
make dev

# Or using CLI
python cli.py dev
```

## Production Considerations

### Email Configuration

For production, update your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-specific-password
APP_URL=https://your-domain.com
```

### Database

Use a managed PostgreSQL service instead of Docker:
```env
PG_HOST=your-rds-endpoint.amazonaws.com
PG_PORT=5432
PG_DB=chat_app
PG_USER=postgres_user
PG_PASSWORD=secure-password
```

## API Endpoints Reference

### Authentication
- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - Login user
- `POST /api/v1/verify-email` - Verify email with code
- `POST /api/v1/resend-verification` - Resend verification code
- `GET /api/v1/current-user` - Get current user info
- `POST /api/v1/logout` - Logout user
- `POST /api/v1/refresh` - Refresh JWT token

### Chat
- `POST /api/v1/chat` - Send chat message
- `GET /api/v1/models` - Get available models

### Subscription
- `GET /api/v1/credits` - Get user credits
- `GET /api/v1/credits/history` - Get credit history
- `POST /api/v1/credits/add` - Add credits

## Next Steps

1. Create a `.env.local` file from `.env.example`
2. Start Docker services: `docker-compose up -d`
3. Install dependencies: `pip install -r requirements.txt`
4. Run the app: `python main.py`
5. Open MailHog UI: `http://localhost:8025`
6. Test the API endpoints!
