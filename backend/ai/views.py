from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.http import StreamingHttpResponse
import requests
import os
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


class AITTSEndpoint(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response(
                {'error': 'A text parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = os.environ.get('ELEVENLABS_API_KEY', 'sk_88b38e88708fb1521fd909b54736a1245d41894273a30451')
        # Rachel - clear, warm English female voice
        voice_id = os.environ.get('ELEVENLABS_VOICE_ID', '21m00Tcm4TlvDq8ikWAM')

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        data = {
            "text": text,
            "model_id": "eleven_turbo_v2_5",
            "language_code": "en",
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.85,
                "style": 0.25,
                "use_speaker_boost": True
            }
        }

        try:
            response = requests.post(url, json=data, headers=headers, stream=True)
            if response.status_code != 200:
                err_text = response.text
                return Response(
                    {'error': f"ElevenLabs API error ({response.status_code}): {err_text}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            django_response = StreamingHttpResponse(
                response.iter_content(chunk_size=4096),
                content_type="audio/mpeg"
            )
            return django_response
        except Exception as e:
            return Response(
                {'error': f"Failed to generate TTS: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
