'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  toBanglaNumeral: (num: number | string) => string;
  formatCurrency: (amount: number | string, currencySymbol?: string) => string;
  formatDate: (dateStr: string) => string;
}

const EnglishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BanglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBanglaNumeral = (input: number | string): string => {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = EnglishDigits.indexOf(char);
    if (index !== -1) {
      result += BanglaDigits[index];
    } else {
      result += char;
    }
  }
  return result;
};

export const banglaMonthNames = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const dictionary: Record<string, { en: string; bn: string }> = {
  // Navigation & General
  'nav.dashboard': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  'nav.transactions': { en: 'Transactions', bn: 'লেনদেন' },
  'nav.sheets': { en: 'Expense Sheets', bn: 'খরচের হিসাবপত্র' },
  'nav.budgets': { en: 'Budgets', bn: 'বাজেট' },
  'nav.goals': { en: 'Savings Goals', bn: 'সঞ্চয় লক্ষ্য' },
  'nav.reports': { en: 'PDF Reports', bn: 'পিডিএফ রিপোর্ট' },
  'nav.chat': { en: 'AI Advisor', bn: 'এআই পরামর্শক' },
  'nav.admin': { en: 'Admin Console', bn: 'অ্যাডমিন কনসোল' },
  'nav.logout': { en: 'Log Out', bn: 'লগ আউট' },
  'currency.label': { en: 'Currency', bn: 'মুদ্রা' },
  'theme.dark': { en: 'Switch to Dark Mode', bn: 'ডার্ক মোড' },
  'theme.light': { en: 'Switch to Light Mode', bn: 'লাইট মোড' },
  'lang.switch': { en: 'বাংলায় দেখুন', bn: 'Switch to English' },
  'lang.current': { en: 'EN', bn: 'বাংলা' },

  // Dashboard Page
  'dash.title': { en: 'Financial Dashboard', bn: 'ফাইন্যান্সিয়াল ড্যাশবোর্ড' },
  'dash.subtitle': { en: 'Overview of your wealth, cashflow, and spending analytics.', bn: 'আপনার সম্পদ, নগদ প্রবাহ এবং খরচের সামগ্রিক বিশ্লেষণ।' },
  'dash.totalIncome': { en: 'Total Income', bn: 'মোট আয়' },
  'dash.totalExpense': { en: 'Total Expense', bn: 'মোট খরচ' },
  'dash.netBalance': { en: 'Net Balance', bn: 'নিট ব্যালেন্স' },
  'dash.savingsRate': { en: 'Savings Rate', bn: 'সঞ্চয়ের হার' },
  'dash.cashflowTrend': { en: 'Cash Flow Trend', bn: 'নগদ প্রবাহের গতিপ্রকৃতি' },
  'dash.incomeVsExpense': { en: 'Income vs Expense trajectory over recent months', bn: 'সাম্প্রতিক মাসগুলোতে আয় বনাম খরচের চিত্র' },
  'dash.expensesByCategory': { en: 'Expenses by Category', bn: 'ক্যাটাগরি অনুযায়ী খরচ' },
  'dash.budgetHealth': { en: 'Budget Health Alerts', bn: 'বাজেটের সতর্কতা' },
  'dash.recentTransactions': { en: 'Recent Transactions', bn: 'সাম্প্রতিক লেনদেন' },
  'dash.viewAll': { en: 'View All', bn: 'সব দেখুন' },
  'dash.noTransactions': { en: 'No recent transactions recorded.', bn: 'কোনো সাম্প্রতিক লেনদেন পাওয়া যায়নি।' },
  'dash.quickAdd': { en: 'Add Transaction', bn: 'লেনদেন যোগ করুন' },
  'dash.notifications': { en: 'Notifications', bn: 'নোটিফিকেশনসমূহ' },
  'dash.markAllRead': { en: 'Mark all as read', bn: 'সব পঠিত চিহ্নিত করুন' },
  'dash.noNotifications': { en: 'No notifications at the moment.', bn: 'বর্তমানে কোনো নোটিফিকেশন নেই।' },

  // Transactions Page
  'trans.title': { en: 'Transactions History', bn: 'লেনদেনের ইতিহাস' },
  'trans.subtitle': { en: 'View, filter, and track all your logged income and expenses.', bn: 'আপনার সমস্ত আয় ও খরচের হিসাব দেখুন ও ফিল্টার করুন।' },
  'trans.addBtn': { en: 'Add New Transaction', bn: 'নতুন লেনদেন যোগ করুন' },
  'trans.searchPlaceholder': { en: 'Search description, category, merchant...', bn: 'বিবরণ, ক্যাটাগরি বা মার্চেন্ট খুঁজুন...' },
  'trans.allTypes': { en: 'All Types', bn: 'সব ধরণ' },
  'trans.typeIncome': { en: 'Income', bn: 'আয়' },
  'trans.typeExpense': { en: 'Expense', bn: 'খরচ' },
  'trans.allCategories': { en: 'All Categories', bn: 'সব ক্যাটাগরি' },
  'trans.colDate': { en: 'Date', bn: 'তারিখ' },
  'trans.colDescription': { en: 'Description', bn: 'বিবরণ' },
  'trans.colCategory': { en: 'Category', bn: 'ক্যাটাগরি' },
  'trans.colType': { en: 'Type', bn: 'ধরণ' },
  'trans.colAmount': { en: 'Amount', bn: 'পরিমাণ' },
  'trans.colActions': { en: 'Actions', bn: 'অ্যাকশন' },
  'trans.noFound': { en: 'No transactions found matching your criteria.', bn: 'আপনার ফিল্টার অনুযায়ী কোনো লেনদেন পাওয়া যায়নি।' },
  'trans.modalTitleAdd': { en: 'Add New Transaction', bn: 'নতুন লেনদেন যোগ করুন' },
  'trans.modalTitleEdit': { en: 'Edit Transaction', bn: 'লেনদেন সংশোধন করুন' },
  'trans.fieldAmount': { en: 'Amount', bn: 'পরিমাণ' },
  'trans.fieldType': { en: 'Type', bn: 'ধরণ' },
  'trans.fieldCategory': { en: 'Category', bn: 'ক্যাটাগরি' },
  'trans.fieldDate': { en: 'Date', bn: 'তারিখ' },
  'trans.fieldDescription': { en: 'Description', bn: 'বিবরণ' },
  'trans.fieldMerchant': { en: 'Merchant / Source', bn: 'মার্চেন্ট / উৎস' },
  'trans.fieldNotes': { en: 'Notes', bn: 'নোট' },
  'trans.save': { en: 'Save Transaction', bn: 'সংরক্ষণ করুন' },
  'trans.cancel': { en: 'Cancel', bn: 'বাতিল' },
  'trans.delete': { en: 'Delete', bn: 'মুছুন' },
  'trans.confirmDelete': { en: 'Are you sure you want to delete this transaction?', bn: 'আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলতে চান?' },

  // Sheets Page
  'sheets.title': { en: 'Expense Sheets', bn: 'খরচের হিসাবপত্র (শীট)' },
  'sheets.subtitle': { en: 'Upload and manage Excel/CSV expense sheets effortlessly.', bn: 'এক্সেল বা সিএসভি শীট আপলোড ও সহজে পরিচালনা করুন।' },
  'sheets.uploadBtn': { en: 'Upload Expense Sheet', bn: 'শীট আপলোড করুন' },
  'sheets.fileName': { en: 'Sheet Name', bn: 'শীটের নাম' },
  'sheets.totalRows': { en: 'Total Rows', bn: 'মোট সারি' },
  'sheets.processedRows': { en: 'Processed Rows', bn: 'প্রসেস করা সারি' },
  'sheets.status': { en: 'Status', bn: 'অবস্থা' },
  'sheets.createdAt': { en: 'Created Date', bn: 'তৈরির তারিখ' },
  'sheets.noSheets': { en: 'No expense sheets uploaded yet.', bn: 'এখনো কোনো খরচের শীট আপলোড করা হয়নি।' },

  // Budgets Page
  'budgets.title': { en: 'Budgets & Limits', bn: 'বাজেট এবং খরচের সীমা' },
  'budgets.subtitle': { en: 'Set category-wise spending limits and monitor consumption.', bn: 'ক্যাটাগরি অনুযায়ী খরচের সীমা নির্ধারণ করুন এবং পর্যবেক্ষণ করুন।' },
  'budgets.addBtn': { en: 'Create New Budget', bn: 'নতুন বাজেট তৈরি করুন' },
  'budgets.spent': { en: 'Spent', bn: 'খরচ হয়েছে' },
  'budgets.limit': { en: 'Limit', bn: 'সীমা' },
  'budgets.remaining': { en: 'Remaining', bn: 'অবশিষ্ট' },
  'budgets.overBudget': { en: 'Over Budget!', bn: 'বাজেট অতিক্রম করেছে!' },
  'budgets.nearLimit': { en: 'Near Limit', bn: 'সীমার কাছাকাছি' },
  'budgets.onTrack': { en: 'On Track', bn: 'সঠিক পথে আছে' },
  'budgets.noBudgets': { en: 'No budgets created for this month.', bn: 'এই মাসের জন্য কোনো বাজেট তৈরি করা হয়নি।' },
  'budgets.modalTitle': { en: 'Create Category Budget', bn: 'নতুন ক্যাটাগরি বাজেট তৈরি করুন' },
  'budgets.fieldCategory': { en: 'Category', bn: 'ক্যাটাগরি' },
  'budgets.fieldAmount': { en: 'Monthly Limit Amount', bn: 'মাসিক সর্বোচ্চ সীমা' },
  'budgets.save': { en: 'Set Budget', bn: 'বাজেট নির্ধারণ করুন' },

  // Savings Goals Page
  'goals.title': { en: 'Savings & Financial Goals', bn: 'সঞ্চয় এবং আর্থিক লক্ষ্য' },
  'goals.subtitle': { en: 'Track progress towards your dream milestones and target funds.', bn: 'আপনার ভবিষ্যৎ স্বপ্ন ও সঞ্চয় লক্ষ্যমাত্রা অর্জন ট্র্যাক করুন।' },
  'goals.addBtn': { en: 'Create Savings Goal', bn: 'নতুন লক্ষ্য নির্ধারণ করুন' },
  'goals.target': { en: 'Target Goal', bn: 'লক্ষ্যমাত্রা' },
  'goals.current': { en: 'Current Saved', bn: 'বর্তমান সঞ্চয়' },
  'goals.deadline': { en: 'Target Date', bn: 'শেষ তারিখ' },
  'goals.depositBtn': { en: 'Add Deposit', bn: 'অর্থ জমা করুন' },
  'goals.completed': { en: 'Completed', bn: 'সম্পন্ন হয়েছে' },
  'goals.inProgress': { en: 'In Progress', bn: 'চলমান' },
  'goals.noGoals': { en: 'No active savings goals found.', bn: 'কোনো সক্রিয় সঞ্চয় লক্ষ্য নেই।' },
  'goals.modalTitle': { en: 'Create New Savings Goal', bn: 'নতুন সঞ্চয় লক্ষ্য তৈরি করুন' },
  'goals.depositModalTitle': { en: 'Add Deposit to Goal', bn: 'লক্ষ্যে সঞ্চয় যোগ করুন' },
  'goals.fieldName': { en: 'Goal Name', bn: 'লক্ষ্যের নাম' },
  'goals.fieldTarget': { en: 'Target Amount', bn: 'লক্ষ্যমাত্রা পরিমাণ' },
  'goals.fieldCurrent': { en: 'Initial Saved Amount', bn: 'প্রাথমিক সঞ্চয়' },
  'goals.fieldDeadline': { en: 'Target Deadline', bn: 'শেষ সময়সীমা' },

  // PDF Reports Page
  'reports.title': { en: 'Financial Reports & Analytics', bn: 'আর্থিক রিপোর্ট এবং অ্যানালিটিক্স' },
  'reports.subtitle': { en: 'Generate and download detailed PDF statements and breakdown reports.', bn: 'বিস্তারিত পিডিএফ স্টেটমেন্ট এবং খরচের রিপোর্ট তৈরি ও ডাউনলোড করুন।' },
  'reports.generateBtn': { en: 'Generate PDF Report', bn: 'পিডিএফ রিপোর্ট তৈরি করুন' },
  'reports.selectMonth': { en: 'Select Month', bn: 'মাস নির্বাচন করুন' },
  'reports.selectYear': { en: 'Select Year', bn: 'বছর নির্বাচন করুন' },
  'reports.reportType': { en: 'Report Type', bn: 'রিপোর্টের ধরণ' },
  'reports.downloadPdf': { en: 'Download PDF', bn: 'পিডিএফ ডাউনলোড করুন' },
  'reports.preview': { en: 'Report Preview', bn: 'রিপোর্ট প্রিভিউ' },

  // AI Chatbot & Voice Orb
  'chat.title': { en: 'FinCore AI Financial Advisor', bn: 'ফিনকোর এআই ফাইন্যান্সিয়াল এডভাইজার' },
  'chat.subtitle': { en: 'Ask questions, request wealth advice, and get instant financial insights.', bn: 'যে কোনো প্রশ্ন করুন, আর্থিক পরামর্শ নিন এবং তাৎক্ষণিক ইনসাইট পান।' },
  'chat.placeholder': { en: 'Ask FinCore AI about your expenses, budgets, or savings tips...', bn: 'আপনার খরচ, বাজেট বা সঞ্চয়ের কৌশল সম্পর্কে ফিনকোর এআই-কে জিজ্ঞাসা করুন...' },
  'chat.send': { en: 'Send', bn: 'পাঠান' },
  'chat.speaking': { en: 'FinCore AI is listening...', bn: 'ফিনকোর এআই শুনছে...' },
  'chat.thinking': { en: 'FinCore AI is thinking...', bn: 'ফিনকোর এআই চিন্তা করছে...' },
  'chat.suggestions': { en: 'Quick Prompts', bn: 'দ্রুত প্রশ্নসমূহ' },
  'chat.suggestion1': { en: 'How can I increase my savings rate this month?', bn: 'এই মাসে কীভাবে আমার সঞ্চয়ের হার বাড়ানো সম্ভব?' },
  'chat.suggestion2': { en: 'Summarize my highest spending category.', bn: 'আমার সবচেয়ে বেশি খরচ হওয়া ক্যাটাগরির বিবরণ দাও।' },
  'chat.suggestion3': { en: 'Give me a budget reduction strategy.', bn: 'আমাকে বাজেট কমানোর একটি সহজ পরিকল্পনা দাও।' },

  // Admin Page
  'admin.title': { en: 'Admin System Console', bn: 'অ্যাডমিন সিস্টেম কনসোল' },
  'admin.subtitle': { en: 'Manage system users, background jobs, and system configurations.', bn: 'ব্যবহারকারী, ব্যাকগ্রাউন্ড কাজ ও সিস্টেম কনফিগারেশন পরিচালনা করুন।' },
  'admin.totalUsers': { en: 'Total Users', bn: 'মোট ব্যবহারকারী' },
  'admin.activeSubscriptions': { en: 'Active Subscriptions', bn: 'সক্রিয় সাবস্ক্রিপশন' },
  'admin.systemHealth': { en: 'System Health', bn: 'সিস্টেমের অবস্থা' },

  // Landing Page & Auth
  'landing.welcomeBack': { en: 'Welcome back! 👋', bn: 'পুনরায় স্বাগতম! 👋' },
  'landing.navHome': { en: 'Home', bn: 'হোম' },
  'landing.navAbout': { en: 'About Us', bn: 'আমাদের সম্পর্কে' },
  'landing.navServices': { en: 'Services', bn: 'সার্ভিসসমূহ' },
  'landing.navPages': { en: 'Pages', bn: 'পেজসমূহ' },
  'landing.navBlog': { en: 'Blog', bn: 'ব্লগ' },
  'landing.navContact': { en: 'Contact', bn: 'যোগাযোগ' },
  'landing.goToDashboard': { en: 'Go to Dashboard', bn: 'ড্যাশবোর্ডে যান' },
  'landing.getConsultancy': { en: 'Get Consultancy', bn: 'পরামর্শ নিন' },
  'landing.contactUs': { en: 'Contact Us', bn: 'যোগাযোগ করুন' },
  
  'landing.slide1_sub': { en: 'WELCOME! START MANAGING YOUR WEALTH TODAY', bn: 'স্বাগতম! আজই আপনার অর্থ ও খরচের সুরক্ষা শুরু করুন' },
  'landing.slide1_title': { en: 'Big Opportunity For Your Business Growth', bn: 'আপনার ব্যবসা ও আর্থিক উন্নতির সুবর্ণ সুযোগ' },
  'landing.slide1_desc': { en: 'Take control of your budgets, analyze structural costing, and make smarter decisions with our AI-powered wealth and analytics platform.', bn: 'আপনার বাজেট নিয়ন্ত্রণ করুন, খরচের গঠন বিশ্লেষণ করুন এবং এআই প্ল্যাটফর্মের সাহায্যে স্মার্ট সিদ্ধান্ত নিন।' },
  
  'landing.slide2_sub': { en: 'INTELLIGENT FINANCIAL COGNITION', bn: 'বুদ্ধিমান আর্থিক বিশ্লেষণ ও সিদ্ধান্ত' },
  'landing.slide2_title': { en: 'Analytical Thinking For Smart Savings', bn: 'স্মার্ট সঞ্চয়ের জন্য আধুনিক বিশ্লেষণ' },
  'landing.slide2_desc': { en: 'Speak naturally to FinCore AI to get real-time expense category classification, sandboxed insights, and customized targets.', bn: 'ফিনকোর এআই-এর সাথে বাংলায় সরাসরি কথা বলুন এবং মুহূর্তেই খরচের সঠিক শ্রেণীবিন্যাস ও লক্ষ্য নির্ধারণ করুন।' },

  'landing.slide3_sub': { en: 'SECURE & SECURED SANDBOX', bn: 'সম্পূর্ণ নিরাপদ ও সুরক্ষিত সিস্টেম' },
  'landing.slide3_title': { en: 'Advanced Tracking, Simplified Reporting', bn: 'উন্নত ট্র্যাকিং এবং সহজ রিপোর্ট তৈরি' },
  'landing.slide3_desc': { en: 'Isolated SQL environment, receipt extraction via OCR, and clean formatted PDF summaries ready to print.', bn: 'নিরাপদ ডেটাবেস, ওসিআর রসিদ স্ক্যানিং এবং প্রিন্টযোগ্য নিখুঁত পিডিএফ রিপোর্ট।' },

  'landing.aboutSub': { en: 'ABOUT AMAZING COMPANY', bn: 'আমাদের প্রতিষ্ঠান সম্পর্কে' },
  'landing.aboutTitle': { en: 'We\'re Trusted Professional Consultancy Company', bn: 'আমরা একটি বিশ্বাসযোগ্য পেশাদার ফাইন্যান্সিয়াল প্ল্যাটফর্ম' },
  'landing.aboutDesc': { en: 'The business consultancy company stands as a stalwart beacon of guidance and innovation, offering a multifaceted array of services tailored to propel enterprises toward their zenith.', bn: 'আমাদের প্ল্যাটফর্ম উদ্ভাবনী এআই প্রযুক্তির মাধ্যমে আপনার আয়ের সঠিক ব্যবহার ও খরচের নিখুঁত হিসেব রাখতে সাহায্য করে।' },
  'landing.aboutCheck1': { en: 'Remain flexible and adaptive to swiftly respond to changing market dynamics and client needs.', bn: 'বাজারের পরিবর্তন অনুযায়ী আপনার বাজেটের গতিশীল নিয়ন্ত্রণ নিশ্চিত করুন।' },
  'landing.aboutCheck2': { en: 'Empower clients through knowledge transfer, skill-building, and fostering a culture of self-sufficiency.', bn: 'স্মার্ট সিদ্ধান্ত গ্রহণের মাধ্যমে নিজের সঞ্চয় উত্তরোত্তর বৃদ্ধি করুন।' },
  'landing.callAnytime': { en: 'Call Anytime', bn: 'যে কোনো সময় কল করুন' },
  'landing.makeAppointment': { en: 'Make An Appointment', bn: 'অ্যাপয়েন্টমেন্ট নিন' },

  'landing.demoBadge': { en: 'Live Interaction Preview', bn: 'লাইভ ইন্টারঅ্যাকশন প্রিভিউ' },
  'landing.demoTitle': { en: 'Try FinCore AI in Action', bn: 'ফিনকোর এআই লাইভ ব্যবহার দেখুন' },
  'landing.demoSub': { en: 'Click a sample prompt to see how FinCore AI interprets questions, analyzes expense data, and responds with structured financial insights.', bn: 'একটি নমুনা প্রশ্নে ক্লিক করে দেখুন কীভাবে ফিনকোর এআই হিসাব বিশ্লেষণ করে চমৎকার আর্থিক পরামর্শ প্রদান করে।' },
  'landing.demoSelectPrompt': { en: 'Select a sample prompt to start', bn: 'শুরু করতে একটি প্রশ্ন নির্বাচন করুন' },
  'landing.demoAnalyzing': { en: 'FinCore AI is analyzing...', bn: 'ফিনকোর এআই বিশ্লেষণ করছে...' },

  'landing.videoBadge': { en: 'WATCH COMPANY VIDEO', bn: 'আমাদের পরিচিতি ভিডিও দেখুন' },
  'landing.videoTitle': { en: 'This is your all-in-one financial and wealth platform', bn: 'এটি আপনার অল-ইন-ওয়ান আর্থিক ও সম্পদ ব্যবস্থাপনা প্ল্যাটফর্ম' },
  'landing.watchVideo': { en: 'Watch Our Video', bn: 'আমাদের ভিডিওটি দেখুন' },

  'landing.testimonialsBadge': { en: 'TESTIMONIALS', bn: 'ব্যবহারকারীদের মতামত' },
  'landing.testimonialsTitle': { en: 'What Our Users Said About FinCore AI', bn: 'ফিনকোর এআই সম্পর্কে আমাদের ব্যবহারকারীদের অভিজ্ঞতা' },

  'landing.pricingBadge': { en: 'Pricing & Subscriptions', bn: 'মূল্য এবং সাবস্ক্রিপশন প্ল্যান' },
  'landing.pricingTitle': { en: 'Choose Your Plan', bn: 'আপনার পছন্দের প্ল্যান বাছুন' },
  'landing.pricingSub': { en: 'Upgrade to unlock continuous real-time voice consultations and cloud OCR processing.', bn: 'সব এআই ফিচার, ভয়েস অ্যাসিস্ট্যান্ট এবং ওসিআর স্ক্যানিং আনলক করতে সাবস্ক্রাইব করুন।' },
  'landing.year': { en: 'year', bn: 'বছর' },
  'landing.month': { en: 'month', bn: 'মাস' },
  'landing.bestValue': { en: 'Best Value', bn: 'সেরা অফার' },
  'landing.subscribeNow': { en: 'Subscribe Now', bn: 'এখনই সাবস্ক্রাইব করুন' },
  'landing.getBestValue': { en: 'Get Best Value', bn: 'সেরা অফারটি নিন' },

  'landing.blogBadge': { en: 'RECENT POSTS', bn: 'সাম্প্রতিক ব্লক ও আপডেট' },
  'landing.blogTitle': { en: 'Latest News & Updates', bn: 'সর্বশেষ সংবাদ ও টিপস' },
  'landing.readMore': { en: 'Read More', bn: 'আরও পড়ুন' },

  'landing.footerDesc': { en: 'AI-powered wealth management and financial intelligence consulting. Insights, budgets, and automated reporting.', bn: 'এআই চালিত স্মার্ট অর্থ ও সম্পদ ব্যবস্থাপনা। সঠিক ইনসাইট, বাজেট এবং স্বয়ংক্রিয় রিপোর্ট।' },
  'landing.usefulLinks': { en: 'Useful Links', bn: 'প্রয়োজনীয় লিংক' },
  'landing.resources': { en: 'Resources', bn: 'সম্পদসমূহ' },
  'landing.stayUpdated': { en: 'Stay Updated', bn: 'আপডেট থাকুন' },
  'landing.subscribe': { en: 'Subscribe', bn: 'সাবস্ক্রাইব করুন' },
  'landing.subscribed': { en: 'You\'re subscribed!', bn: 'আপনি সাবস্ক্রাইব করেছেন!' },
  'landing.builtFor': { en: 'Built for smart cost tracking & wealth decisions', bn: 'নিভুল হিসাব ট্র্যাকিং ও সঞ্চয়ের জন্য নির্মিত' },

  'hero.slide1_sub': { en: 'WELCOME! START MANAGING YOUR WEALTH TODAY', bn: 'স্বাগতম! আজই আপনার অর্থ ও খরচের সুরক্ষা শুরু করুন' },
  'hero.slide1_title': { en: 'Big Opportunity For Your Business Growth', bn: 'আপনার ব্যবসা ও আর্থিক উন্নতির সুবর্ণ সুযোগ' },
  'hero.slide1_desc': { en: 'Take control of your budgets, analyze structural costing, and make smarter decisions with our AI-powered wealth and analytics platform.', bn: 'আপনার বাজেট নিয়ন্ত্রণ করুন, খরচের গঠন বিশ্লেষণ করুন এবং এআই প্ল্যাটফর্মের সাহায্যে স্মার্ট সিদ্ধান্ত নিন।' },

  'landing.heroTitle': { en: 'Intelligent Wealth & Expense Tracking', bn: 'বুদ্ধিমান উপায়ে অর্থ ও খরচের নির্ভুল হিসাব' },
  'landing.heroSub': { en: 'Take control of your finances with AI insights, automated budget alerts, smart sheet imports, and voice-assisted wealth management.', bn: 'এআই ইনসাইট, স্বয়ংক্রিয় বাজেট অ্যালার্ট এবং স্মার্ট ভয়েস সহযোগীর সাথে আপনার আর্থিক জীবনকে আরো সমৃদ্ধ করুন।' },
  'landing.getStarted': { en: 'Get Started Free', bn: 'বিনামূল্যে শুরু করুন' },
  'landing.login': { en: 'Sign In', bn: 'সাইন ইন করুন' },
  'landing.register': { en: 'Create Account', bn: 'অ্যাকাউন্ট খুলুন' },
  'auth.loginTitle': { en: 'Welcome Back to FinCore AI', bn: 'ফিনকোর এআই-তে আপনাকে স্বাগতম' },
  'auth.registerTitle': { en: 'Join FinCore AI Wealth Manager', bn: 'ফিনকোর এআই ওয়েল্থ ম্যানেজারে যোগ দিন' },
  'auth.email': { en: 'Email Address', bn: 'ইমেইল অ্যাড্রেস' },
  'auth.username': { en: 'Username', bn: 'ইউজারনেম' },
  'auth.password': { en: 'Password', bn: 'পাসওয়ার্ড' },
  'auth.confirmPassword': { en: 'Confirm Password', bn: 'পাসওয়ার্ড নিশ্চিত করুন' },
  'auth.loginBtn': { en: 'Sign In to Dashboard', bn: 'ড্যাশবোর্ডে প্রবেশ করুন' },
  'auth.registerBtn': { en: 'Create Free Account', bn: 'ফ্রি অ্যাকাউন্ট খুলুন' },
  'auth.noAccount': { en: 'Don\'t have an account?', bn: 'অ্যাকাউন্ট নেই?' },
  'auth.hasAccount': { en: 'Already registered?', bn: 'ইতিমধ্যেই নিবন্ধিত?' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('aura_language') as Language | null;
    if (savedLang === 'bn' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aura_language', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'bn' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = dictionary[key];
    if (entry) {
      return entry[language] || entry.en;
    }
    return fallback !== undefined ? fallback : key;
  };

  const formatCurrency = (amount: number | string, symbol: string = '৳'): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    const formattedNum = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (language === 'bn') {
      return `${symbol} ${toBanglaNumeral(formattedNum)}`;
    }
    return `${symbol} ${formattedNum}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const day = date.getDate();
      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      if (language === 'bn') {
        const bnDay = toBanglaNumeral(day);
        const bnMonth = banglaMonthNames[monthIndex];
        const bnYear = toBanglaNumeral(year);
        return `${bnDay} ${bnMonth}, ${bnYear}`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        toBanglaNumeral: (val) => (language === 'bn' ? toBanglaNumeral(val) : val.toString()),
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
