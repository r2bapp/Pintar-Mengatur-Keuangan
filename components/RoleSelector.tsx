import { useRouter } from 'next/router';
import { useRole } from '../context/RoleContext';

const roles = [
  { label: "Keluarga", value: "keluarga" },
  { label: "Pribadi", value: "pribadi" },
  { label: "Siswa/Mahasiswa", value: "siswa" },
  { label: "Pedagang", value: "pedagang" },
  { label: "UMKM", value: "umkm" },
  { label: "Pengusaha", value: "pengusaha" },
  { label: "Pebisnis", value: "pebisnis" },
];

export default function RoleSelector() {
  const { setRole } = useRole();
  const router = useRouter();

  const handleSelect = (role: string) => {
    setRole(role as any);
    router.push('/dashboard');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => handleSelect(r.value)}
          className="bg-white border shadow hover:shadow-lg transition px-4 py-3 rounded-xl text-center font-medium"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
