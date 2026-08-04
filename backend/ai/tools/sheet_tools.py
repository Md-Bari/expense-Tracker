import json
import datetime
from transactions.models import ExpenseSheet


def manage_expense_sheet_tool(user, params, query=''):
    """
    AI tool for managing expense sheets.
    Supports actions: create, add_item, delete_item, update_item, list, view
    """
    action = params.get('action', 'list')

    if action == 'create':
        title = params.get('title') or f"Expense Sheet - {datetime.date.today().strftime('%B %d, %Y')}"
        description = params.get('description', '')
        items = params.get('items', [])
        # Auto-assign IDs to items
        for i, item in enumerate(items):
            item['id'] = i + 1
        sheet = ExpenseSheet.objects.create(
            user=user,
            title=title,
            description=description,
            items=items
        )
        return {
            'status': 'success',
            'message': f"Created expense sheet '{sheet.title}' with {len(items)} items.",
            'sheet_id': sheet.id,
            'sheet_title': sheet.title,
            'items': sheet.items
        }

    elif action == 'add_item':
        sheet_id = params.get('sheet_id')
        # If no sheet_id, use the most recent sheet or create one
        if sheet_id:
            sheet = ExpenseSheet.objects.filter(user=user, id=sheet_id).first()
        else:
            sheet = ExpenseSheet.objects.filter(user=user).first()

        if not sheet:
            # Auto-create a new sheet
            sheet = ExpenseSheet.objects.create(
                user=user,
                title=f"Expense Sheet - {datetime.date.today().strftime('%B %d, %Y')}",
                items=[]
            )

        items = sheet.items or []
        next_id = max([it.get('id', 0) for it in items], default=0) + 1
        new_item = {
            'id': next_id,
            'description': params.get('description', ''),
            'amount': float(params.get('amount', 0)),
            'category': params.get('category_name') or params.get('category', 'Other'),
            'date': params.get('date') or str(datetime.date.today())
        }
        items.append(new_item)
        sheet.items = items
        sheet.save()
        return {
            'status': 'success',
            'message': f"Added item '{new_item['description']}' ({new_item['amount']}) to sheet '{sheet.title}'.",
            'sheet_id': sheet.id,
            'item': new_item,
            'total_items': len(items)
        }

    elif action == 'delete_item':
        sheet_id = params.get('sheet_id')
        item_id = params.get('item_id')
        if sheet_id:
            sheet = ExpenseSheet.objects.filter(user=user, id=sheet_id).first()
        else:
            sheet = ExpenseSheet.objects.filter(user=user).first()

        if not sheet:
            return {'status': 'error', 'message': 'No expense sheet found.'}

        items = sheet.items or []
        original_len = len(items)
        if item_id is not None:
            items = [it for it in items if it.get('id') != item_id]
        sheet.items = items
        sheet.save()
        removed = original_len - len(items)
        return {
            'status': 'success',
            'message': f"Removed {removed} item(s) from sheet '{sheet.title}'.",
            'remaining_items': len(items)
        }

    elif action == 'update_item':
        sheet_id = params.get('sheet_id')
        item_id = params.get('item_id')
        if sheet_id:
            sheet = ExpenseSheet.objects.filter(user=user, id=sheet_id).first()
        else:
            sheet = ExpenseSheet.objects.filter(user=user).first()

        if not sheet:
            return {'status': 'error', 'message': 'No expense sheet found.'}

        items = sheet.items or []
        updated = False
        for item in items:
            if item.get('id') == item_id:
                if params.get('description'):
                    item['description'] = params['description']
                if params.get('amount') is not None:
                    item['amount'] = float(params['amount'])
                if params.get('category_name') or params.get('category'):
                    item['category'] = params.get('category_name') or params.get('category')
                if params.get('date'):
                    item['date'] = params['date']
                updated = True
                break

        sheet.items = items
        sheet.save()
        return {
            'status': 'success' if updated else 'not_found',
            'message': f"Item updated in sheet '{sheet.title}'." if updated else f"Item with id {item_id} not found.",
            'items': items
        }

    elif action == 'view':
        sheet_id = params.get('sheet_id')
        if sheet_id:
            sheet = ExpenseSheet.objects.filter(user=user, id=sheet_id).first()
        else:
            sheet = ExpenseSheet.objects.filter(user=user).first()

        if not sheet:
            return {'status': 'empty', 'message': 'You have no expense sheets yet.'}

        total = sum(float(it.get('amount', 0)) for it in (sheet.items or []))
        return {
            'status': 'success',
            'sheet_id': sheet.id,
            'title': sheet.title,
            'description': sheet.description,
            'items': sheet.items,
            'total_amount': total,
            'item_count': len(sheet.items or [])
        }

    else:  # list
        sheets = ExpenseSheet.objects.filter(user=user)
        result = []
        for s in sheets:
            total = sum(float(it.get('amount', 0)) for it in (s.items or []))
            result.append({
                'id': s.id,
                'title': s.title,
                'item_count': len(s.items or []),
                'total_amount': total,
                'updated_at': str(s.updated_at)
            })
        if not result:
            return {'status': 'empty', 'message': 'You have no expense sheets yet.'}
        return {
            'status': 'success',
            'sheets': result,
            'total_sheets': len(result)
        }
