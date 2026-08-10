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
# pyrefly: ignore [missing-import]
from .tools.sheet_tools import manage_expense_sheet_tool

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
8. "expense_sheet": When the user wants to create, view, add items to, edit, or delete items from an expense sheet (e.g., "Create an expense sheet", "Add lunch 200 to my expense sheet", "Show my expense sheet", "Remove item 3 from the sheet").
9. "general": Asking for generic budgeting tips, savings advice, or greeting.

Output JSON ONLY format:
{
  "intent": "sql" | "analytics" | "forecast" | "pdf" | "create_transaction" | "create_savings_goal" | "create_budget" | "expense_sheet" | "general",
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
     "group_by": "category" | "month" | null,
     "action": "create" | "add_item" | "delete_item" | "update_item" | "view" | "list" | null,
     "sheet_id": int | null,
     "item_id": int | null,
     "title": string | null
  }
}
"""

    today = datetime.date.today()
    today_str = today.strftime('%Y-%m-%d')
    start_of_month = today.replace(day=1).strftime('%Y-%m-%d')

    system_prompt += f"""
Use YYYY-MM-DD for dates. Current date is {today_str}.
Do NOT set start_date or end_date unless the user explicitly mentions a specific date or date range in their query!
If user asks generally about transactions (e.g. I want to know about my transactions, show transactions), leave start_date and end_date as null.
If user explicitly asks about this month, set start_date to {start_of_month} and end_date to {today_str}.
"""

    messages = [
        {"role": "system", "content": system_prompt}
    ]
    if state.get('message_history'):
        for msg in state['message_history'][-15:]:
            messages.append({"role": msg['role'], "content": msg['content']})
    messages.append({"role": "user", "content": state['current_query']})

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
        elif intent == 'expense_sheet':
            result = manage_expense_sheet_tool(user, params, state['current_query'])
        else:
            result = "No tool execution needed."
    except Exception as e:
        result = f"Error executing tool: {str(e)}"

    return {'tool_result': result}


def get_all_stored_user_data(user):
    """
    Retrieves and calculates ALL stored financial data for the given user:
    - Overall Income, Expenses, and Net Balance
    - Count and list of recent transactions
    - Active Budgets and Spent amounts
    - Active Savings Goals
    - Expense Sheets Summary
    """
    from budgets.models import Budget
    from savings.models import SavingsGoal
    from transactions.models import Transaction, ExpenseSheet
    from django.db.models import Sum

    try:
        # 1. Total Income & Total Expense
        income_sum = Transaction.objects.filter(user=user, type='income').aggregate(t=Sum('amount'))['t'] or 0.0
        expense_sum = Transaction.objects.filter(user=user, type='expense').aggregate(t=Sum('amount'))['t'] or 0.0
        total_tx_count = Transaction.objects.filter(user=user).count()

        # 2. Recent Transactions (Up to 50 transactions to prevent truncation)
        recent_txs_qs = Transaction.objects.filter(user=user).order_by('-date', '-id')[:50]
        recent_txs = [{
            'date': str(tx.date),
            'category': tx.category.name if tx.category else 'Uncategorized',
            'type': tx.type,
            'amount': float(tx.amount),
            'description': tx.description
        } for tx in recent_txs_qs]

        # 3. Budgets
        budgets = Budget.objects.filter(user=user)
        budgets_list = []
        for b in budgets:
            spent_qs = Transaction.objects.filter(user=user, date__gte=b.start_date, date__lte=b.end_date, type='expense')
            if b.category:
                spent_qs = spent_qs.filter(category=b.category)
            spent_sum = spent_qs.aggregate(total=Sum('amount'))['total'] or 0.0
            budgets_list.append({
                'category': b.category.name if b.category else "All Categories",
                'limit_amount': float(b.amount),
                'spent_amount': float(spent_sum),
                'start_date': str(b.start_date),
                'end_date': str(b.end_date)
            })

        # 4. Savings Goals
        goals = SavingsGoal.objects.filter(user=user)
        goals_list = [{
            'name': g.name,
            'target_amount': float(g.target_amount),
            'current_amount': float(g.current_amount),
            'target_date': str(g.target_date),
            'status': g.status
        } for g in goals]

        # 5. Expense Sheets
        sheets = ExpenseSheet.objects.filter(user=user)
        sheets_list = [{
            'title': s.title,
            'description': s.description,
            'item_count': s.items.count(),
            'total_amount': sum(float(item.amount) for item in s.items.all())
        } for s in sheets]

        return f"""
