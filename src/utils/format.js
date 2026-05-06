export const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value ?? 0)

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const currentMonth = () => new Date().getMonth() + 1
export const currentYear = () => new Date().getFullYear()

export const DEFAULT_EXPENSES = [
  { name: 'Arriendo', amount: 700000, category: 'Vivienda', accountType: 'fixedExpenses', expenseType: 'fijo', isActive: true, isRecurring: true },
  { name: 'Agua', amount: 50000, category: 'Servicios', accountType: 'fixedExpenses', expenseType: 'fijo', isActive: true, isRecurring: true },
  { name: 'Luz', amount: 50000, category: 'Servicios', accountType: 'fixedExpenses', expenseType: 'fijo', isActive: true, isRecurring: true },
  { name: 'Gas', amount: 20000, category: 'Servicios', accountType: 'fixedExpenses', expenseType: 'fijo', isActive: true, isRecurring: true },
  { name: 'Internet', amount: 55000, category: 'Servicios', accountType: 'fixedExpenses', expenseType: 'fijo', isActive: true, isRecurring: true },
  { name: 'Celular', amount: 47000, category: 'Servicios', accountType: 'fixedExpenses', expenseType: 'fijo', isActive: true, isRecurring: true },
  { name: 'Transporte', amount: 180000, category: 'Transporte', accountType: 'fixedExpenses', expenseType: 'fijo', isActive: true, isRecurring: true },
  { name: 'Alimentación', amount: 800000, category: 'Alimentación', accountType: 'dailySpending', expenseType: 'variable', isActive: true, isRecurring: true },
  { name: 'Deudas', amount: 0, category: 'Deudas', accountType: 'fixedExpenses', expenseType: 'deuda', isActive: false, isRecurring: true },
  { name: 'Suscripciones', amount: 0, category: 'Ocio', accountType: 'dailySpending', expenseType: 'fijo', isActive: false, isRecurring: true },
  { name: 'Aseo personal', amount: 200000, category: 'Personal', accountType: 'dailySpending', expenseType: 'variable', isActive: true, isRecurring: true },
  { name: 'Insumos hogar', amount: 200000, category: 'Hogar', accountType: 'dailySpending', expenseType: 'variable', isActive: true, isRecurring: true },
  { name: 'Otros', amount: 0, category: 'Otros', accountType: 'dailySpending', expenseType: 'variable', isActive: false, isRecurring: false },
]

export const CATEGORIES = [
  'Vivienda', 'Servicios', 'Transporte', 'Alimentación', 'Salud',
  'Educación', 'Ocio', 'Personal', 'Hogar', 'Deudas', 'Ahorro', 'Otros',
]

export const ACCOUNT_TYPES = [
  { value: 'fixedExpenses', label: 'Gastos fijos' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'dailySpending', label: 'Gasto diario' },
]

export const EXPENSE_TYPES = [
  { value: 'fijo', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
  { value: 'deuda', label: 'Deuda' },
  { value: 'ahorro', label: 'Ahorro' },
]

export const PAYMENT_METHODS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Nequi', 'Daviplata', 'Otro']
