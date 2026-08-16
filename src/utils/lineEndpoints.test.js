import { fabric } from "fabric";
import { setLineEndpoint, attachLineEndpointControls } from "./lineEndpoints";

test("setLineEndpoint moves one end and leaves the other put", () => {
  const line = new fabric.Line([200, 200, 500, 300], { stroke: "#111" });
  setLineEndpoint(line, "p2", { x: 600, y: 150 });
  expect(line.x1).toBe(200);
  expect(line.y1).toBe(200);
  expect(line.x2).toBe(600);
  expect(line.y2).toBe(150);

  setLineEndpoint(line, "p1", { x: 120, y: 400 });
  expect(line.x1).toBe(120);
  expect(line.y1).toBe(400);
  expect(line.x2).toBe(600); // p2 untouched
  expect(line.y2).toBe(150);
});

test("attachLineEndpointControls installs p1/p2 handles and hides the box", () => {
  const line = new fabric.Line([0, 0, 100, 0], { stroke: "#111" });
  attachLineEndpointControls(line);
  expect(Object.keys(line.controls)).toEqual(["p1", "p2"]);
  expect(line.hasBorders).toBe(false);
});
