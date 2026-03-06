from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta, datetime
from api.models import Transaction, Product, Customer
from django.db.models.functions import TruncDate, TruncHour, TruncMonth
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class AnalyticsViewSet(viewsets.ViewSet):
    """Analytics and insights viewset"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard statistics"""
        today = timezone.now().date()
        start_of_day = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        end_of_day = timezone.make_aware(datetime.combine(today, datetime.max.time()))
        
        # Today's stats
        today_transactions = Transaction.objects.filter(
            created_at__range=[start_of_day, end_of_day],
            status='completed'
        )
        
        today_sales = today_transactions.aggregate(
            total=Sum('total'),
            count=Count('id'),
            avg=Avg('total')
        )
        
        # Weekly stats
        week_ago = timezone.now() - timedelta(days=7)
        weekly_transactions = Transaction.objects.filter(
            created_at__gte=week_ago,
            status='completed'
        )
        
        weekly_sales = weekly_transactions.aggregate(
            total=Sum('total'),
            count=Count('id')
        )
        
        # Top products
        top_products = Product.objects.annotate(
            sold_count=Sum('transactionitem__quantity')
        ).filter(
            sold_count__isnull=False
        ).order_by('-sold_count')[:10]
        
        top_products_data = [{
            'id': p.id,
            'name': p.name,
            'sold': p.sold_count,
            'revenue': p.transactionitem_set.aggregate(
                total=Sum('subtotal')
            )['total'] or 0
        } for p in top_products]
        
        # Customer stats
        total_customers = Customer.objects.count()
        new_customers_week = Customer.objects.filter(
            created_at__gte=week_ago
        ).count()
        
        return Response({
            'today': {
                'sales': float(today_sales['total'] or 0),
                'transactions': today_sales['count'] or 0,
                'average': float(today_sales['avg'] or 0)
            },
            'weekly': {
                'sales': float(weekly_sales['total'] or 0),
                'transactions': weekly_sales['count'] or 0,
                'growth': ((weekly_sales['total'] or 0) / (today_sales['total'] or 1)) * 100
            },
            'top_products': top_products_data,
            'customers': {
                'total': total_customers,
                'new_this_week': new_customers_week
            }
        })
    
    @action(detail=False, methods=['get'])
    def sales_trend(self, request):
        """Get sales trend for last 30 days"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        daily_sales = Transaction.objects.filter(
            created_at__range=[start_date, end_date],
            status='completed'
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total=Sum('total'),
            count=Count('id')
        ).order_by('date')
        
        data = [{
            'date': item['date'].strftime('%Y-%m-%d'),
            'sales': float(item['total'] or 0),
            'transactions': item['count']
        } for item in daily_sales]
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def hourly_sales(self, request):
        """Get hourly sales distribution"""
        yesterday = timezone.now() - timedelta(days=1)
        
        hourly = Transaction.objects.filter(
            created_at__gte=yesterday,
            status='completed'
        ).annotate(
            hour=TruncHour('created_at')
        ).values('hour').annotate(
            total=Sum('total'),
            count=Count('id')
        ).order_by('hour')
        
        data = [{
            'hour': item['hour'].strftime('%H:00'),
            'sales': float(item['total'] or 0),
            'transactions': item['count']
        } for item in hourly]
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def category_performance(self, request):
        """Get sales by category"""
        from api.models import Category
        
        categories = Category.objects.filter(is_active=True)
        data = []
        
        for category in categories:
            sales = Transaction.objects.filter(
                items__product__category=category,
                status='completed'
            ).aggregate(
                total=Sum('items__subtotal'),
                count=Count('id', distinct=True)
            )
            
            if sales['total']:
                data.append({
                    'category': category.name,
                    'sales': float(sales['total']),
                    'transactions': sales['count']
                })
        
        return Response(sorted(data, key=lambda x: x['sales'], reverse=True))
    
    @action(detail=False, methods=['get'])
    def inventory_health(self, request):
        """Get inventory health metrics"""
        total_products = Product.objects.filter(is_active=True).count()
        low_stock = Product.objects.filter(
            stock_quantity__lte=models.F('min_stock_level'),
            is_active=True
        ).count()
        out_of_stock = Product.objects.filter(
            stock_quantity=0,
            is_active=True
        ).count()
        
        # Calculate inventory value
        inventory_value = Product.objects.filter(
            is_active=True
        ).aggregate(
            total=Sum(models.F('stock_quantity') * models.F('cost_price'))
        )['total'] or 0
        
        return Response({
            'total_products': total_products,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'inventory_value': float(inventory_value),
            'health_score': ((total_products - low_stock - out_of_stock) / total_products * 100) if total_products > 0 else 0
        })