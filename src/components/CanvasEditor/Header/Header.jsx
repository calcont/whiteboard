import Menu from "./Menu/Menu";
import LeftMenu_social from "./LeftMenu/LeftMenu_social";
import SaveImage from "./RightMenu/Save";
import "./Header.scss";

const Header = () => {
    return (
        <div className="header">
            <LeftMenu_social/>
            <Menu/>
            <SaveImage/>
        </div>
    )
}

export default Header;