import { IconsWebsite } from './IconsWebsite';

export function Contact() {
  return (
    <div id="contact" className="contact">
      <div className="content-width">
        <IconsWebsite.IconChatBubbles isHidden />
        <h2 className="text-center mt-spacing-l">Reach out!</h2>
        <p>
          Have a question? Got a suggestion? <a href="mailto:caleb.dissel@gmail.com">Contact us</a>.<br />
          Your feedback will help us make our software better!
        </p>
      </div>
    </div>
  );
}
