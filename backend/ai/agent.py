from transactions.models import Transaction
import json
import datetime
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from .groq_client import get_groq_llm
# pyrefly: ignore [missing-import]
from .tools.sql_tool import execute_safe_financial_query
# pyrefly: ignore [missing-import]
from .tools.analytics import compare_month_over_month, get_top_spending_categories
# pyrefly: ignore [missing-import]
from .tools.forecast import forecast_next_month_expenses
# pyrefly: ignore [missing-import]
from .tools.pdf import trigger_report_generation
# pyrefly: ignore [missing-import]
from .tools.mutation_tools import create_transaction_tool, create_savings_goal_tool, create_budget_tool

User = get_user_model()


class AgentState(TypedDict):
    user_id: int
    user_currency: str
    message_history: List[Dict[str, str]]
    current_query: str
    detected_intent: str
    tool_parameters: Dict[str, Any]
    tool_result: Any
    final_response: str


def detect_intent_node(state: AgentState) -> Dict[str, Any]:
    """
    LLM node that classifies the user's intent and extracts relevant parameters.
    """
    llm = get_groq_llm(temperature=0.0)
    
    system_prompt = """You are the intent routing component of a financial AI assistant.
Your task is to classify the user's query into one of these intents and extract its parameters.

Available Intents:
1. "sql": Querying transaction history list, counting transactions, calculating specific category sums, averages, or finding specific date expenditures.
2. "analytics": Month-over-month comparison, identifying wasteful category spending, listing top expenditure areas, checking expense distributions.
3. "forecast": Predicting/forecasting next month's spending or showing savings estimates.
4. "pdf": Generating/downloading a PDF financial statement or monthly report.
5. "create_transaction": When the user explicitly wants to add, record, or create a transaction (e.g., "Add expense of 500 for Food today", "I earned 12000 from freelance writing").
6. "create_savings_goal": When the user explicitly wants to create a new savings goal target (e.g., "Create a savings goal of 50000 for a new laptop by December 31st").
7. "create_budget": When the user explicitly wants to create a new budget (e.g., "Create a budget of 2000 for Food this month", "add total budget of 50000").
8. "general": Asking for generic budgeting tips, savings advice, or greeting.

Output JSON ONLY format:
{
  "intent": "sql" | "analytics" | "forecast" | "pdf" | "create_transaction" | "create_savings_goal" | "create_budget" | "general",
  "parameters": {
     "amount": float | null,
     "type": "income" | "expense" | null,
     "category_name": string | null,
     "description": string | null,
     "date": "YYYY-MM-DD" | null,
     "name": string | null,
     "target_amount": float | null,
     "target_date": "YYYY-MM-DD" | null,
     "start_date": "YYYY-MM-DD" | null,
     "end_date": "YYYY-MM-DD" | null,
     "transaction_type": "income" | "expense" | null,
     "aggregate": "sum" | "avg" | "count" | null,
     "group_by": "category" | "month" | null
  }
}

Use YYYY-MM-DD for dates. Assume current date is 2026-08-02.
If user asks about "this week", compute start_date as 2026-07-27 (Monday) to 2026-08-02.
If user asks about "this month", compute start_date as 2026-08-01 to 2026-08-02.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": state['current_query']}
    ]

    try:
        response = llm.invoke(messages)
        # Attempt to parse json
        content = response.content.strip()
        
        # Clean potential markdown wrappers
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        
        data = json.loads(content.strip())
        return {
            'detected_intent': data.get('intent', 'general'),
            'tool_parameters': data.get('parameters', {})
        }
    except Exception as e:
        # Fallback to general intent on parsing error
        return {
            'detected_intent': 'general',
            'tool_parameters': {}
        }


def execute_tool_node(state: AgentState) -> Dict[str, Any]:
    """
    Executes the appropriate local backend tool based on the detected intent.
    """
    intent = state['detected_intent']
    params = state['tool_parameters'] or {}
    
    try:
        user = User.objects.get(id=state['user_id'])
    except User.DoesNotExist:
        return {'tool_result': "User not found."}

    result = None
    
    try:
        if intent == 'sql':
            result = execute_safe_financial_query(user, params)
        elif intent == 'analytics':
            # Check if MoM comparison is needed
            query_lower = state['current_query'].lower()
            if 'compare' in query_lower or 'last month' in query_lower or 'vs' in query_lower:
                result = {
                    'analytics_type': 'mom_comparison',
                    'data': compare_month_over_month(user)
                }
            else:
                result = {
                    'analytics_type': 'top_categories',
                    'data': get_top_spending_categories(user)
                }
        elif intent == 'forecast':
            result = forecast_next_month_expenses(user)
        elif intent == 'pdf':
            start_date_str = params.get('start_date') or str(datetime.date.today().replace(day=1))
            end_date_str = params.get('end_date') or str(datetime.date.today())
            result = trigger_report_generation(user, start_date_str, end_date_str)
        elif intent == 'create_transaction':
            result = create_transaction_tool(user, params)
        elif intent == 'create_savings_goal':
            result = create_savings_goal_tool(user, params)
        elif intent == 'create_budget':
            result = create_budget_tool(user, params)
        else:
            result = "No tool execution needed."
    except Exception as e:
        result = f"Error executing tool: {str(e)}"

    return {'tool_result': result}


def synthesize_response_node(state: AgentState) -> Dict[str, Any]:
    """
    LLM node that takes the query and tool results, and drafts the natural language advice.
    """
    llm = get_groq_llm(temperature=0.2)
    currency = state['user_currency']

    # Fetch budgets, goals, and user metrics for context injection
    from budgets.models import Budget
    from savings.models import SavingsGoal
    from django.db.models import Sum

    try:
        user = User.objects.get(id=state['user_id'])
        # 1. Get active budgets
        budgets = Budget.objects.filter(user=user)
        budgets_list = []
        for b in budgets:
            # Calculate total spent for this budget's duration in its category
            spent_qs = Transaction.objects.filter(user=user, date__gte=b.start_date, date__lte=b.end_date, type='expense')
            if b.category:
                spent_qs = spent_qs.filter(category=b.category)
            spent_sum = spent_qs.aggregate(total=Sum('amount'))['total'] or 0.0
            
            cat_name = b.category.name if b.category else "All Categories"
            budgets_list.append({
                'category': cat_name,
                'limit_amount': float(b.amount),
                'spent_amount': float(spent_sum),
                'start_date': str(b.start_date),
                'end_date': str(b.end_date)
            })

        # 2. Get active savings goals
        goals = SavingsGoal.objects.filter(user=user)
        goals_list = [{
            'name': g.name,
            'target_amount': float(g.target_amount),
            'current_amount': float(g.current_amount),
            'target_date': str(g.target_date),
            'status': g.status
        } for g in goals]

        profile_context = f"""
