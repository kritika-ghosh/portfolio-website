import { useState } from 'react';
import SplashScreen from './components/SplashScreen/SplashScreen';
import Portfolio    from './components/Portfolio/Portfolio';
import './App.css';

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {/* Splash screen — unmounted only after it fully fades out */}
      {!splashDone && (
        <SplashScreen onComplete={() => setSplashDone(true)} />
      )}

      {/* Main portfolio — pre-rendered but invisible until splash exits */}
      <div
        className={`app-content${splashDone ? ' app-content--visible' : ''}`}
        aria-hidden={!splashDone}
      >
        <Portfolio />
      </div>
    </>
  );
};

export default App;
