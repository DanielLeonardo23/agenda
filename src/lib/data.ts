import type { FinancialData } from './types';

export function getFinancialData(): FinancialData {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const transactions = [
    // Previous month's data
    { id: '1', type: 'income', amount: 16875, date: new Date(currentYear, currentMonth - 1, 1).toISOString(), category: 'Salary', description: 'Monthly Salary' },
    { id: '2', type: 'expense', amount: 4500, date: new Date(currentYear, currentMonth - 1, 2).toISOString(), category: 'Rent', description: 'Apartment Rent' },
    { id: '3', type: 'expense', amount: 320.63, date: new Date(currentYear, currentMonth - 1, 3).toISOString(), category: 'Groceries', description: 'Weekly Groceries' },
    { id: '4', type: 'expense', amount: 187.50, date: new Date(currentYear, currentMonth - 1, 5).toISOString(), category: 'Transport', description: 'Gasoline' },
    { id: '5', type: 'expense', amount: 59.96, date: new Date(currentYear, currentMonth - 1, 10).toISOString(), category: 'Subscriptions', description: 'Streaming Service' },
    { id: '6', type: 'expense', amount: 450, date: new Date(currentYear, currentMonth - 1, 15).toISOString(), category: 'Entertainment', description: 'Concert Tickets' },
    { id: '7', type: 'expense', amount: 282, date: new Date(currentYear, currentMonth - 1, 20).toISOString(), category: 'Utilities', description: 'Electricity Bill' },
    { id: '8', type: 'expense', amount: 168.75, date: new Date(currentYear, currentMonth - 1, 22).toISOString(), category: 'Dining Out', description: 'Dinner with friends' },
    { id: '9', type: 'income', amount: 1125, date: new Date(currentYear, currentMonth - 1, 25).toISOString(), category: 'Freelance', description: 'Web design project' },

    // Current month's data
    { id: '10', type: 'income', amount: 16875, date: new Date(currentYear, currentMonth, 1).toISOString(), category: 'Salary', description: 'Monthly Salary' },
    { id: '11', type: 'expense', amount: 4500, date: new Date(currentYear, currentMonth, 2).toISOString(), category: 'Rent', description: 'Apartment Rent' },
    { id: '12', type: 'expense', amount: 346.13, date: new Date(currentYear, currentMonth, 4).toISOString(), category: 'Groceries', description: 'Weekly Groceries' },
    { id: '13', type: 'expense', amount: 84.38, date: new Date(currentYear, currentMonth, 5).toISOString(), category: 'Subscriptions', description: 'Music Streaming' },
    { id: '14', type: 'expense', amount: 243.75, date: new Date(currentYear, currentMonth, 7).toISOString(), category: 'Transport', description: 'Public transport pass' },
    { id: '15', type: 'expense', amount: 3187.50, date: new Date(currentYear, currentMonth, 8).toISOString(), category: 'Shopping', description: 'New Laptop - unusually high' },
    { id: '16', type: 'expense', amount: 209.06, date: new Date(currentYear, currentMonth, 11).toISOString(), category: 'Dining Out', description: 'Lunch meeting' },
    { id: '17', type: 'expense', amount: 412.50, date: new Date(currentYear, currentMonth, 12).toISOString(), category: 'Groceries', description: 'Bulk shopping' },
  ];

  const recurringPayments = [
    { id: 'rp1', name: 'Rent', amount: 4500, dayOfMonth: 2, category: 'Housing' },
    { id: 'rp2', name: 'Internet Bill', amount: 225, dayOfMonth: 15, category: 'Utilities' },
    { id: 'rp3', name: 'Gym Membership', amount: 150, dayOfMonth: 20, category: 'Health' },
    { id: 'rp4', name: 'Streaming Service', amount: 59.96, dayOfMonth: 10, category: 'Subscriptions' },
  ];

  const budgets = [
    { id: 'b1', category: 'Groceries', limit: 1500, recurring: true },
    { id: 'b2', category: 'Transport', limit: 562.50, recurring: true },
    { id: 'b3', category: 'Entertainment', limit: 750, recurring: true },
    { id: 'b4', category: 'Dining Out', limit: 937.50, recurring: true },
    { id: 'b5', category: 'Shopping', limit: 1125, recurring: true },
    { id: 'b6', category: 'Subscriptions', limit: 187.50, recurring: true },
    { id: 'b7', category: 'Utilities', limit: 562.50, recurring: true },
    { id: 'b8', category: 'Rent', limit: 4500, recurring: true },
  ];

  const currentBalance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  return {
    transactions,
    recurringPayments,
    budgets,
    currentBalance,
  };
}
