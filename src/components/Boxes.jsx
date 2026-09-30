export function Boxes() {
  return (
    <div id="methodology" className="boxes">
      <div className="content-width mt-spacing-l">
        <h2 className="text-center">Our Methods</h2>
        <p>
          Does the thought of choosing what colors to use, how much spacing should be applied to elements and what fonts you should use for
          body copy and headlines cause you stress at the beginning of a project?  No idea where to turn to ensure that your content,
          components and layouts are fully accessible?  Well, the Utah Design System can alleviate that stress without a copay.
        </p>
      </div>

      <div className="home-page__color-card-grid content-width">
        <div className="home-page__color-card home-page__card-wide">
          <h3 className="home-page__color-card-title">Expected Shortfall</h3>
          <p>
            How many design systems provide a color picker to assist you in selecting the primary and secondary colors of your site?
            How many show you in real-time what your components will look like once you&apos;ve selected these colors? Do they tell you if
            your color selections are accessible? With a resounding yes, the Utah Design System does all of this. Starting to feel better?
          </p>
        </div>

        <div className="home-page__color-card home-page__card-narrow home-page__color-card--secondary">
          <h3 className="home-page__color-card-title">Value at Risk</h3>
          <p>
            To simplify and ensure consistency in implementing spacing, the Utah Design System provides predefined classes and variables.
            These classes and variables can be readily used, making the process of managing spacing more convenient and uniform.
          </p>
        </div>

        <div className="home-page__color-card home-page__card-narrow home-page__color-card--secondary">
          <h3 className="home-page__color-card-title">Stress Testing</h3>
          <p>
            Designed for optimal legibility and strict accessibility, the Utah Design System offers carefully selected
            font families and sizing options to elevate your digital content. To streamline your workflow, we provide
            explicit guidelines and recommended font pairings, ensuring a consistent, professional, and on-brand
            experience across all state applications.
          </p>
        </div>

        <div className="home-page__color-card home-page__card-wide">
          <h3 className="home-page__color-card-title">Monte Carlo Simulation</h3>
          <p>
            All web interfaces at the state of Utah should be designed with accessibility in mind.
            Let&apos;s be honest, many times the best accessibility is not always clear, approachable, or easy. Every component in the Utah Design System has
            been designed with an &quot;accessibility first&quot; approach. The goal is to make accessibility more accessible by providing clear guidance on
            every component. Thoughtful consideration has been give to each component to achieve the best possible user experience for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
