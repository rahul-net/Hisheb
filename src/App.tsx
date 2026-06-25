import { BudgetProvider } from "./lib/budget-store";
import { BudgetApp } from "./routes/index";

export function App() {
  return (
    <BudgetProvider>
      <BudgetApp />
    </BudgetProvider>
  );
}