from rest_framework.pagination import PageNumberPagination, LimitOffsetPagination, CursorPagination
from rest_framework.response import Response
from collections import OrderedDict

class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination with page size"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('results', data)
        ]))

class LargeResultsSetPagination(PageNumberPagination):
    """Large pagination for reports"""
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

class CursorSetPagination(CursorPagination):
    """Cursor-based pagination for real-time data"""
    page_size = 20
    ordering = '-created_at'
    cursor_query_param = 'cursor'