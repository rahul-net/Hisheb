import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Payment = { id: string; amount: number; date: string; note?: string };
export type Expense = {
  id: string;
  name: string;
  type: "full" | "advance";
  totalAmount: number;
  payments: Payment[];
  createdAt: string;
};
export type BudgetState = {
  projectName: string;
  totalBudget: number;
  expenses: Expense[];
  theme: "light" | "dark";
};

const STORAGE_KEY = "budget-master:v1";
const DEFAULT_STATE: BudgetState = {
  projectName: "My Budget Project",
  totalBudget: 0,
  expenses: [],
  theme: "dark",
};

function load(): BudgetState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function paidOf(e: Expense) {
  return e.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
}
export function dueOf(e: Expense) {
  return Math.max(0, (Number(e.totalAmount) || 0) - paidOf(e));
}
export function statusOf(e: Expense): "paid" | "partial" | "unpaid" {
  const p = paidOf(e);
  if (p <= 0) return "unpaid";
  if (p >= e.totalAmount) return "paid";
  return "partial";
}

type Ctx = {
  state: BudgetState;
  totals: { paid: number; due: number; remaining: number; count: number };
  setProject: (name: string, budget: number) => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt" | "payments"> & { initialPaid?: number }) => void;
  updateExpense: (id: string, patch: Partial<Pick<Expense, "name" | "totalAmount" | "type">>) => void;
  deleteExpense: (id: string) => void;
  addPayment: (expenseId: string, amount: number, date: string, note?: string) => string | null;
  deletePayment: (expenseId: string, paymentId: string) => void;
  resetAll: () => void;
  toggleTheme: () => void;
};

const BudgetCtx = createContext<Ctx | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme, hydrated]);

  const totals = useMemo(() => {
    const paid = state.expenses.reduce((s, e) => s + paidOf(e), 0);
    const due = state.expenses.reduce((s, e) => s + dueOf(e), 0);
    return {
      paid,
      due,
      remaining: (state.totalBudget || 0) - paid,
      count: state.expenses.length,
    };
  }, [state]);

  const setProject = useCallback((name: string, budget: number) => {
    setState((s) => ({ ...s, projectName: name, totalBudget: Math.max(0, Number(budget) || 0) }));
  }, []);

  const addExpense = useCallback<Ctx["addExpense"]>((e) => {
    setState((s) => {
      const id = uid();
      const payments: Payment[] = [];
      if (e.type === "full") {
        payments.push({ id: uid(), amount: e.totalAmount, date: new Date().toISOString() });
      } else if (e.initialPaid && e.initialPaid > 0) {
        payments.push({
          id: uid(),
          amount: Math.min(e.initialPaid, e.totalAmount),
          date: new Date().toISOString(),
        });
      }
      const exp: Expense = {
        id,
        name: e.name.trim(),
        type: e.type,
        totalAmount: Math.max(0, Number(e.totalAmount) || 0),
        payments,
        createdAt: new Date().toISOString(),
      };
      return { ...s, expenses: [exp, ...s.expenses] };
    });
  }, []);

  const updateExpense = useCallback<Ctx["updateExpense"]>((id, patch) => {
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) =>
        e.id === id
          ? {
              ...e,
              ...patch,
              totalAmount:
                patch.totalAmount !== undefined ? Math.max(0, Number(patch.totalAmount) || 0) : e.totalAmount,
            }
          : e,
      ),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  }, []);

  const addPayment = useCallback<Ctx["addPayment"]>((expenseId, amount, date, note) => {
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) return "Enter a valid amount";
    let err: string | null = null;
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) => {
        if (e.id !== expenseId) return e;
        const due = dueOf(e);
        if (amt > due) {
          err = `Amount exceeds due (${due})`;
          return e;
        }
        return {
          ...e,
          payments: [...e.payments, { id: uid(), amount: amt, date, note: note?.trim() || undefined }],
        };
      }),
    }));
    return err;
  }, []);

  const deletePayment = useCallback((expenseId: string, paymentId: string) => {
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) =>
        e.id === expenseId ? { ...e, payments: e.payments.filter((p) => p.id !== paymentId) } : e,
      ),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...DEFAULT_STATE, theme: state.theme });
  }, [state.theme]);

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));
  }, []);

  const value: Ctx = {
    state,
    totals,
    setProject,
    addExpense,
    updateExpense,
    deleteExpense,
    addPayment,
    deletePayment,
    resetAll,
    toggleTheme,
  };

  return <BudgetCtx.Provider value={value}>{children}</BudgetCtx.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetCtx);
  if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
  return ctx;
}

export const DELETE_PIN = "1997";

export function formatMoney(n: number) {
  const v = Number(n) || 0;
  return "৳" + toBnDigits(new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v));
}

export function formatDate(iso: string) {
  try {
    return toBnDigits(
      new Date(iso).toLocaleDateString("bn-BD", { day: "2-digit", month: "long", year: "numeric" }),
    );
  } catch {
    return iso;
  }
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function toBnDigits(s: string | number) {
  return String(s).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function statusLabel(s: "paid" | "partial" | "unpaid") {
  return s === "paid" ? "পরিশোধিত" : s === "partial" ? "আংশিক" : "বকেয়া";
}