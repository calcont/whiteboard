import Menu from "./Menu/Menu";
import LeftMenu from "./LeftMenu/LeftMenu";
import Grid from "@mui/material/Grid";
import "./Header.css";

const Header = () => {
    return (
        <div className="header">
            <LeftMenu/>
            <Menu/>
        </div>
    )
}

export default Header;