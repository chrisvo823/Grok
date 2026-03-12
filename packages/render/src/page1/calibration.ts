import type {
  Page1TemplateAnchorConfig,
  Page1TemplateCalibration,
  Page2OverlayTransform,
  PageSizePt,
} from "../types";

type BuildPage1TemplateCalibrationInput = {
  templatePageSizePt: PageSizePt;
  targetViewportSizePx: {
    width: number;
    height: number;
  };
  templateAnchors: Page1TemplateAnchorConfig;
};

export function buildPage1TemplateCalibration(input: BuildPage1TemplateCalibrationInput): Page1TemplateCalibration {
  const scaleX = input.targetViewportSizePx.width / Math.max(input.templatePageSizePt.width, 1);
  const scaleY = input.targetViewportSizePx.height / Math.max(input.templatePageSizePt.height, 1);

  const overlayToViewportPx: Page2OverlayTransform = {
    scaleX,
    scaleY,
    offsetX: 0,
    offsetY: 0,
  };

  return {
    viewportFit: {
      sourcePageSizePt: input.templatePageSizePt,
      targetViewportSizePx: input.targetViewportSizePx,
      scaleX,
      scaleY,
    },
    templateAnchors: input.templateAnchors,
    overlayToViewportPx,
  };
}
