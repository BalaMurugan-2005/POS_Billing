from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    path('auth/verify/', views.VerifyTokenView.as_view(), name='token_verify'),
    
    # Products
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/barcode/<str:barcode>/', views.ProductByBarcodeView.as_view(), name='product-barcode'),
    path('products/low-stock/', views.LowStockProductsView.as_view(), name='product-low-stock'),
    
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    
    # Transactions
    path('transactions/', views.TransactionListView.as_view(), name='transaction-list'),
    path('transactions/<int:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    path('transactions/<int:pk>/void/', views.VoidTransactionView.as_view(), name='transaction-void'),
    
    # Inventory
    path('inventory/', views.InventoryListView.as_view(), name='inventory-list'),
    
    # Customers
    path('customers/', views.CustomerListView.as_view(), name='customer-list'),
    path('customers/loyalty/<str:loyalty_number>/', views.CustomerByLoyaltyView.as_view(), name='customer-loyalty'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/<int:pk>/add-points/', views.AddLoyaltyPointsView.as_view(), name='customer-add-points'),
]