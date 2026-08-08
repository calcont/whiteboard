import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import CanvasArea from "./CanvasArea/CanvasArea";
import PropertiesPanel from "./PropertiesPanel/PropertiesPanel";
import "./CanvasEditor.scss";

export const CanvasEditor = () => {
  return (
    <>
      <div className="container">
        <Header />
        <PropertiesPanel />
        <Footer />
      </div>
      <div className="canvas-editor__container">
        <CanvasArea />
      </div>
    </>
  );
};
