.PHONY: help install dev migrate run logs docker-up docker-down docker-logs clean reset-db

# Variables
PYTHON := python
PROJECT_ROOT := $(shell cd .. && pwd)
CORE_DIR := $(shell pwd)
ALEMBIC := alembic -c ./alembic.ini

help:
	@echo "Wakili Development Commands"
	@echo "=============================="
	@echo ""
	@echo "Setup:"
	@echo "  make install        Install dependencies (Python + Alembic)"
	@echo "  make docker-up      Start Docker services (PostgreSQL, MailHog)"
	@echo "  make docker-down    Stop Docker services"
	@echo ""
	@echo "Migrations:"
	@echo "  make migrate        Run pending migrations (Alembic)"
	@echo "  make migrate-reset  Reset database (downgrade all, then upgrade head)"
	@echo "  make migrate-status Show current migration status"
	@echo ""
	@echo "Running:"
	@echo "  make run            Run the FastAPI app (main.py)"
	@echo "  make dev            Run migrations then start the app"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          Remove Python cache files (__pycache__, .pyc)"
	@echo "  make reset-db       Stop docker, remove volumes, restart (fresh DB)"
	@echo "  make docker-logs    View Docker logs"
	@echo "  make help           Show this help message"
	@echo ""

install:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt
	pip install -r api/requirements.txt
	@echo "Updating requirements.txt to include alembic..."
	@if ! grep -q "^alembic" requirements.txt; then echo "alembic" >> requirements.txt; fi
	pip install alembic
	@echo "✓ Dependencies installed"

docker-up:
	@echo "Starting Docker services..."
	cd $(PROJECT_ROOT) && docker-compose up -d
	@sleep 2
	@echo "✓ Docker services started"
	@echo "  PostgreSQL: localhost:5433"
	@echo "  MailHog SMTP: localhost:1025"
	@echo "  MailHog Web: http://localhost:8025"

docker-down:
	@echo "Stopping Docker services..."
	cd $(PROJECT_ROOT) && docker-compose down
	@echo "✓ Docker services stopped"

docker-logs:
	cd $(PROJECT_ROOT) && docker-compose logs -f

migrate:
	@echo "Running Alembic migrations..."
	@if [ -f $(PROJECT_ROOT)/.env ]; then set -a && source $(PROJECT_ROOT)/.env && set +a; fi && $(ALEMBIC) upgrade head
	@echo "✓ Migrations complete"

migrate-status:
	@echo "Migration status:"
	@if [ -f $(PROJECT_ROOT)/.env ]; then set -a && source $(PROJECT_ROOT)/.env && set +a; fi && $(ALEMBIC) current

migrate-reset:
	@echo "Resetting database (downgrade all, then upgrade)..."
	@if [ -f $(PROJECT_ROOT)/.env ]; then set -a && source $(PROJECT_ROOT)/.env && set +a; fi && $(ALEMBIC) downgrade base || true
	@if [ -f $(PROJECT_ROOT)/.env ]; then set -a && source $(PROJECT_ROOT)/.env && set +a; fi && $(ALEMBIC) upgrade head
	@echo "✓ Database reset"

run:
	@echo "Starting Wakili API (http://localhost:8000)..."
	$(PYTHON) main.py

dev:
	@if [ -f $(PROJECT_ROOT)/.env ]; then set -a && source $(PROJECT_ROOT)/.env && set +a; fi && make migrate && make run

clean:
	@echo "Cleaning Python cache files..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ Cleaned"

reset-db:
	@echo "Resetting database (removing volumes)..."
	cd $(PROJECT_ROOT) && docker-compose down -v
	@sleep 2
	@echo "Starting fresh Docker services..."
	cd $(PROJECT_ROOT) && docker-compose up -d
	@sleep 3
	@echo "Running migrations..."
	@if [ -f $(PROJECT_ROOT)/.env ]; then set -a && source $(PROJECT_ROOT)/.env && set +a; fi && $(ALEMBIC) upgrade head
	@echo "✓ Fresh database ready"

.DEFAULT_GOAL := help
