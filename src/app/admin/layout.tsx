import { ProveedorConfirmar } from "@/components/admin/Confirmar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProveedorConfirmar>{children}</ProveedorConfirmar>;
}
