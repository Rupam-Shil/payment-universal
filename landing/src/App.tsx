import { Ambient } from './ui/Ambient';
import { Header } from './components/Header';
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { Matrix } from './sections/Matrix';
import { SwitchDiff } from './sections/SwitchDiff';
import { QuickStart } from './sections/QuickStart';
import { AIContextSection } from './sections/AIContext';
import { Footer } from './sections/Footer';

export function App(): JSX.Element {
  return (
    <>
      <Ambient />
      <div className="grain" aria-hidden />
      <Header />
      <main className="relative z-[2]">
        <Hero />
        <Features />
        <Matrix />
        <SwitchDiff />
        <QuickStart />
        <AIContextSection />
      </main>
      <Footer />
    </>
  );
}
