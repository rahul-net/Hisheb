import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  ChevronRight,
  CreditCard,
  Edit3,
  FileDown,
  History,
  LayoutDashboard,
  Moon,
  Plus,
  Receipt,
  Settings,
  Sun,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  dueOf,
  formatDate,
  formatMoney,
  paidOf,
  statusLabel,
  statusOf,
  toBnDigits,
  useBudget,
  type Expense,
} from "@/lib/budget-store";
import { Modal } from "@/components/Modal";
import { PinDialog } from "@/components/PinDialog";
import { generatePdfReport } from "@/lib/pdf-report";

type Tab = "dashboard" | "expenses" | "due" | "settings";

export function BudgetApp() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [viewing, setViewing] = useState<Expense | null>(null);

  return (
    <div className="min-h-screen pb-28">
      <Header tab={tab} />
      <main className="mx-auto max-w-3xl px-4 pt-4">
        {tab === "dashboard" && (
          <Dashboard onOpenAdd={() => setShowAdd(true)} onOpenExpense={setViewing} setTab={setTab} />
        )}
        {tab === "expenses" && (
          <ExpensesPage
            onOpenAdd={() => setShowAdd(true)}
            onEdit={(e) => setEditing(e)}
            onView={(e) => setViewing(e)}
          />
        )}
        {tab === "due" && <DuePage onView={(e) => setViewing(e)} />}
        {tab === "settings" && <SettingsPage />}
      </main>

      <BottomNav tab={tab} setTab={setTab} onAdd={() => setShowAdd(true)} />

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
      {editing && <EditExpenseModal expense={editing} onClose={() => setEditing(null)} />}
      {viewing && <ExpenseDetailModal expense={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

const TAB_TITLE: Record<Tab, string> = {
  dashboard: "ড্যাশবোর্ড",
  expenses: "খরচসমূহ",
  due: "বকেয়া",
  settings: "সেটিংস",
};

function Header({ tab }: { tab: Tab }) {
  const { state } = useBudget();
  return (
    <header className="sticky top-0 z-30 glass border-b border-glass-border">
      <div className="mx-auto max-w-3xl px-4 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">বাজেট মাস্টার</p>
          <h1 className="truncate text-xl font-bold">{TAB_TITLE[tab]}</h1>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[160px]">
            {state.projectName}
          </span>
          <div className="h-10 w-10 grid place-items-center rounded-2xl gradient-primary text-white shadow-elegant">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}

function Dashboard({
  onOpenAdd,
  onOpenExpense,
  setTab,
}: {
  onOpenAdd: () => void;
  onOpenExpense: (e: Expense) => void;
  setTab: (t: Tab) => void;
}) {
  const { state, totals } = useBudget();
  const recent = state.expenses.slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-6 text-white shadow-elegant">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-white/70">অবশিষ্ট বাজেট</p>
          <p className="mt-1 text-4xl font-black tracking-tight">{formatMoney(totals.remaining)}</p>
          <p className="mt-1 text-sm text-white/80">
            মোট {formatMoney(state.totalBudget)}-এর মধ্যে
          </p>
          <ProgressBar paid={totals.paid} total={state.totalBudget} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<ArrowUpCircle className="h-5 w-5" />} label="মোট পরিশোধিত" value={formatMoney(totals.paid)} tone="success" />
        <StatCard icon={<ArrowDownCircle className="h-5 w-5" />} label="মোট বকেয়া" value={formatMoney(totals.due)} tone="warm" onClick={() => setTab("due")} />
        <StatCard icon={<Receipt className="h-5 w-5" />} label="মোট খরচ" value={toBnDigits(totals.count)} tone="accent" onClick={() => setTab("expenses")} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="মোট বাজেট" value={formatMoney(state.totalBudget)} tone="primary" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenAdd}
          className="glass rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-primary text-white">
            <Plus className="h-5 w-5" />
          </div>
          <div className="min-w-0 text-left">
            <p className="font-semibold">নতুন খরচ</p>
            <p className="text-xs text-muted-foreground">সম্পূর্ণ অথবা অগ্রিম</p>
          </div>
        </button>
        <button
          onClick={() => generatePdfReport(state)}
          className="glass rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-accent text-white">
            <FileDown className="h-5 w-5" />
          </div>
          <div className="min-w-0 text-left">
            <p className="font-semibold">PDF রিপোর্ট</p>
            <p className="text-xs text-muted-foreground">প্রিমিয়াম A4 এক্সপোর্ট</p>
          </div>
        </button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">সাম্প্রতিক</h2>
          {state.expenses.length > 4 && (
            <button onClick={() => setTab("expenses")} className="text-xs font-semibold text-primary">
              সব দেখুন
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="এখনো কোনো খরচ নেই"
            description="সেটিংস থেকে আপনার মোট বাজেট নির্ধারণ করুন, তারপর প্রথম খরচ যোগ করুন।"
            cta={
              <button
                onClick={onOpenAdd}
                className="rounded-full gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-elegant"
              >
                খরচ যোগ করুন
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {recent.map((e) => (
              <ExpenseRow key={e.id} expense={e} onClick={() => onOpenExpense(e)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProgressBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;
  return (
    <div className="mt-4">
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-white/80">{toBnDigits(pct.toFixed(0))}% ব্যবহৃত</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "accent" | "warm" | "success";
  onClick?: () => void;
}) {
  const toneClass = {
    primary: "gradient-primary",
    accent: "gradient-accent",
    warm: "gradient-warm",
    success: "bg-[oklch(0.7_0.17_155)]",
  }[tone];
  return (
    <button
      onClick={onClick}
      className="glass rounded-2xl p-4 text-left active:scale-[0.98] transition"
    >
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl text-white ${toneClass}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-bold">{value}</p>
    </button>
  );
}

function ExpenseRow({ expense, onClick }: { expense: Expense; onClick: () => void }) {
  const paid = paidOf(expense);
  const due = dueOf(expense);
  const status = statusOf(expense);
  const pct = expense.totalAmount > 0 ? (paid / expense.totalAmount) * 100 : 0;
  const statusTone = {
    paid: "bg-[oklch(0.7_0.17_155)]/15 text-[oklch(0.55_0.18_155)]",
    partial: "bg-[oklch(0.78_0.16_75)]/15 text-[oklch(0.55_0.18_75)]",
    unpaid: "bg-destructive/15 text-destructive",
  }[status];

  return (
    <button
      onClick={onClick}
      className="glass w-full rounded-2xl p-4 text-left active:scale-[0.99] transition"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{expense.name}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone}`}>
              {statusLabel(status)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {expense.type === "full" ? "সম্পূর্ণ পরিশোধ" : "অগ্রিম + বকেয়া"} · {toBnDigits(expense.payments.length)} টি পেমেন্ট
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Field label="মোট" value={formatMoney(expense.totalAmount)} />
        <Field label="পরিশোধিত" value={formatMoney(paid)} tone="success" />
        <Field label="বকেয়া" value={formatMoney(due)} tone="warm" />
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </button>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "success" | "warm" }) {
  const color = tone === "success" ? "text-[oklch(0.55_0.18_155)]" : tone === "warm" ? "text-[oklch(0.55_0.18_35)]" : "";
  return (
    <div>
      <p className="text-[10px] tracking-wider text-muted-foreground">{label}</p>
      <p className={`truncate font-bold ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-8 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-white">
        <Receipt className="h-6 w-6" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

function ExpensesPage({
  onOpenAdd,
  onEdit,
  onView,
}: {
  onOpenAdd: () => void;
  onEdit: (e: Expense) => void;
  onView: (e: Expense) => void;
}) {
  const { state } = useBudget();
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => state.expenses.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())),
    [state.expenses, q],
  );
  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="খরচ খুঁজুন..."
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={onOpenAdd}
          className="shrink-0 rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-elegant"
        >
          <Plus className="inline h-4 w-4" /> যোগ
        </button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="কোনো খরচ নেই" description="শুরু করতে নতুন একটি খরচ যোগ করুন।" />
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="space-y-2">
              <ExpenseRow expense={e} onClick={() => onView(e)} />
              <div className="grid grid-cols-3 gap-2 px-1">
                <ActionBtn icon={<History className="h-4 w-4" />} label="হিস্টোরি" onClick={() => onView(e)} />
                <ActionBtn icon={<Edit3 className="h-4 w-4" />} label="এডিট" onClick={() => onEdit(e)} />
                <DeleteExpenseBtn expense={e} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, tone }: { icon: React.ReactNode; label: string; onClick: () => void; tone?: "danger" }) {
  const cls = tone === "danger" ? "text-destructive" : "";
  return (
    <button
      onClick={onClick}
      className={`glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition ${cls}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DeleteExpenseBtn({ expense }: { expense: Expense }) {
  const { deleteExpense } = useBudget();
  const [pin, setPin] = useState(false);
  return (
    <>
      <ActionBtn icon={<Trash2 className="h-4 w-4" />} label="ডিলিট" tone="danger" onClick={() => setPin(true)} />
      <PinDialog
        open={pin}
        title="খরচ মুছবেন?"
        description={`"${expense.name}" মুছে ফেলতে পিন দিন।`}
        onCancel={() => setPin(false)}
        onConfirm={() => {
          deleteExpense(expense.id);
          setPin(false);
        }}
      />
    </>
  );
}

function DuePage({ onView }: { onView: (e: Expense) => void }) {
  const { state, totals } = useBudget();
  const due = state.expenses.filter((e) => dueOf(e) > 0);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl gradient-warm p-6 text-white shadow-elegant">
        <p className="text-xs uppercase tracking-widest text-white/80">মোট বকেয়া</p>
        <p className="mt-1 text-4xl font-black">{formatMoney(totals.due)}</p>
        <p className="mt-1 text-sm text-white/80">{toBnDigits(due.length)} টি বকেয়া পেমেন্ট</p>
      </div>
      {due.length === 0 ? (
        <EmptyState title="সব পরিশোধিত!" description="আপনার কোনো বকেয়া নেই। দারুণ!" />
      ) : (
        <div className="space-y-3">
          {due.map((e) => (
            <button
              key={e.id}
              onClick={() => onView(e)}
              className="glass w-full rounded-2xl p-4 text-left active:scale-[0.99] transition"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(paidOf(e))} পরিশোধিত / {formatMoney(e.totalAmount)} মোট
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">বকেয়া</p>
                  <p className="text-lg font-black text-[oklch(0.55_0.18_35)]">{formatMoney(dueOf(e))}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  const { state, setProject, resetAll, toggleTheme } = useBudget();
  const [name, setName] = useState(state.projectName);
  const [budget, setBudget] = useState(String(state.totalBudget || ""));
  const [saved, setSaved] = useState(false);
  const [pin, setPin] = useState(false);

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold">প্রজেক্ট</h3>
          <p className="text-xs text-muted-foreground">প্রজেক্টের নাম ও মোট বাজেট আপডেট করুন।</p>
        </div>
        <LabeledInput label="প্রজেক্টের নাম" value={name} onChange={setName} placeholder="আমার বাজেট প্রজেক্ট" />
        <LabeledInput
          label="মোট বাজেট"
          value={budget}
          onChange={(v) => setBudget(v.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          placeholder="১০০০০০"
        />
        <button
          onClick={() => {
            setProject(name.trim() || "আমার বাজেট প্রজেক্ট", Number(budget) || 0);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          className="w-full rounded-2xl gradient-primary py-3 font-semibold text-white shadow-elegant active:scale-95 transition"
        >
          {saved ? "সংরক্ষিত ✓" : "সংরক্ষণ করুন"}
        </button>
      </div>

      <div className="glass rounded-2xl p-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">থিম</h3>
          <p className="text-xs text-muted-foreground">ডার্ক ও লাইট মোড পরিবর্তন করুন।</p>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="থিম পরিবর্তন"
          className="shrink-0 grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-white shadow-elegant"
        >
          {state.theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="font-bold">এক্সপোর্ট</h3>
        <button
          onClick={() => generatePdfReport(state)}
          className="w-full rounded-2xl gradient-accent py-3 font-semibold text-white shadow-elegant active:scale-95 transition flex items-center justify-center gap-2"
        >
          <FileDown className="h-5 w-5" /> PDF রিপোর্ট ডাউনলোড
        </button>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3 border-destructive/30">
        <div>
          <h3 className="font-bold text-destructive">বিপজ্জনক অঞ্চল</h3>
          <p className="text-xs text-muted-foreground">
            রিসেট করলে সমস্ত খরচ, পেমেন্ট ও বাজেট মুছে যাবে। পিন প্রয়োজন।
          </p>
        </div>
        <button
          onClick={() => setPin(true)}
          className="w-full rounded-2xl gradient-warm py-3 font-semibold text-white shadow-elegant active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Trash2 className="h-5 w-5" /> প্রজেক্ট রিসেট
        </button>
      </div>

      <PinDialog
        open={pin}
        title="প্রজেক্ট রিসেট করবেন?"
        description="সমস্ত খরচ ও পেমেন্ট মুছে যাবে।"
        onCancel={() => setPin(false)}
        onConfirm={() => {
          resetAll();
          setName("আমার বাজেট প্রজেক্ট");
          setBudget("");
          setPin(false);
        }}
      />

      <p className="text-center text-xs text-muted-foreground py-4">
        বাজেট মাস্টার · v১.০ · অফলাইন রেডি
      </p>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "text" | "numeric";
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-1 w-full rounded-2xl border border-glass-border bg-card/60 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

function BottomNav({ tab, setTab, onAdd }: { tab: Tab; setTab: (t: Tab) => void; onAdd: () => void }) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "হোম", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "expenses", label: "খরচ", icon: <Receipt className="h-5 w-5" /> },
    { id: "due", label: "বকেয়া", icon: <CalendarClock className="h-5 w-5" /> },
    { id: "settings", label: "সেটিংস", icon: <Settings className="h-5 w-5" /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl px-3 pb-3">
        <div className="glass relative grid grid-cols-5 items-center rounded-3xl py-2 shadow-elegant">
          {items.slice(0, 2).map((it) => (
            <NavBtn key={it.id} {...it} active={tab === it.id} onClick={() => setTab(it.id)} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={onAdd}
              aria-label="নতুন খরচ"
              className="grid h-14 w-14 -mt-8 place-items-center rounded-full gradient-primary text-white shadow-elegant active:scale-95 transition"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          {items.slice(2).map((it) => (
            <NavBtn key={it.id} {...it} active={tab === it.id} onClick={() => setTab(it.id)} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-1.5 transition ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <span className={active ? "scale-110 transition" : ""}>{icon}</span>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addExpense } = useBudget();
  const [name, setName] = useState("");
  const [type, setType] = useState<"full" | "advance">("full");
  const [amount, setAmount] = useState("");
  const [initial, setInitial] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setType("full");
    setAmount("");
    setInitial("");
    setErr(null);
  };

  const submit = () => {
    const total = Number(amount);
    if (!name.trim()) return setErr("নাম দিন");
    if (!isFinite(total) || total <= 0) return setErr("সঠিক পরিমাণ দিন");
    const init = Number(initial) || 0;
    if (type === "advance" && init > total) return setErr("অগ্রিম মোট টাকার চেয়ে বেশি হতে পারবে না");
    addExpense({ name, type, totalAmount: total, initialPaid: type === "advance" ? init : undefined });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="নতুন খরচ">
      <div className="space-y-4">
        <LabeledInput label="খরচের নাম" value={name} onChange={setName} placeholder="যেমন: মসলা, DJ প্রোগ্রাম" />
        <div>
          <span className="text-xs font-semibold text-muted-foreground">ধরন</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <TypePill active={type === "full"} onClick={() => setType("full")} label="সম্পূর্ণ পরিশোধ" desc="একবারেই পরিশোধ" />
            <TypePill active={type === "advance"} onClick={() => setType("advance")} label="অগ্রিম + বকেয়া" desc="ধাপে ধাপে পেমেন্ট" />
          </div>
        </div>
        <LabeledInput label="মোট পরিমাণ" value={amount} onChange={(v) => setAmount(v.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="১০০০০" />
        {type === "advance" && (
          <LabeledInput
            label="প্রথম অগ্রিম (ঐচ্ছিক)"
            value={initial}
            onChange={(v) => setInitial(v.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="২০০০"
          />
        )}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button
          onClick={submit}
          className="w-full rounded-2xl gradient-primary py-3.5 font-semibold text-white shadow-elegant active:scale-95 transition"
        >
          সংরক্ষণ করুন
        </button>
      </div>
    </Modal>
  );
}

function TypePill({ active, onClick, label, desc }: { active: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition ${
        active ? "border-transparent gradient-primary text-white shadow-elegant" : "border-glass-border bg-card/40 hover:bg-card/70"
      }`}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className={`text-[11px] ${active ? "text-white/80" : "text-muted-foreground"}`}>{desc}</p>
    </button>
  );
}

function EditExpenseModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const { updateExpense } = useBudget();
  const [name, setName] = useState(expense.name);
  const [amount, setAmount] = useState(String(expense.totalAmount));
  const [err, setErr] = useState<string | null>(null);
  const paid = paidOf(expense);

  const submit = () => {
    const total = Number(amount);
    if (!name.trim()) return setErr("নাম দিন");
    if (!isFinite(total) || total <= 0) return setErr("সঠিক পরিমাণ দিন");
    if (total < paid) return setErr(`মোট পরিশোধিত ${formatMoney(paid)}-এর চেয়ে কম হতে পারবে না`);
    updateExpense(expense.id, { name: name.trim(), totalAmount: total });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="খরচ সম্পাদনা">
      <div className="space-y-4">
        <LabeledInput label="খরচের নাম" value={name} onChange={setName} />
        <LabeledInput label="মোট পরিমাণ" value={amount} onChange={(v) => setAmount(v.replace(/[^\d.]/g, ""))} inputMode="decimal" />
        <p className="text-xs text-muted-foreground">ইতিমধ্যে পরিশোধিত: {formatMoney(paid)}</p>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button
          onClick={submit}
          className="w-full rounded-2xl gradient-primary py-3.5 font-semibold text-white shadow-elegant active:scale-95 transition"
        >
          সংরক্ষণ
        </button>
      </div>
    </Modal>
  );
}

function ExpenseDetailModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const { state, addPayment, deletePayment } = useBudget();
  const live = state.expenses.find((e) => e.id === expense.id) || expense;
  const paid = paidOf(live);
  const due = dueOf(live);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<string | null>(null);

  const sorted = [...live.payments].sort((a, b) => b.date.localeCompare(a.date));

  const submit = () => {
    setErr(null);
    const e = addPayment(live.id, Number(amount), new Date(date).toISOString(), note);
    if (e) {
      // Translate common errors
      if (e.startsWith("Enter")) return setErr("সঠিক পরিমাণ দিন");
      if (e.startsWith("Amount exceeds")) return setErr(`পরিমাণ বকেয়ার (${formatMoney(due)}) চেয়ে বেশি`);
      return setErr(e);
    }
    setAmount("");
    setNote("");
  };

  return (
    <Modal open onClose={onClose} title={live.name}>
      <div className="space-y-4">
        <div className="rounded-2xl gradient-primary p-4 text-white">
          <p className="text-xs uppercase tracking-widest text-white/70">বর্তমান বকেয়া</p>
          <p className="mt-1 text-3xl font-black">{formatMoney(due)}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-white/70">মোট</p>
              <p className="font-bold">{formatMoney(live.totalAmount)}</p>
            </div>
            <div>
              <p className="text-white/70">পরিশোধিত</p>
              <p className="font-bold">{formatMoney(paid)}</p>
            </div>
            <div>
              <p className="text-white/70">স্ট্যাটাস</p>
              <p className="font-bold">{statusLabel(statusOf(live))}</p>
            </div>
          </div>
        </div>

        {due > 0 && (
          <div className="glass rounded-2xl p-4 space-y-3">
            <h4 className="font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> পেমেন্ট যোগ করুন
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="পরিমাণ" value={amount} onChange={(v) => setAmount(v.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder={String(due)} />
              <LabeledInput label="তারিখ" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
            </div>
            <LabeledInput label="নোট (ঐচ্ছিক)" value={note} onChange={setNote} placeholder="ক্যাশ, ব্যাংক…" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button
              onClick={submit}
              className="w-full rounded-2xl gradient-accent py-3 font-semibold text-white shadow-elegant active:scale-95 transition"
            >
              পেমেন্ট সংরক্ষণ
            </button>
          </div>
        )}

        <div>
          <h4 className="mb-2 font-bold flex items-center gap-2">
            <History className="h-4 w-4" /> পেমেন্ট হিস্টোরি
          </h4>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">এখনো কোনো পেমেন্ট নেই।</p>
          ) : (
            <ol className="space-y-2">
              {sorted.map((p) => (
                <li
                  key={p.id}
                  className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{formatMoney(p.amount)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(p.date)}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setPinFor(p.id)}
                    aria-label="পেমেন্ট ডিলিট"
                    className="shrink-0 grid h-9 w-9 place-items-center rounded-full bg-destructive/15 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      <PinDialog
        open={!!pinFor}
        title="পেমেন্ট মুছবেন?"
        description="এই পেমেন্ট হিস্টোরি থেকে মুছে ফেলতে পিন দিন।"
        onCancel={() => setPinFor(null)}
        onConfirm={() => {
          if (pinFor) deletePayment(live.id, pinFor);
          setPinFor(null);
        }}
      />
    </Modal>
  );
}