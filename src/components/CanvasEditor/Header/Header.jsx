import Menu from "./Menu/Menu";
import LeftMenu_social from "./LeftMenu/LeftMenu_social";
import SaveImage from "./RightMenu/Save";
import "./Header.scss";

const Header = () => {
  return (
    <div>
      <div className="header">
        <LeftMenu_social />
        <Menu />
        <SaveImage />
      </div>
    </div>
  );
};

export default Header;
