from rest_framework import renderers
import json

class POSJSONRenderer(renderers.JSONRenderer):
    """Custom JSON renderer with consistent format"""
    charset = 'utf-8'
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response')
        
        # Create consistent response format
        if response and response.status_code >= 400:
            # Error response
            formatted_data = {
                'success': False,
                'error': {
                    'code': response.status_code,
                    'message': str(data.get('detail', 'An error occurred')) if isinstance(data, dict) else str(data)
                }
            }
            if isinstance(data, dict) and 'errors' in data:
                formatted_data['error']['errors'] = data['errors']
        else:
            # Success response
            formatted_data = {
                'success': True,
                'data': data
            }
        
        return super().render(formatted_data, accepted_media_type, renderer_context)

class CSVRenderer(renderers.BaseRenderer):
    """CSV renderer for exporting data"""
    media_type = 'text/csv'
    format = 'csv'
    
    def render(self, data, media_type=None, renderer_context=None):
        if not data:
            return ''
        
        import csv
        from io import StringIO
        
        # Get the first item to determine headers
        if isinstance(data, list) and data:
            headers = data[0].keys()
        elif isinstance(data, dict):
            headers = data.keys()
        else:
            return str(data)
        
        csv_buffer = StringIO()
        writer = csv.DictWriter(csv_buffer, fieldnames=headers)
        writer.writeheader()
        
        if isinstance(data, list):
            writer.writerows(data)
        elif isinstance(data, dict):
            writer.writerow(data)
        
        return csv_buffer.getvalue()

class ExcelRenderer(renderers.BaseRenderer):
    """Excel renderer for exporting data"""
    media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    format = 'xlsx'
    
    def render(self, data, media_type=None, renderer_context=None):
        import xlsxwriter
        from io import BytesIO
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Data')
        
        # Add headers
        if isinstance(data, list) and data:
            for col, header in enumerate(data[0].keys()):
                worksheet.write(0, col, header)
            
            # Add data
            for row, item in enumerate(data, start=1):
                for col, (key, value) in enumerate(item.items()):
                    worksheet.write(row, col, value)
        
        elif isinstance(data, dict):
            for col, key in enumerate(data.keys()):
                worksheet.write(0, col, key)
            for col, value in enumerate(data.values()):
                worksheet.write(1, col, value)
        
        workbook.close()
        output.seek(0)
        return output.getvalue()