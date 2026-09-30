import { Link } from 'react-router-dom';

export function WelcomeInfo() {
  return (
    <div className='welcome'>
      <div className="welcome-text">
        <h1 className="my-spacing">Welcome</h1>
        <p>We create tools for assessing impact of budget changes on people and programs</p>
        <p>We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs.</p>
        <p>We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs. We create tools for assessing impact of budget changes on people and programs.</p>
      </div>

      <div className="welcome-cards">
        <Link to="/" className="button button--solid button--primary-color button--large">
          Explore the dashboard<span className="button--icon button--icon-right">
            <span
              className="utds-icon-after-arrow-right icon"
              aria-hidden="true"
            ></span>
          </span>
        </Link>
      </div>
    </div>
  );
}
