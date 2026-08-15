import { fabric } from "fabric";
import {
  handleTextEditingEntered,
  handleTextEditingExited,
} from "./textEventHandler";

const makeCanvas = () => new fabric.Canvas(document.createElement("canvas"));

test("entering text editing disables selection and hides the border", () => {
  const c = makeCanvas();
  const t = new fabric.Textbox("x", { width: 40 });
  c.add(t);
  handleTextEditingEntered(c, { target: t });
  expect(c.selection).toBe(false);
  expect(t.hasBorders).toBe(false);
});

test("exiting text editing RE-ENABLES selection (regression: box-select died after edit)", () => {
  const c = makeCanvas();
  const t = new fabric.Textbox("hello", { width: 40 });
  c.add(t);
  c.selection = false; // as left by entering edit
  handleTextEditingExited(c, { target: t });
  expect(c.selection).toBe(true);
  expect(t.hasBorders).toBe(true);
});

test("exiting with empty text removes the text object", () => {
  const c = makeCanvas();
  const t = new fabric.Textbox("", { width: 40 });
  c.add(t);
  handleTextEditingExited(c, { target: t });
  expect(c.getObjects()).not.toContain(t);
});
