import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_system.settings')
django.setup()
from django.db import connection

sql_statements = [
    """CREATE TABLE IF NOT EXISTS `users_groups` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `user_id` bigint(20) NOT NULL,
        `group_id` int(11) NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `users_groups_user_id_group_id_unique` (`user_id`,`group_id`),
        CONSTRAINT `users_groups_group_id_fk_auth_group` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
        CONSTRAINT `users_groups_user_id_fk_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""",
    """CREATE TABLE IF NOT EXISTS `users_user_permissions` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `user_id` bigint(20) NOT NULL,
        `permission_id` int(11) NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `users_user_permissions_user_id_permission_id_unique` (`user_id`,`permission_id`),
        CONSTRAINT `users_user_permissions_permission_id_fk_auth_permission` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
        CONSTRAINT `users_user_permissions_user_id_fk_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"""
]

with connection.cursor() as cursor:
    for sql in sql_statements:
        try:
            cursor.execute(sql)
            print("SUCCESS: Created/Verified M2M table")
        except Exception as e:
            print(f"ERROR: {e}")
