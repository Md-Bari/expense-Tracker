from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .utils import extract_receipt_data
import os


class ReceiptUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {'error': 'No file uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Save file to a temporary location in media root
            path = default_storage.save(f'tmp_receipts/{file_obj.name}', ContentFile(file_obj.read()))
            full_path = os.path.join(default_storage.location, path)

            # Extract receipt data
            receipt_data = extract_receipt_data(full_path)
            
            # Clean up the temp file
            if os.path.exists(full_path):
                os.remove(full_path)
                
            return Response({
                'message': 'Receipt scanned successfully.',
                'data': receipt_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f"Failed to parse receipt: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
