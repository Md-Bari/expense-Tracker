import os
from django.conf import settings
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq


def get_groq_llm(temperature=0.0):
    """
    Returns an instance of ChatGroq client.
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        # Check environment as backup
        api_key = os.environ.get('GROQ_API_KEY', '')

    return ChatGroq(
        api_key=api_key,
        model_name="llama-3.1-8b-instant",  # Light, fast model. Can be easily swapped.
        temperature=temperature
    )
