export function Footer() {
  return (
    <footer className="bg-navy-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img src="/logo.png" alt="Logo" className="h-12 w-12" />
            <span className="text-sm font-medium">KeuanganPintar Pro</span>
          </div>
          <p className="text-xs text-gray-300">
            Dikembangkan oleh <span className="font-semibold text-gold-400">Bikin Teknologi Asik</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">© 2025 KeuanganPintar Pro. Copyright (c).</p>
        </div>
      </div>
    </footer>
  )
}
