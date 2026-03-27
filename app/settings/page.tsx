import ClientOnly from "@/components/ClientOnly";
import SettingsContent from "@/components/SettingsContent";

export default function SettingsPage() {
  return (
    <ClientOnly>
      <SettingsContent />
    </ClientOnly>
  );
}
