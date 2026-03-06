import django_filters
from .models import Product, Transaction, Customer, Inventory

class ProductFilter(django_filters.FilterSet):
    """Filter for Product model"""
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    min_stock = django_filters.NumberFilter(field_name="stock_quantity", lookup_expr='gte')
    max_stock = django_filters.NumberFilter(field_name="stock_quantity", lookup_expr='lte')
    category_name = django_filters.CharFilter(field_name="category__name", lookup_expr='icontains')
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr='lte')
    is_low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    is_out_of_stock = django_filters.BooleanFilter(method='filter_out_of_stock')

    class Meta:
        model = Product
        fields = ['category', 'is_weighted', 'brand', 'is_active', 'barcode']

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__lte=models.F('min_stock_level'))
        return queryset

    def filter_out_of_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity=0)
        return queryset

class TransactionFilter(django_filters.FilterSet):
    """Filter for Transaction model"""
    min_amount = django_filters.NumberFilter(field_name="total", lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name="total", lookup_expr='lte')
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr='date__lte')
    cashier_name = django_filters.CharFilter(field_name="cashier__username", lookup_expr='icontains')
    customer_name = django_filters.CharFilter(field_name="customer__user__username", lookup_expr='icontains')

    class Meta:
        model = Transaction
        fields = ['status', 'payment_method', 'cashier', 'customer']

class CustomerFilter(django_filters.FilterSet):
    """Filter for Customer model"""
    min_points = django_filters.NumberFilter(field_name="loyalty_points", lookup_expr='gte')
    max_points = django_filters.NumberFilter(field_name="loyalty_points", lookup_expr='lte')
    min_purchases = django_filters.NumberFilter(field_name="total_purchases", lookup_expr='gte')
    max_purchases = django_filters.NumberFilter(field_name="total_purchases", lookup_expr='lte')
    joined_after = django_filters.DateFilter(field_name="created_at", lookup_expr='date__gte')
    joined_before = django_filters.DateFilter(field_name="created_at", lookup_expr='date__lte')
    name = django_filters.CharFilter(method='filter_by_name')

    class Meta:
        model = Customer
        fields = ['tier', 'newsletter_subscription']

    def filter_by_name(self, queryset, name, value):
        return queryset.filter(
            models.Q(user__first_name__icontains=value) |
            models.Q(user__last_name__icontains=value)
        )

class InventoryFilter(django_filters.FilterSet):
    """Filter for Inventory model"""
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr='date__lte')
    product_name = django_filters.CharFilter(field_name="product__name", lookup_expr='icontains')
    min_quantity = django_filters.NumberFilter(field_name="quantity_change", lookup_expr='gte')
    max_quantity = django_filters.NumberFilter(field_name="quantity_change", lookup_expr='lte')

    class Meta:
        model = Inventory
        fields = ['movement_type', 'product', 'performed_by']