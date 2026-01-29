#!/usr/bin/env python
"""
Wakili CLI helper for common development tasks.

Usage:
  python cli.py migrate       - Run pending Alembic migrations
  python cli.py run          - Start the FastAPI app
  python cli.py dev          - Run migrations then start the app
  python cli.py reset-db     - Reset database (clear and reinitialize)
"""
import subprocess
import sys
import os
from pathlib import Path

# Load environment from .env.local
from dotenv import load_dotenv
load_dotenv('.env.local')

PROJECT_ROOT = Path(__file__).resolve().parent
CORE_DIR = PROJECT_ROOT / 'core'
ALEMBIC_CONFIG = PROJECT_ROOT / 'alembic.ini'


def run_command(cmd, cwd=None, check=True):
    """Run a shell command and return success status."""
    print(f"▶ {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, cwd=cwd, check=check)
        return result.returncode == 0
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def migrate():
    """Run Alembic migrations."""
    print("\n📦 Running Alembic migrations...\n")
    success = run_command([
        sys.executable, '-m', 'alembic', '-c', str(ALEMBIC_CONFIG), 'upgrade', 'head'
    ])
    if success:
        print("✓ Migrations complete\n")
    else:
        print("✗ Migrations failed\n")
        return False
    return True


def run_app():
    """Start the FastAPI app."""
    print("\n🚀 Starting Wakili API (http://localhost:8000)\n")
    success = run_command([sys.executable, 'main.py'], cwd=CORE_DIR, check=False)
    return success


def dev():
    """Run migrations then start the app."""
    if not migrate():
        return False
    return run_app()


def reset_db():
    """Reset database (docker down -v, then docker up, then migrate)."""
    print("\n🔄 Resetting database...\n")
    
    print("Stopping Docker...")
    run_command(['docker-compose', 'down', '-v'], cwd=PROJECT_ROOT, check=False)
    
    import time
    time.sleep(2)
    
    print("Starting fresh Docker services...")
    if not run_command(['docker-compose', 'up', '-d'], cwd=PROJECT_ROOT):
        return False
    
    time.sleep(3)
    
    print("Running migrations...")
    return migrate()


def status():
    """Show current migration status."""
    print("\n📍 Migration status:\n")
    run_command([
        sys.executable, '-m', 'alembic', '-c', str(ALEMBIC_CONFIG), 'current'
    ])


def help_text():
    """Print help message."""
    print("""
Wakili CLI - Development Commands
==================================

Usage: python cli.py <command>

Commands:
  migrate       - Run pending Alembic migrations
  run          - Start the FastAPI app
  dev          - Run migrations then start the app
  reset-db     - Reset database (docker down -v, docker up, migrate)
  status       - Show current migration status
  help         - Show this help message

Environment:
  .env.local must be present in project root
  (copy from .env.example if needed)

Examples:
  python cli.py dev          # Set up DB and run app
  python cli.py migrate      # Apply pending migrations
  python cli.py reset-db     # Fresh database
    """)


def main():
    if len(sys.argv) < 2:
        help_text()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'migrate':
        success = migrate()
    elif command == 'run':
        success = run_app()
    elif command == 'dev':
        success = dev()
    elif command == 'reset-db':
        success = reset_db()
    elif command == 'status':
        status()
        success = True
    elif command == 'help' or command == '-h' or command == '--help':
        help_text()
        success = True
    else:
        print(f"Unknown command: {command}\n")
        help_text()
        sys.exit(1)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
