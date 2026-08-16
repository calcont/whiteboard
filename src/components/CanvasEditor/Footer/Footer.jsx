import ZoomPanel from "./Zoom/ZoomPanel";
import "./Footer.scss";
import Help from "./Help/Help";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import SketchyToggle from "../SketchyToggle/SketchyToggle";

const Footer = () => {
  return (
    <div className="footer">
      <ThemeToggle />
      <SketchyToggle />
      <ZoomPanel />
      <Help />
    </div>
  );
};

export default Footer;
