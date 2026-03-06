from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from api.models import Transaction, Product, Customer
import numpy as np
from sklearn.linear_model import LinearRegression
import logging

logger = logging.getLogger(__name__)

class SalesInsightsViewSet(viewsets.ViewSet):
    """Sales insights and predictions viewset"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get sales trends and patterns"""
        period = request.query_params.get('period', '30d')
        
        if period == '7d':
            days = 7
        elif period == '30d':
            days = 30
        elif period == '90d':
            days = 90
        else:
            days = 30
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get daily sales
        from django.db.models.functions import TruncDate
        daily_sales = Transaction.objects.filter(
            created_at__range=[start_date, end_date],
            status='completed'
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total=Sum('total'),
            count=Count('id')
        ).order_by('date')
        
        dates = [item['date'] for item in daily_sales]
        sales = [float(item['total'] or 0) for item in daily_sales]
        
        # Calculate trends
        if len(sales) > 1:
            # Linear regression for trend
            X = np.arange(len(sales)).reshape(-1, 1)
            y = np.array(sales).reshape(-1, 1)
            
            model = LinearRegression()
            model.fit(X, y)
            
            trend_direction = 'up' if model.coef_[0][0] > 0 else 'down'
            trend_strength = abs(model.coef_[0][0])
            
            # Predict next 7 days
            future_X = np.arange(len(sales), len(sales) + 7).reshape(-1, 1)
            predictions = model.predict(future_X).flatten()
        else:
            trend_direction = 'stable'
            trend_strength = 0
            predictions = []
        
        # Day of week analysis
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_analysis = []
        
        for i, day in enumerate(day_names):
            day_sales = [sales[j] for j, date in enumerate(dates) if date.weekday() == i]
            if day_sales:
                day_analysis.append({
                    'day': day,
                    'avg_sales': np.mean(day_sales),
                    'total_sales': sum(day_sales),
                    'transactions': len(day_sales)
                })
        
        return Response({
            'period': f'{days} days',
            'summary': {
                'total_sales': sum(sales),
                'avg_daily': np.mean(sales) if sales else 0,
                'trend_direction': trend_direction,
                'trend_strength': float(trend_strength),
                'best_day': max(day_analysis, key=lambda x: x['avg_sales'])['day'] if day_analysis else None,
                'worst_day': min(day_analysis, key=lambda x: x['avg_sales'])['day'] if day_analysis else None
            },
            'predictions': [float(p) for p in predictions],
            'day_analysis': day_analysis
        })
    
    @action(detail=False, methods=['get'])
    def customer_segments(self, request):
        """Analyze customer segments"""
        customers = Customer.objects.all().select_related('user')
        
        segments = {
            'new': {'count': 0, 'avg_purchase': 0, 'total_spent': 0},
            'regular': {'count': 0, 'avg_purchase': 0, 'total_spent': 0},
            'vip': {'count': 0, 'avg_purchase': 0, 'total_spent': 0}
        }
        
        for customer in customers:
            transactions = Transaction.objects.filter(
                customer=customer,
                status='completed'
            )
            
            total_spent = transactions.aggregate(total=Sum('total'))['total'] or 0
            transaction_count = transactions.count()
            
            # Segment based on loyalty points and purchase frequency
            if customer.loyalty_points >= 1000 or transaction_count >= 20:
                segment = 'vip'
            elif transaction_count >= 5:
                segment = 'regular'
            else:
                segment = 'new'
            
            segments[segment]['count'] += 1
            segments[segment]['total_spent'] += float(total_spent)
            
            if transaction_count > 0:
                if segments[segment]['avg_purchase'] == 0:
                    segments[segment]['avg_purchase'] = float(total_spent / transaction_count)
                else:
                    segments[segment]['avg_purchase'] = (
                        segments[segment]['avg_purchase'] + float(total_spent / transaction_count)
                    ) / 2
        
        # Calculate percentages
        total_customers = len(customers)
        for segment in segments:
            segments[segment]['percentage'] = (segments[segment]['count'] / total_customers * 100) if total_customers > 0 else 0
        
        return Response(segments)
    
    @action(detail=False, methods=['get'])
    def product_affinity(self, request):
        """Analyze product affinity (frequently bought together)"""
        # Get recent transactions
        recent_transactions = Transaction.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30),
            status='completed'
        ).prefetch_related('items__product')
        
        # Build co-occurrence matrix
        co_occurrence = {}
        
        for transaction in recent_transactions:
            products = list(transaction.items.values_list('product_id', flat=True))
            
            for i in range(len(products)):
                for j in range(i + 1, len(products)):
                    pair = tuple(sorted([products[i], products[j]]))
                    co_occurrence[pair] = co_occurrence.get(pair, 0) + 1
        
        # Get top pairs
        top_pairs = sorted(co_occurrence.items(), key=lambda x: x[1], reverse=True)[:10]
        
        result = []
        for (prod1_id, prod2_id), count in top_pairs:
            try:
                prod1 = Product.objects.get(id=prod1_id)
                prod2 = Product.objects.get(id=prod2_id)
                
                result.append({
                    'product1': {
                        'id': prod1.id,
                        'name': prod1.name
                    },
                    'product2': {
                        'id': prod2.id,
                        'name': prod2.name
                    },
                    'frequency': count,
                    'confidence': count / recent_transactions.count() * 100
                })
            except Product.DoesNotExist:
                continue
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def peak_hours(self, request):
        """Analyze peak business hours"""
        from django.db.models.functions import ExtractHour
        
        hour_stats = Transaction.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30),
            status='completed'
        ).annotate(
            hour=ExtractHour('created_at')
        ).values('hour').annotate(
            transactions=Count('id'),
            revenue=Sum('total')
        ).order_by('hour')
        
        hours_data = []
        for stat in hour_stats:
            hours_data.append({
                'hour': f"{stat['hour']:02d}:00",
                'transactions': stat['transactions'],
                'revenue': float(stat['revenue'] or 0)
            })
        
        # Find peak hours
        if hours_data:
            peak_transactions = max(hours_data, key=lambda x: x['transactions'])
            peak_revenue = max(hours_data, key=lambda x: x['revenue'])
        else:
            peak_transactions = peak_revenue = None
        
        return Response({
            'hourly_breakdown': hours_data,
            'peak_transactions': peak_transactions,
            'peak_revenue': peak_revenue
        })