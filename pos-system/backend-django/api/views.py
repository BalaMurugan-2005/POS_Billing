from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.utils import timezone
from .models import *
from .serializers import *
import logging

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    """User registration view"""
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(APIView):
    """User login view"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

class LogoutView(APIView):
    """User logout view"""
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

import jwt
from django.conf import settings

class VerifyTokenView(APIView):
    """Verify JWT token and roles for Spring Boot integration"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'valid': False, 'error': 'Token not provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Spring Boot jwt secret from application.properties
        secret = 'mySecretKeyForJWTTokenGenerationAndValidation2024POSSystem'

        try:
            # Verify validity and expiry
            decoded = jwt.decode(token, secret, algorithms=['HS256'])
            
            # Verify role permissions
            roles = decoded.get('role', [])
            role_names = [r.get('authority', '') if isinstance(r, dict) else r for r in roles]
            
            # Check user role exists
            username = decoded.get('sub')
            try:
                user_obj = User.objects.get(username=username)
                user_role = user_obj.role
            except User.DoesNotExist:
                user_role = None

            return Response({
                'valid': True,
                'username': username,
                'roles': role_names,
                'user_role': user_role
            })
        except jwt.ExpiredSignatureError:
            return Response({'valid': False, 'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError as e:
            return Response({'valid': False, 'error': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

# Product Views
class ProductListView(generics.ListCreateAPIView):
    """List and create products"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_weighted', 'brand']
    search_fields = ['name', 'barcode', 'description']
    ordering_fields = ['name', 'price', 'stock_quantity', 'created_at']
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, delete product"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

class ProductByBarcodeView(generics.RetrieveAPIView):
    """Get product by barcode"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'barcode'

class LowStockProductsView(generics.ListAPIView):
    """Get low stock products"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get_queryset(self):
        return Product.objects.filter(
            stock_quantity__lte=models.F('min_stock_level'),
            is_active=True
        )

# Category Views
class CategoryListView(generics.ListCreateAPIView):
    """List and create categories"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

# Transaction Views
class TransactionListView(generics.ListCreateAPIView):
    """List and create transactions"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'cashier', 'customer']
    ordering_fields = ['created_at', 'total']
    
    def perform_create(self, serializer):
        serializer.save(cashier=self.request.user)

class TransactionDetailView(generics.RetrieveAPIView):
    """Retrieve transaction"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

class VoidTransactionView(APIView):
    """Void a transaction"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def post(self, request, pk):
        try:
            transaction = Transaction.objects.get(pk=pk)
            if transaction.status != 'completed':
                return Response(
                    {'error': 'Only completed transactions can be voided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            transaction.status = 'void'
            transaction.save()
            
            # Restore inventory
            for item in transaction.items.all():
                Inventory.objects.create(
                    product=item.product,
                    quantity_change=item.quantity,
                    movement_type='return',
                    reason=f"Void transaction: {transaction.transaction_number}",
                    previous_quantity=item.product.stock_quantity,
                    performed_by=request.user,
                    reference_number=transaction.transaction_number
                )
            
            return Response({'message': 'Transaction voided successfully'})
            
        except Transaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )

# Inventory Views
class InventoryListView(generics.ListCreateAPIView):
    """List and create inventory movements"""
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movement_type', 'product']
    ordering_fields = ['created_at']
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)

# Customer Views
class CustomerListView(generics.ListCreateAPIView):
    """List and create customers"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'loyalty_number']
    ordering_fields = ['created_at', 'loyalty_points', 'total_purchases']
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class CustomerDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve, update customer"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class CustomerByLoyaltyView(generics.RetrieveAPIView):
    """Get customer by loyalty number"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'loyalty_number'

class CustomerByUserIdView(generics.RetrieveAPIView):
    """Get customer by user ID"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'user_id'
    lookup_url_kwarg = 'user_id'
    
    def get_queryset(self):
        return Customer.objects.filter(user_id=self.kwargs.get('user_id'))

class AddLoyaltyPointsView(APIView):
    """Add loyalty points to customer"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def post(self, request, pk):
        try:
            customer = Customer.objects.get(pk=pk)
            points = request.data.get('points', 0)
            
            customer.loyalty_points += points
            customer.save()
            
            return Response({
                'message': f'Added {points} points successfully',
                'total_points': customer.loyalty_points
            })
            
        except Customer.DoesNotExist:
            return Response(
                {'error': 'Customer not found'},
                status=status.HTTP_404_NOT_FOUND
            )