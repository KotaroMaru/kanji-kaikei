import ClientOnly from "@/components/ClientOnly";
import ExpensesContent from "@/components/ExpensesContent";

export default function ExpensesPage() {
  return (
    <ClientOnly>
      <ExpensesContent />
    </ClientOnly>
  );
}
