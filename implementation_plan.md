# Implementation Plan - English to Bangla Full System Language Toggle

Add a one-click English <-> Bangla language switcher to the full UI, allowing users to instantly switch the system language across all components with proper Bangla text translations, digit conversions (0-9 to ০-৯), currency formatting (৳ / BDT), date formatting, and persistent user preferences.

## User Review Required

> [!NOTE]
> The language preference will be stored in `localStorage` (`language: 'en' | 'bn'`). On first load, it defaults to `'en'`. Switching languages updates the entire UI instantaneously without needing a page refresh.

> [!TIP]
> Bangla numbers and dates will be formatted automatically using standard Bangla digits (`০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯`) and localized month names.

## Proposed Changes

### Core i18n & Context

#### [NEW] [LanguageContext.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/contexts/LanguageContext.tsx)
- Create `LanguageContext` with state `language` ('en' | 'bn') and `toggleLanguage()`.
- Add dictionary mapping for system-wide translation keys (Nav items, Dashboard metrics, Transactions, Budgets, Goals, Reports, Chatbot, Auth, Admin, etc.).
- Add helper functions:
  - `t(key: string, fallback?: string): string`
  - `formatNumber(num: number | string): string` (Converts ASCII numbers to Bangla numerals when language is `'bn'`).
  - `formatCurrency(amount: number | string, symbol?: string): string` (Formats currency into Bangla numerals with ৳ symbol).
  - `formatDate(dateStr: string): string` (Formats dates into Bangla format).

#### [MODIFY] [providers.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/providers.tsx)
- Wrap application with `LanguageProvider`.

#### [NEW] [LanguageToggle.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/components/LanguageToggle.tsx)
- Create a toggle button component with smooth transitions showing `EN | বাংলা` or language icons.

#### [MODIFY] [layout.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/layout.tsx) & [globals.css](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/globals.css)
- Load Google Font `Hind Siliguri` for clean Bangla typography rendering.
- Configure global CSS rule for Bangla text font hierarchy.

---

### UI Components & Navigation

#### [MODIFY] [Sidebar.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/components/Sidebar.tsx)
- Place `LanguageToggle` button next to Dark/Light theme button in sidebar and mobile header.
- Translate navigation items ("Dashboard" -> "ড্যাশবোর্ড", "Transactions" -> "লেনদেন", "Expense Sheets" -> "খরচের হিসাবপত্র", "Budgets" -> "বাজেট", "Savings Goals" -> "সঞ্চয় লক্ষ্য", "PDF Reports" -> "পিডিএফ রিপোর্ট", "AI Advisor" -> "এআই পরামর্শক", "Admin Console" -> "অ্যাডমিন কনসোল").
- Translate user profile card labels and currency labels.

#### [MODIFY] [FloatingChatbot.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/components/FloatingChatbot.tsx)
- Use `useLanguage()` to translate chatbot title, subtitle, prompt suggestions, message inputs, and voice orb triggers.

---

### Dashboard & Feature Pages

#### [MODIFY] [dashboard/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/dashboard/page.tsx)
- Apply `t()`, `formatCurrency()`, and `formatNumber()` to summary cards (Total Income, Total Expense, Net Balance, Savings Rate).
- Translate chart labels, legend titles, budget health alerts, and recent transactions section.

#### [MODIFY] [transactions/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/transactions/page.tsx)
- Translate transaction headers, filter dropdowns, category badges, transaction modal form fields, table columns, and formatted amounts.

#### [MODIFY] [sheets/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/sheets/page.tsx)
- Translate sheet upload zone, sheet lists, total rows count, action buttons, and status tags.

#### [MODIFY] [budgets/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/budgets/page.tsx)
- Translate budget cards, spent percentages, category names, creation modals, and warning alerts.

#### [MODIFY] [goals/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/goals/page.tsx)
- Translate savings goal cards, target progress, deposit modals, deadline formatting, and status badges.

#### [MODIFY] [reports/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/reports/page.tsx)
- Translate report generator parameters, export buttons, download progress, and report tables.

#### [MODIFY] [chat/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/chat/page.tsx)
- Translate financial advisor chat interface, sample prompts, and conversation header.

#### [MODIFY] [admin/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/(dashboard)/admin/page.tsx)
- Translate admin system stats, user list table headers, role labels, and action buttons.

#### [MODIFY] Landing page & Auth pages ([page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/page.tsx), [login/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/login/page.tsx), [register/page.tsx](file:///c:/New%20folder%20%282%29/expense%20Tracker/frontend/app/register/page.tsx))
- Add top header language toggle button.
- Translate landing page hero headers, feature section cards, login form, registration form, and call-to-action buttons.

## Verification Plan

### Automated Tests
- Build verification: Run `npm run build` inside `frontend/` to confirm zero TypeScript compile or JSX syntax errors.

### Manual Verification
- Test language toggle button click: Verify instant toggle from `EN` to `BN` and back to `EN`.
- Check persistence: Refresh the browser page and verify saved language state is retrieved from `localStorage`.
- Verify digit and currency formatting: Check that amounts like `1500.00` turn into `৳ ১,৫০০.০০` in Bangla mode.
- Verify full UI layout: Confirm responsive alignment, fonts, icons, and text wrappers across Mobile and Desktop screens.
