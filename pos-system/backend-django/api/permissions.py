from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsCashierUser(permissions.BasePermission):
    """Custom permission to only allow cashier users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'cashier'

class IsCustomerUser(permissions.BasePermission):
    """Custom permission to only allow customer users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'customer'

class IsAdminOrCashier(permissions.BasePermission):
    """Custom permission to allow admin or cashier users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.role in ['admin', 'cashier']

class IsOwnerOrAdmin(permissions.BasePermission):
    """Custom permission to only allow owners of an object or admin"""
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'customer') and hasattr(obj.customer, 'user'):
            return obj.customer.user == request.user
        
        return False