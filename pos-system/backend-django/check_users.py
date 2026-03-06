"""
Test login endpoint directly.
"""
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_system.settings')
django.setup()

from django.test import RequestFactory
from api.models import User

# List existing users
print("Existing users in DB:")
users = User.objects.all()
for u in users:
    print(f"  id={u.id} email={u.email} username={u.username} role={u.role} active={u.is_active}")

if not users.exists():
    print("  NO USERS FOUND - need to create one")
