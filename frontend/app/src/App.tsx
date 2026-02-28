import { useState, useEffect, useMemo } from 'react';
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
import { BottomNav } from './pages/BottomNav';

export default function App() {
  const { session, profile, loading } = useAuth();
  const [view, setView] = useState('login');
  const [onboardingData, setOnboardingData] = useState({
    last_period_start: '',
    cycle_length: 28,
    period_duration: 5,
    goals: [] as string[]
  });

  const handleOnboardingNext = (stepData: any, nextView: string) => {
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
      case 'login': return <Login onNext={() => setView('onboarding-1')} />;
      case 'onboarding-1': return <Onboarding1 onNext={(data) => handleOnboardingNext(data, 'onboarding-2')} />;
      case 'onboarding-2': return <Onboarding2 onNext={(data) => handleOnboardingNext(data, 'onboarding-3')} />;
      case 'onboarding-3': return <Onboarding3 data={onboardingData} onComplete={() => setView('sanctuary')} />;
      case 'sanctuary': return <Sanctuary onNext={() => setView('home')} />;
      case 'home': return <Home navigate={setView} />;
      case 'agenda': return <Agenda navigate={setView} />;
      case 'cycle': return <CycleTracker navigate={setView} />;
      case 'chat': return <AIChat navigate={setView} />;
      case 'focus': return <FocusSession navigate={setView} />;
      case 'profile': return <Profile />;
      default: return <Login onNext={() => setView('onboarding-1')} />;
    }
  };


  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex justify-center overflow-hidden">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-y-auto overflow-x-hidden">
        {renderView()}
        <BottomNav current={view} navigate={setView} />
      </div>
    </div>
  );
}
