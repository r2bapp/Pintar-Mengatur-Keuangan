import { useRole } from "../context/RoleContext";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!role) router.push("/");
  }, [role]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard {role ? `(${role})` : ''}</h1>
      <p>Selanjutnya, kita akan menampilkan form dinamis sesuai pilihan role ini.</p>
    </main>
  );
}
