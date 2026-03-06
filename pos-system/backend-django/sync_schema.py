import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_system.settings')
django.setup()
from django.db import connection
from django.apps import apps

api_app = apps.get_app_config('api')
with connection.cursor() as cursor:
    for model_name, model in api_app.models.items():
        if model._meta.abstract: continue
        table_name = model._meta.db_table
        try:
            cursor.execute(f'DESCRIBE {table_name}')
            existing_cols = [row[0] for row in cursor.fetchall()]
            print(f"Checking table: {table_name}")
            
            for field in model._meta.fields:
                if field.column not in existing_cols:
                    print(f"  Missing field: {field.column}")
                    col_type = "VARCHAR(255) NULL"
                    type_str = str(type(field)).lower()
                    if "int" in type_str: col_type = "INT NOT NULL DEFAULT 0"
                    if "bool" in type_str: col_type = "TINYINT(1) NOT NULL DEFAULT 0"
                    if "datetime" in type_str: col_type = "DATETIME(6) NULL"
                    if "decimal" in type_str: col_type = "DECIMAL(10,2) NOT NULL DEFAULT 0.0"
                    if "date" in type_str and "datetime" not in type_str: col_type = "DATE NULL"
                    if "text" in type_str: col_type = "LONGTEXT NULL"
                    if "foreign" in type_str: col_type = "BIGINT NULL"
                    
                    try:
                        cursor.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `{field.column}` {col_type}")
                        print(f"  SUCCESS: Added `{field.column}`")
                    except Exception as e:
                        print(f"  FAILED to add `{field.column}`: {e}")
        except Exception as e:
            print(f"Error describing table {table_name}: {e}")
