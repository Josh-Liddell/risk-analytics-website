import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Hero } from '../Hero';
import { Boxes } from '../Boxes';
import { Contact } from '../Contact';
import { WelcomeInfo } from '../WelcomeInfo';

export function About() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <main id="main-content" className="landing-page-template">
      <Hero>
        <h1>Computational Risk Analytics</h1>
        <p>For data informed governance</p>
      </Hero>
      <WelcomeInfo />
      <Boxes />
      <Contact />
    </main>
  );
}
