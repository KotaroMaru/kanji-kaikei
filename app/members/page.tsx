import ClientOnly from "@/components/ClientOnly";
import MembersContent from "@/components/MembersContent";

export default function MembersPage() {
  return (
    <ClientOnly>
      <MembersContent />
    </ClientOnly>
  );
}