[USER FINANCIAL CONTEXT]
Active Budgets: {json.dumps(budgets_list, default=str)}
Active Savings Goals: {json.dumps(goals_list, default=str)}
Active Currency: {user.currency}
Username: {user.username}
"""
    except Exception as e:
        profile_context = f"[USER FINANCIAL CONTEXT] Unavailable: {str(e)}"

    # Detect if this is a simple greeting
    query_lower = state['current_query'].strip().lower()
    greeting_words = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy', 'what\'s up', 'yo', 'assalamu alaikum', 'salam']
    is_greeting = state['detected_intent'] == 'general' and any(query_lower.startswith(g) or query_lower == g for g in greeting_words)

    system_prompt = f"""You are Aura, a friendly and professional personal financial advisor chatbot.
Rules:
1. If the user greets you (says "hello", "hi", etc.), respond with ONLY a brief, warm, natural greeting like a human friend would. For example: "Hey there! How can I help you today?" Do NOT list their budgets, goals, or any financial data in a greeting response. Keep it to 1-2 short sentences maximum.
2. If the user asks a specific question, answer it directly. Do NOT greet them or introduce yourself — just answer.
3. NEVER introduce yourself with lines like "I'm Aura, your virtual wealth manager" or "I'd be delighted to help". Just talk naturally like a helpful friend.
4. Keep responses concise, clear, and conversational.
5. Format monetary values with the appropriate symbol (e.g. ৳ for BDT). The user's currency is {currency}.
6. Use markdown for lists when presenting data.

Important: If tool output is empty or shows no transactions, briefly explain they haven't recorded any yet.
"""

    # Only inject financial context when the user is asking a real question, not greeting
    tool_result = state['tool_result']
    tool_result_str = ''
    if tool_result and tool_result != 'No tool execution needed.':
        tool_result_str = f"Tool Execution Result: {json.dumps(tool_result, default=str)}"

    if is_greeting:
        user_context = f"User Query: {state['current_query']}\nDetected Intent: greeting"
    else:
        user_context = f"""User Query: {state['current_query']}
Detected Intent: {state['detected_intent']}
{profile_context}
{tool_result_str}
"""

    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Append recent conversation history for continuity
    for msg in state['message_history'][-5:]:
        messages.append({"role": msg['role'], "content": msg['content']})

    messages.append({"role": "user", "content": user_context})

    try:
        response = llm.invoke(messages)
        return {'final_response': response.content}
    except Exception as e:
        return {'final_response': f"I apologize, I encountered an issue preparing my response: {str(e)}"}


# Compile the LangGraph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("detect_intent", detect_intent_node)
workflow.add_node("execute_tool", execute_tool_node)
workflow.add_node("synthesize_response", synthesize_response_node)

# Set entry point
workflow.set_entry_point("detect_intent")

# Define edges
workflow.add_edge("detect_intent", "execute_tool")
workflow.add_edge("execute_tool", "synthesize_response")
workflow.add_edge("synthesize_response", END)

# Compile graph
agent_app = workflow.compile()


def run_financial_agent(user, query: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Runs thecompiled LangGraph agent for a user query.
    """
    if history is None:
        history = []

    initial_state = {
        'user_id': user.id,
        'user_currency': user.currency,
        'message_history': history,
        'current_query': query,
        'detected_intent': '',
        'tool_parameters': {},
        'tool_result': None,
        'final_response': ''
    }

    result = agent_app.invoke(initial_state)
    return {
        'intent': result.get('detected_intent'),
        'result': result.get('final_response'),
        'data': result.get('tool_result')
    }
