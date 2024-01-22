import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import CanvasArea from "./CanvasArea/CanvasArea";
import "./CanvasEditor.css";

export const CanvasEditor = () => {
    return (
        <div className="container">
            <Header/>
            <CanvasArea/>
            <Footer/>
        </div>
    )
}