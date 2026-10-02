// react tools
import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// third party
import { setUtahHeaderSettings } from '@utahdts/utah-design-system-header';

// components
import { FooterSocialMedia } from './components/FooterSocialMedia';
import { About } from './components/websiteContent/About';
import { News } from './components/websiteContent/News';
import { Education } from './components/websiteContent/Education';
import { Example } from './components/websiteContent/Example';
import { Healthcare } from './components/websiteContent/Healthcare';
import { HomeLanding } from './components/websiteContent/HomeLanding';
import { Transportation } from './components/websiteContent/Transportation';

// assets
import logoPng from './assets/Utah-Industry-Icon-Small@2x.png';


export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // there maybe be better way this was just one approach I used
  const buildMenuItem = (title, path) => ({
    title: title,
    isSelected: location.pathname === path, // added this to make the active menu item colored
    actionFunctionUrl: {
      url: path,
      actionFunction: (e) => {
        e.preventDefault();
        navigate(path);
      }
    }
  });

  useEffect(() => {
    setUtahHeaderSettings({
      // title: 'My utah.gov Site',
      title: 'Utah Federal Funding Impact',
      logo: { imageUrl: logoPng },
      domLocationTarget: {
        cssSelector: '#utah-header-target',
      },
      footer: {
        domLocationTarget: {
          cssSelector: '#footer-target',
        }
      },
      mainMenu: {
        menuItems: [
          buildMenuItem('Home', '/'),
          buildMenuItem('Healthcare', '/healthcare'),
          buildMenuItem('Education', '/education'),
          buildMenuItem('Transportation', '/transportation'),
          // buildMenuItem('Example', '/example'),
          buildMenuItem('Federal News', '/news'),
          buildMenuItem('Our Team', '/about'),
          {
            actionUrl: {
              url: 'https://github.com/Josh-Liddell/risk-analytics-website',
              openInNewTab: true,
            },
            title: 'Code Repository',
          },
          {
            actionMenu: [
              {
                actionUrl: {
                  url: 'https://usafacts.org/articles/which-states-contribute-the-most-and-least-to-federal-revenue/',
                  openInNewTab: true,
                },
                title: 'USAFacts',
              },
              {
                actionUrl: {
                  url: 'https://designsystem.utah.gov/library/utahFooter',
                  openInNewTab: true,
                },
                title: 'Utah Footer',
              }
            ],
            title: 'Learn More',
          },
        ],
        title: 'Menu'
      }
    });
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <div>
      <div id="utah-header-target" />
      <Routes>
        <Route path="/" element={<HomeLanding />} />
        <Route path="/healthcare" element={<Healthcare />} />
        <Route path="/education" element={<Education />} />
        <Route path="/transportation" element={<Transportation />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/example" element={<Example />} />
      </Routes>
      <footer aria-label="page">
        <FooterSocialMedia />
        <div id="footer-target" />
      </footer>
    </div>
  )
}