[COMPLETE USER STORED FINANCIAL DATA]
Account Username: {user.username}
Active Currency: {user.currency}
Total Recorded Income: {float(income_sum)} {user.currency}
Total Recorded Expenses: {float(expense_sum)} {user.currency}
Net Balance: {float(income_sum - expense_sum)} {user.currency}
Total Transactions Count: {total_tx_count}
Recorded Transactions List (Up to 50): {json.dumps(recent_txs, default=str)}
Active Budgets: {json.dumps(budgets_list, default=str)}
Active Savings Goals: {json.dumps(goals_list, default=str)}
Expense Sheets: {json.dumps(sheets_list, default=str)}
"""
    except Exception as e:
        return f"[COMPLETE USER STORED FINANCIAL DATA] Error retrieving: {str(e)}"


def synthesize_response_node(state: AgentState) -> Dict[str, Any]:
    """
    LLM node that takes the query and tool results, and drafts the natural language advice.
    """
    llm = get_groq_llm(temperature=0.0)
    currency = state['user_currency']

    try:
        user = User.objects.get(id=state['user_id'])
        profile_context = get_all_stored_user_data(user)
    except Exception as e:
        profile_context = f"[USER FINANCIAL CONTEXT] Unavailable: {str(e)}"

    # Detect if this is a simple greeting
    clean_query = state['current_query'].strip().lower()
    if clean_query.startswith('[voice]'):
        clean_query = clean_query[7:].strip()
    clean_query = clean_query.strip('!.,?')
    
    greeting_words = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy', "what's up", 'yo', 'assalamu alaikum', 'salam']
    is_greeting = (state['detected_intent'] == 'general') and (
        clean_query in greeting_words or
        any(clean_query == g or clean_query.startswith(g + ' ') for g in greeting_words)
    )

    system_prompt = f"""You are Aura - a warm, intelligent, and deeply caring personal financial advisor. You speak exactly like a real human woman having a natural conversation, never robotic or stiff.

Core Personality Rules:
1. Speak naturally, warmly, and conversationally - like a knowledgeable best friend who happens to be a financial expert. Use contractions, filler transitions like So, Now, Here is the thing, What is really interesting is...
2. NEVER read out punctuation like commas, dashes, colons. Your text will be read aloud - write it the way you would actually say it.
3. ALL monetary amounts and numbers MUST be spelled out in full spoken words. NEVER use digit-only numbers. Examples:
   - 17000 -> seventeen thousand
   - 100 -> one hundred
   - 2500 -> two thousand five hundred
   - 1250.50 -> one thousand two hundred fifty taka and fifty paisa
   - 85% -> eighty five percent
4. Currency: Use {currency} context. When spelling out amounts, say taka for BDT (e.g., seventeen thousand taka).
5. GREETINGS AND UNREQUESTED DATA RULE (STRICT): NEVER talk about, mention, or volunteer saved budgets, savings goals, transactions, or account balances UNLESS explicitly asked in the message or a tool execution result specifically provides them.
6. Keep your responses concise, direct, and conversational. Do NOT give a massive structured list of suggestions or data breakdowns unless explicitly asked for recommendations, detailed analysis, or lists. Simply answer the specific query directly in a few natural sentences (2 to 4 sentences max).
7. Never introduce yourself mid-conversation. Just answer naturally.
8. If asked for guidance or advice and no data is available in context, gently explain nothing has been recorded yet, but do not force a long explanation.
9. Use natural speech transitions like So, Now, I would recommend, but only when it sounds conversational and fits the context.
10. Keep responses warm, encouraging, and human. If in a difficult situation, show genuine empathy and give a brief, supportive, and direct response.
11. NO UNPROMPTED DATA DUMP: If asking a general question, answer ONLY that question. Do NOT mention personal budgets or goals.
12. ZERO HALLUCINATION & FACTUAL ACCURACY RULE (CRITICAL): NEVER invent, fabricate, make up, or imagine any transaction, date, store name, or amount (e.g. NEVER make up Dhaba, 1200 taka, or any item not present in database context or tool output). Strictly adhere to database evidence. If a transaction exists in context (such as 70 taka on August 4th for Breakfast), accurately confirm it. NEVER contradict database evidence or deny a transaction that exists in context.

Formatting:
- Use markdown bullet points or numbered lists only for suggestions/recommendations sections.
- Do NOT use bold headers or colons mid-sentence - they sound robotic when read aloud.
- Write amounts fully in words, always.

Important: If tool output contains transactions, warmly summarize them for the user (mentioning dates, amounts, categories, or overall sum). ONLY if tool output is completely empty and no transactions exist in the account, gently say no transactions are recorded yet.
"""

    # Determine whether user explicitly requested personal financial records or if a tool ran
    query_lower = state['current_query'].lower()
    user_asked_for_data = any(w in query_lower for w in [
        'budget', 'saving', 'goal', 'my', 'balance', 'spending', 'spent',
        'transaction', 'account', 'record', 'report', 'sheet', 'history', 'list'
    ])

    tool_result = state['tool_result']
    tool_result_str = ''
    if tool_result and tool_result != 'No tool execution needed.':
        tool_result_str = f"Tool Execution Result: {json.dumps(tool_result, default=str)}"

    # Only include background profile context if relevant intent, explicit user request, or tool result exists
    should_include_profile = (
        state['detected_intent'] not in ['general', 'greeting'] or
        user_asked_for_data or
        bool(tool_result_str)
    )

    if is_greeting or not should_include_profile:
        user_context = f"User Query: {state['current_query']}\nDetected Intent: {state['detected_intent']}"
        if tool_result_str:
            user_context += f"\n{tool_result_str}"
    else:
        user_context = f"""User Query: {state['current_query']}
Detected Intent: {state['detected_intent']}
{profile_context}
{tool_result_str}
"""

    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Append session conversation history for complete memory continuity
    if state.get('message_history'):
        for msg in state['message_history'][-20:]:
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
