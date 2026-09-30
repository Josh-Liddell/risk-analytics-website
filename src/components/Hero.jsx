import { Button } from '@utahdts/utah-design-system';

export function Hero({ children }) {
  return (
    <div className="hero">
      <div className="home-banner-sidebar">
        {children}
        <div className="hero-buttons">
          <a
            className="button button--outlined"
            href="https://le.utah.gov/~2026/bills/static/HB0249.html"
            target="_blank"
            rel="noreferrer"
          >
            Learn More
            <span className="utds-new-tab-link-a11y">
              <span className="visually-hidden">, opens in a new tab</span>
              <span className="utds-icon-after-external-link" aria-hidden="true"></span>
            </span>
          </a>
          <Button
            appearance="solid"
            color="primary"
            onClick={() => {
              document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Our process
          </Button>
        </div>
      </div>
    </div>
  );
}
