import { useState } from 'react';
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
import { BottomNav } from './pages/BottomNav';

export default function App() {
  const [view, setView] = useState('login');

  const renderView = () => {
    switch (view) {
      case 'login': return <Login onNext={() => setView('onboarding-1')} />;
      case 'onboarding-1': return <Onboarding1 onNext={() => setView('onboarding-2')} />;
      case 'onboarding-2': return <Onboarding2 onNext={() => setView('onboarding-3')} />;
      case 'onboarding-3': return <Onboarding3 onNext={() => setView('sanctuary')} />;
      case 'sanctuary': return <Sanctuary onNext={() => setView('home')} />;
      case 'home': return <Home navigate={setView} />;
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
