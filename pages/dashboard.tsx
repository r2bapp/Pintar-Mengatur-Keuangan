import { useRole } from "../context/RoleContext";
import { useEffect } from "react";
import { useRouter } from "next/router";
import FamilyFinanceForm from "../components/forms/FamilyFinanceForm";

export default function Dashboard() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!role) router.push("/");
  }, [role]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard {role ? `(${role})` : ''}</h1>

      {role === 'keluarga' && <FamilyFinanceForm />}
      {/* nanti tambahkan kondisi untuk role lainnya */}
    </main>
  );
}
