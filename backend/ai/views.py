from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .agent import run_financial_agent


class AIChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        query = request.data.get('message')
        history = request.data.get('history', [])

        if not query:
            return Response(
                {'error': 'A message parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Execute the LangGraph workflow
            agent_response = run_financial_agent(request.user, query, history)
            
            return Response({
                'reply': agent_response.get('result'),
                'intent': agent_response.get('intent'),
                'data': agent_response.get('data')
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f"Agent execution failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
