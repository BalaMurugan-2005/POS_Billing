"""
Check the actual columns in the users table vs what Django expects.
If columns are missing, add them.
"""
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_system.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Get all columns in users table
    cursor.execute("DESCRIBE users")
    columns = cursor.fetchall()
    column_names = [col[0] for col in columns]
    print("Existing columns in 'users' table:")
    for col in columns:
        print(f"  {col[0]} - {col[1]}")
    
    # Columns required by AbstractUser that may be missing
    required_columns = {
        'is_superuser': 'TINYINT(1) NOT NULL DEFAULT 0',
        'is_staff': 'TINYINT(1) NOT NULL DEFAULT 0',
        'last_login': 'DATETIME(6) NULL',
        'date_joined': 'DATETIME(6) NOT NULL DEFAULT NOW()',
        'first_name': 'VARCHAR(150) NOT NULL DEFAULT ""',
        'last_name': 'VARCHAR(150) NOT NULL DEFAULT ""',
        'groups': None,  # M2M - skip
        'user_permissions': None,  # M2M - skip
    }
    
    print("\nMissing columns to add:")
    for col_name, col_def in required_columns.items():
        if col_name not in column_names and col_def is not None:
            print(f"  ADDING: {col_name}")
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                print(f"  SUCCESS: Added {col_name}")
            except Exception as e:
                print(f"  ERROR adding {col_name}: {e}")
        elif col_name not in column_names and col_def is None:
            print(f"  SKIPPING M2M: {col_name} (handled separately)")
        else:
            print(f"  EXISTS: {col_name}")

print("\nDone.")
