import ZoomPanel from "./Zoom/ZoomPanel";
import "./Footer.css";
import Help from "./Help/Help";

const Footer = () => {
    return (
        <div className="footer">
            <ZoomPanel/>
            <Help/>
        </div>
    )
}

export default Footer;