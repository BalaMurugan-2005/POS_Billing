"""
Script to fix the InconsistentMigrationHistory issue by inserting
the api.0001_initial record into django_migrations table.
"""
import django
import os
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_system.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Check what api migrations are already recorded
    cursor.execute("SELECT app, name FROM django_migrations WHERE app='api'")
    api_rows = cursor.fetchall()
    print('Existing api migrations in DB:', api_rows)

    # Check the last 10 migrations recorded
    cursor.execute("SELECT app, name FROM django_migrations ORDER BY id DESC LIMIT 10")
    recent = cursor.fetchall()
    print('Recent 10 migrations:', recent)

    # Insert the api.0001_initial record if missing
    if not api_rows:
        cursor.execute(
            "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s)",
            ['api', '0001_initial', datetime.now()]
        )
        print('SUCCESS: Inserted api.0001_initial into django_migrations')
    else:
        print('api.0001_initial already in DB - no action needed')

print('Done.')
