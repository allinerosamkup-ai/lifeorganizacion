import { useState, useMemo } from 'react';
import { useAuth } from './lib/AuthContext';
import { Login } from './pages/Login';
import { Onboarding1 } from './pages/Onboarding1';
import { Onboarding2 } from './pages/Onboarding2';
import { Onboarding3 } from './pages/Onboarding3';
import { Sanctuary } from './pages/Sanctuary';
import { Home } from './pages/Home';
import { CycleTracker } from './pages/CycleTracker';
import { AIChat } from './pages/AIChat';
import { FocusSession } from './pages/FocusSession';
import { Profile } from './pages/Profile';
import { Agenda } from './pages/Agenda';
import { Tasks } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { Exercises } from './pages/Exercises';
import { BottomNav } from './pages/BottomNav';
import { ToastProvider } from './components/Toast';

const Footer = () => (
  <div className="mt-8 pb-32 pt-8 flex flex-col items-center justify-center gap-4 relative z-10 opacity-80 hover:opacity-100 transition-opacity">
    <div className="w-16 h-1 bg-stone-200 rounded-full mb-2"></div>
    <div className="flex gap-4">
      <button className="text-[10px] font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors">
        PT / EN
      </button>
      <button className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1">
        Airia Pro <span>✨</span>
      </button>
    </div>
    <p className="text-[10px] text-stone-400">© 2026 Airia Flow. Todos os direitos reservados.</p>
  </div>
);

export default function App() {
  const { session, profile, loading } = useAuth();
  const [view, setView] = useState('login');
  const [onboardingData, setOnboardingData] = useState({
    last_period_start: '',
    cycle_length: 28,
    period_duration: 5,
    goals: [] as string[]
  });

  const handleOnboardingNext = (stepData: Record<string, unknown>, nextView: string) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
    setView(nextView);
  };

  // Compute current view based on auth state and intent
  const currentView = useMemo(() => {
    if (loading) return 'loading';

    // Auth flow views: login and onboarding steps
    const isAuthFlow = view === 'login' || view.startsWith('onboarding');

    if (!session) {
      return isAuthFlow ? view : 'login';
    }

    if (!profile) {
      // If profile is still literally loading, wait. But loading boolean is handled above.
      // If we reach here, loading is false but profile is null (e.g. DB error or profile missing).
      // Let's assume they need onboarding so they don't get stuck in an infinite loading screen.
      if (!view.startsWith('onboarding')) {
        return 'onboarding-1';
      }
      return view;
    }

    // If logged in but onboarding not done, force onboarding if not already in it
    if (!profile.onboarding_completed) {
      if (!view.startsWith('onboarding')) {
        return 'onboarding-1';
      }
      return view;
    }

    // If logged in and onboarding done, don't allow auth flow views
    if (profile.onboarding_completed && isAuthFlow) {
      return 'home';
    }

    return view;
  }, [session, profile, loading, view]);

  const renderView = () => {
    if (currentView === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-orange-50">
          <div className="animate-pulse text-stone-500 font-serif text-xl">Loading Sanctuary...</div>
        </div>
      );
    }

    switch (currentView) {
      case 'login': return <Login />;
      case 'onboarding-1': return <Onboarding1 onNext={(data) => handleOnboardingNext(data, 'onboarding-2')} />;
      case 'onboarding-2': return <Onboarding2 onNext={(data) => handleOnboardingNext(data, 'onboarding-3')} />;
      case 'onboarding-3': return <Onboarding3 data={onboardingData} onComplete={() => setView('sanctuary')} />;
      case 'sanctuary': return <Sanctuary onNext={() => setView('home')} />;
      case 'home': return <Home navigate={setView} />;
      case 'agenda': return <Agenda />;
      case 'cycle': return <CycleTracker navigate={setView} />;
      case 'chat': return <AIChat navigate={setView} />;
      case 'focus': return <FocusSession navigate={setView} />;
      case 'profile': return <Profile />;
      case 'tasks': return <Tasks />;
      case 'exercises': return <Exercises />;
      case 'settings': return <Settings navigate={setView} />;
      case 'notifications': return <Notifications navigate={setView} />;
      default: return <Login />;
    }
  };


  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 flex justify-center md:items-start md:py-0 overflow-hidden">
      {/* Tablet/Desktop: sidebar hint on left */}
      <div className="hidden md:flex flex-col items-end justify-center pr-8 flex-1 max-w-xs sticky top-0 h-screen">
        <div className="text-right space-y-2 opacity-60">
          <p className="text-2xl font-serif text-orange-600">Airia Flow</p>
          <p className="text-sm text-stone-500">Produtividade baseada<br />no seu ciclo</p>
        </div>
      </div>

      {/* Main app card — mobile: full screen, tablet+: centered card */}
      <div className="w-full max-w-md md:max-w-[428px] bg-white h-screen relative shadow-2xl flex flex-col overflow-hidden md:rounded-none lg:rounded-2xl lg:my-0 lg:shadow-[0_0_60px_rgba(0,0,0,0.15)]">
        <main key={currentView} className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar animate-fade-in relative">
          <div className="min-h-full flex flex-col">
            {renderView()}
            {/* Show footer on scrollable pages (not auth / onboarding / chat) */}
            {!['login', 'loading', 'chat', 'sanctuary'].includes(currentView) && !currentView.startsWith('onboarding') && (
              <Footer />
            )}
          </div>
        </main>
        <BottomNav current={currentView} navigate={setView} />
        <ToastProvider />
      </div>

      {/* Tablet/Desktop: right side space */}
      <div className="hidden md:flex flex-1 max-w-xs" />
    </div>
  );
}
