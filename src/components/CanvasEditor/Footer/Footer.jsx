import ZoomPanel from "./Zoom/ZoomPanel";
import "./Footer.scss";
import Help from "./Help/Help";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

const Footer = () => {
  return (
    <div className="footer">
      <ThemeToggle />
      <ZoomPanel />
      <Help />
    </div>
  );
};

export default Footer;
