import ClientOnly from "@/components/ClientOnly";
import AccountingContent from "@/components/AccountingContent";

export default function AccountingPage() {
  return (
    <ClientOnly>
      <AccountingContent />
    </ClientOnly>
  );
}
