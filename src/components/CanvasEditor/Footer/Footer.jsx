import ZoomPanel from "./Zoom/ZoomPanel";
import "./Footer.scss";
import Help from "./Help/Help";

const Footer = () => {
    return (
        <div className="footer upper">
            <ZoomPanel/>
            <Help/>
        </div>
    )
}

export default Footer;