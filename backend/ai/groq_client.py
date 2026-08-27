import os
import re
import time
import logging
from django.conf import settings
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq

logger = logging.getLogger(__name__)

FALLBACK_MODELS = [
    'groq/compound-mini',
    'groq/compound',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
]

def get_groq_llm(temperature=0.0, model_name=None, max_retries=5):
    """
    Returns an instance of ChatGroq client with built-in retries and configurable model.
    """
    api_key = getattr(settings, 'GROQ_API_KEY', '') or os.environ.get('GROQ_API_KEY', '')
    selected_model = model_name or getattr(settings, 'GROQ_MODEL', '') or os.environ.get('GROQ_MODEL', '') or 'groq/compound-mini'

    return ChatGroq(
        api_key=api_key,
        model_name=selected_model,
        temperature=temperature,
        max_retries=max_retries,
    )


def invoke_groq_with_fallback(llm_input, temperature=0.0, initial_model=None):
    """
    Invokes Groq LLM with input (string or messages list) and automatic rate-limit backoff / model fallback.
    """
    api_key = getattr(settings, 'GROQ_API_KEY', '') or os.environ.get('GROQ_API_KEY', '')
    primary_model = initial_model or getattr(settings, 'GROQ_MODEL', '') or os.environ.get('GROQ_MODEL', '') or 'groq/compound-mini'
    
    candidate_models = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]

    last_exception = None
    for model in candidate_models:
        for attempt in range(2):
            try:
                llm = ChatGroq(
                    api_key=api_key,
                    model_name=model,
                    temperature=temperature,
                    max_retries=3,
                )
                return llm.invoke(llm_input)
            except Exception as e:
                last_exception = e
                err_str = str(e).lower()
                logger.warning(f"Groq invocation failed on model {model} (attempt {attempt+1}): {e}")
                if "rate_limit" in err_str or "429" in err_str:
                    match = re.search(r'try again in ([\d\.]+)s', err_str)
                    wait_secs = float(match.group(1)) if match else 2.5
                    time.sleep(min(wait_secs, 4.0))
                    continue
                break

    if last_exception:
        raise last_exception


