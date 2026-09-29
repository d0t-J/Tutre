import TopNavbar from './TopNavbar';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-[#FDFBF7] font-sans selection:bg-primary-100 overflow-hidden">
      
      {/* Top Navbar */}
      <TopNavbar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
      
    </div>
  );
}
