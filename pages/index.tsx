import Head from 'next/head';
import RoleSelector from '../components/RoleSelector';

export default function Home() {
  return (
    <>
      <Head>
        <title>Financial Flex</title>
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-6">Selamat Datang di Financial Flex</h1>
        <p className="mb-4">Silakan pilih kategori keuangan Anda:</p>
        <RoleSelector />
      </main>
    </>
  );
}
