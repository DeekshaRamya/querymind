import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-white h-[100dvh] overflow-hidden flex flex-col text-[#111827] font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-[18px] tracking-tight">Query Minded</span>
          </div>

          <div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[#111827] text-[14px] font-medium hover:text-[#2563EB] transition-colors">
                Login
              </Link>
              <Link href="/signup" className="bg-[#111827] text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-[#374151] transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Hero Section */}
        <section className="text-center max-w-5xl mx-auto w-full">
          <h1 className="text-[48px] sm:text-[56px] md:text-[72px] font-bold tracking-tight leading-[1.1] mb-6 text-[#111827]">
            The intelligent data platform <br className="hidden md:block" /> for modern enterprise.
          </h1>
          <p className="text-[18px] md:text-[20px] text-[#6B7280] mb-10 max-w-2xl mx-auto leading-relaxed">
            Query Minded transforms how your business interacts with data. Use natural language to generate complex SQL, visualize results, and uncover insights instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="bg-[#2563EB] text-white px-6 py-3 rounded-xl text-[16px] font-medium hover:bg-[#1D4ED8] transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
              Start querying now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5E7EB] py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[#6B7280] text-[14px]">
          <p>© {new Date().getFullYear()} Query Minded. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
