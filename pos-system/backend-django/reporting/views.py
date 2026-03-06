from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta, datetime
from api.models import Transaction, Product, Customer
import pandas as pd
from django.http import HttpResponse
import csv
import xlsxwriter
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

class ReportViewSet(viewsets.ViewSet):
    """Reports generation viewset"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def daily_sales(self, request):
        """Generate daily sales report"""
        date_str = request.query_params.get('date')
        
        if date_str:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()
        
        start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_of_day = timezone.make_aware(datetime.combine(date, datetime.max.time()))
        
        transactions = Transaction.objects.filter(
            created_at__range=[start_of_day, end_of_day],
            status='completed'
        ).select_related('cashier', 'customer')
        
        # Summary
        summary = transactions.aggregate(
            total_sales=Sum('total'),
            total_transactions=Count('id'),
            average_transaction=Avg('total'),
            total_tax=Sum('tax'),
            total_discount=Sum('discount')
        )
        
        # Payment method breakdown
        payment_methods = transactions.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('total')
        )
        
        # Hourly breakdown
        hourly = []
        for hour in range(24):
            hour_start = start_of_day + timedelta(hours=hour)
            hour_end = hour_start + timedelta(hours=1)
            
            hour_transactions = transactions.filter(
                created_at__range=[hour_start, hour_end]
            )
            
            if hour_transactions.exists():
                hourly.append({
                    'hour': f"{hour:02d}:00",
                    'transactions': hour_transactions.count(),
                    'sales': float(hour_transactions.aggregate(total=Sum('total'))['total'] or 0)
                })
        
        # Transactions list
        transactions_list = [{
            'time': t.created_at.strftime('%H:%M:%S'),
            'number': t.transaction_number,
            'cashier': t.cashier.get_full_name() if t.cashier else 'Unknown',
            'customer': t.customer.user.get_full_name() if t.customer and t.customer.user else 'Guest',
            'items': t.items.count(),
            'total': float(t.total),
            'payment': t.payment_method
        } for t in transactions]
        
        return Response({
            'date': date.strftime('%Y-%m-%d'),
            'summary': {
                'total_sales': float(summary['total_sales'] or 0),
                'total_transactions': summary['total_transactions'] or 0,
                'average_transaction': float(summary['average_transaction'] or 0),
                'total_tax': float(summary['total_tax'] or 0),
                'total_discount': float(summary['total_discount'] or 0)
            },
            'payment_methods': list(payment_methods),
            'hourly_breakdown': hourly,
            'transactions': transactions_list
        })
    
    @action(detail=False, methods=['get'])
    def monthly_sales(self, request):
        """Generate monthly sales report"""
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        start_of_month = timezone.make_aware(start_date)
        end_of_month = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
        
        transactions = Transaction.objects.filter(
            created_at__range=[start_of_month, end_of_month],
            status='completed'
        )
        
        # Daily breakdown
        daily_sales = transactions.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total=Sum('total'),
            count=Count('id')
        ).order_by('date')
        
        # Category breakdown
        from api.models import Category
        category_sales = []
        for category in Category.objects.filter(is_active=True):
            cat_total = transactions.filter(
                items__product__category=category
            ).aggregate(
                total=Sum('items__subtotal')
            )['total'] or 0
            
            if cat_total > 0:
                category_sales.append({
                    'category': category.name,
                    'total': float(cat_total)
                })
        
        # Summary
        summary = transactions.aggregate(
            total_sales=Sum('total'),
            total_transactions=Count('id'),
            average_daily=Avg('total'),
            total_items=Sum('items__quantity')
        )
        
        # Top products
        top_products = Product.objects.filter(
            transactionitem__transaction__in=transactions
        ).annotate(
            quantity_sold=Sum('transactionitem__quantity'),
            revenue=Sum('transactionitem__subtotal')
        ).order_by('-quantity_sold')[:10]
        
        top_products_data = [{
            'name': p.name,
            'quantity': p.quantity_sold,
            'revenue': float(p.revenue or 0)
        } for p in top_products]
        
        return Response({
            'month': f"{year}-{month:02d}",
            'summary': {
                'total_sales': float(summary['total_sales'] or 0),
                'total_transactions': summary['total_transactions'] or 0,
                'average_daily': float(summary['average_daily'] or 0),
                'total_items': summary['total_items'] or 0
            },
            'daily_breakdown': [{
                'date': item['date'].strftime('%Y-%m-%d'),
                'sales': float(item['total'] or 0),
                'transactions': item['count']
            } for item in daily_sales],
            'category_breakdown': category_sales,
            'top_products': top_products_data
        })
    
    @action(detail=False, methods=['get'])
    def product_performance(self, request):
        """Generate product performance report"""
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if start_date_str and end_date_str:
            start_date = timezone.make_aware(datetime.strptime(start_date_str, '%Y-%m-%d'))
            end_date = timezone.make_aware(datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1))
        else:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
        
        products = Product.objects.filter(is_active=True).annotate(
            quantity_sold=Sum('transactionitem__quantity', filter=Q(
                transactionitem__transaction__created_at__range=[start_date, end_date],
                transactionitem__transaction__status='completed'
            )),
            revenue=Sum('transactionitem__subtotal', filter=Q(
                transactionitem__transaction__created_at__range=[start_date, end_date],
                transactionitem__transaction__status='completed'
            )),
            profit=Sum(
                (models.F('transactionitem__subtotal') - models.F('cost_price') * models.F('transactionitem__quantity')),
                filter=Q(
                    transactionitem__transaction__created_at__range=[start_date, end_date],
                    transactionitem__transaction__status='completed'
                )
            )
        ).order_by('-quantity_sold')
        
        data = []
        for product in products:
            if product.quantity_sold:
                data.append({
                    'id': product.id,
                    'name': product.name,
                    'category': product.category.name if product.category else 'Uncategorized',
                    'quantity_sold': product.quantity_sold or 0,
                    'revenue': float(product.revenue or 0),
                    'profit': float(product.profit or 0),
                    'margin': ((float(product.profit or 0) / float(product.revenue or 1)) * 100) if product.revenue else 0
                })
        
        return Response({
            'period': {
                'start': start_date.strftime('%Y-%m-%d'),
                'end': end_date.strftime('%Y-%m-%d')
            },
            'products': data
        })
    
    @action(detail=False, methods=['get'])
    def inventory_report(self, request):
        """Generate inventory report"""
        products = Product.objects.filter(is_active=True).select_related('category')
        
        data = [{
            'id': p.id,
            'name': p.name,
            'category': p.category.name if p.category else 'Uncategorized',
            'stock': p.stock_quantity,
            'min_stock': p.min_stock_level,
            'max_stock': p.max_stock_level,
            'status': 'Low' if p.is_low_stock else ('Out' if p.is_out_of_stock else 'Normal'),
            'value': float(p.stock_quantity * p.cost_price) if p.cost_price else 0,
            'price': float(p.price),
            'cost': float(p.cost_price) if p.cost_price else 0
        } for p in products]
        
        # Summary
        total_value = sum(item['value'] for item in data)
        low_stock_count = sum(1 for item in data if item['status'] == 'Low')
        out_of_stock_count = sum(1 for item in data if item['status'] == 'Out')
        
        return Response({
            'summary': {
                'total_products': len(data),
                'total_value': total_value,
                'low_stock': low_stock_count,
                'out_of_stock': out_of_stock_count
            },
            'products': data
        })
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export report as CSV"""
        report_type = request.query_params.get('type', 'daily')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        
        if report_type == 'daily':
            # Get daily sales data
            date_str = request.query_params.get('date', timezone.now().strftime('%Y-%m-%d'))
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
            end_of_day = timezone.make_aware(datetime.combine(date, datetime.max.time()))
            
            transactions = Transaction.objects.filter(
                created_at__range=[start_of_day, end_of_day],
                status='completed'
            ).select_related('cashier')
            
            # Write headers
            writer.writerow(['Transaction #', 'Time', 'Cashier', 'Items', 'Total', 'Payment Method'])
            
            # Write data
            for t in transactions:
                writer.writerow([
                    t.transaction_number,
                    t.created_at.strftime('%H:%M:%S'),
                    t.cashier.get_full_name() if t.cashier else 'Unknown',
                    t.items.count(),
                    float(t.total),
                    t.payment_method
                ])
            
            # Write summary
            writer.writerow([])
            total = transactions.aggregate(total=Sum('total'))['total'] or 0
            writer.writerow(['Total Sales', float(total)])
            writer.writerow(['Transactions', transactions.count()])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        """Export report as Excel"""
        report_type = request.query_params.get('type', 'daily')
        
        # Create Excel file in memory
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Report')
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#3b82f6',
            'color': 'white',
            'align': 'center',
            'border': 1
        })
        
        if report_type == 'daily':
            # Get daily sales data
            date_str = request.query_params.get('date', timezone.now().strftime('%Y-%m-%d'))
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
            end_of_day = timezone.make_aware(datetime.combine(date, datetime.max.time()))
            
            transactions = Transaction.objects.filter(
                created_at__range=[start_of_day, end_of_day],
                status='completed'
            ).select_related('cashier')
            
            # Write headers
            headers = ['Transaction #', 'Time', 'Cashier', 'Items', 'Total', 'Payment Method']
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)
            
            # Write data
            for row, t in enumerate(transactions, start=1):
                worksheet.write(row, 0, t.transaction_number)
                worksheet.write(row, 1, t.created_at.strftime('%H:%M:%S'))
                worksheet.write(row, 2, t.cashier.get_full_name() if t.cashier else 'Unknown')
                worksheet.write(row, 3, t.items.count())
                worksheet.write(row, 4, float(t.total))
                worksheet.write(row, 5, t.payment_method)
            
            # Write summary
            summary_row = len(transactions) + 3
            worksheet.write(summary_row, 0, 'Summary', header_format)
            
            total = transactions.aggregate(total=Sum('total'))['total'] or 0
            worksheet.write(summary_row + 1, 0, 'Total Sales')
            worksheet.write(summary_row + 1, 1, float(total))
            worksheet.write(summary_row + 2, 0, 'Transactions')
            worksheet.write(summary_row + 2, 1, transactions.count())
        
        workbook.close()
        output.seek(0)
        
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        
        return response