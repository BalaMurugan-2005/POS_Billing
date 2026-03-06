from django.contrib import admin
from django.utils.html import format_html
from .models import *

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['email']

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['user', 'loyalty_number', 'tier', 'loyalty_points', 'total_purchases']
    list_filter = ['tier', 'newsletter_subscription']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'loyalty_number']
    readonly_fields = ['qr_code_preview']
    
    def qr_code_preview(self, obj):
        if obj.qr_code:
            return format_html('<img src="{}" width="100" height="100" />', obj.qr_code.url)
        return "No QR Code"
    qr_code_preview.short_description = 'QR Code Preview'

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'barcode', 'category', 'price', 'stock_quantity', 'is_low_stock']
    list_filter = ['category', 'is_weighted', 'is_active', 'brand']
    search_fields = ['name', 'barcode']
    readonly_fields = ['created_at', 'updated_at']
    
    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Low Stock'

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity_change', 'movement_type', 'performed_by', 'created_at']
    list_filter = ['movement_type']
    search_fields = ['product__name', 'reference_number']
    readonly_fields = ['created_at']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_number', 'cashier', 'customer', 'total', 'status', 'created_at']
    list_filter = ['status', 'payment_method']
    search_fields = ['transaction_number', 'cashier__email', 'customer__user__email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(TransactionItem)
class TransactionItemAdmin(admin.ModelAdmin):
    list_display = ['transaction', 'product', 'quantity', 'price', 'subtotal']
    list_filter = ['transaction__status']
    search_fields = ['transaction__transaction_number', 'product__name']