import type {
  Page2OverlayAnchorSnapshot,
  Page2OverlayTransform,
  Page2Scene,
  Page2TemplateAnchorConfig,
  Page2TemplateCalibration,
  PageSizePt,
} from "../types";

type BuildPage2TemplateCalibrationInput = {
  scene: Page2Scene;
  templateAnchors: Page2TemplateAnchorConfig;
  targetViewportSizePx: {
    width: number;
    height: number;
  };
  templatePageSizePt: PageSizePt;
};

function clampNonZero(value: number, fallback = 1): number {
  if (!Number.isFinite(value) || value === 0) return fallback;
  return value;
}

function derivePinRowPitch(pinYs: number[]): number {
  if (pinYs.length < 2) return 1;
  const diffs = pinYs
    .slice(1)
    .map((value, index) => value - pinYs[index])
    .filter((diff) => diff > 0);
  if (diffs.length === 0) return 1;
  const sum = diffs.reduce((acc, diff) => acc + diff, 0);
  return sum / diffs.length;
}

export function snapshotPage2OverlayAnchors(scene: Page2Scene): Page2OverlayAnchorSnapshot {
  const pinYs = scene.pinRows.map((row) => row.y);
  const pinRowStartY = pinYs[0] ?? scene.leftColumn.y;
  const pinRowPitch = derivePinRowPitch(pinYs);

  return {
    leftRailX: scene.leftColumn.railX,
    rightRailX: scene.rightColumn.railX,
    pinRowStartY,
    pinRowPitch,
    headingLeftCenterX: scene.leftColumn.x + scene.leftColumn.width / 2,
    headingRightCenterX: scene.rightColumn.x + scene.rightColumn.width / 2,
    headingY: 70,
    subheadingY: 78,
    leftLabelAnchorX: scene.wires[0]?.leftLabelPos.x ?? 182,
    rightLabelAnchorX: scene.wires[0]?.rightLabelPos.x ?? 524,
    metaAnchorX: scene.pageSize.width / 2,
  };
}

function computeViewportFit(
  templatePageSizePt: PageSizePt,
  targetViewportSizePx: { width: number; height: number },
): Page2TemplateCalibration["viewportFit"] {
  const scaleX = targetViewportSizePx.width / clampNonZero(templatePageSizePt.width);
  const scaleY = targetViewportSizePx.height / clampNonZero(templatePageSizePt.height);
  return {
    sourcePageSizePt: templatePageSizePt,
    targetViewportSizePx,
    scaleX,
    scaleY,
    offsetX: 0,
    offsetY: 0,
  };
}

function composeTransform(base: Page2OverlayTransform, fit: Page2TemplateCalibration["viewportFit"]): Page2OverlayTransform {
  return {
    scaleX: base.scaleX * fit.scaleX,
    scaleY: base.scaleY * fit.scaleY,
    offsetX: base.offsetX * fit.scaleX + fit.offsetX,
    offsetY: base.offsetY * fit.scaleY + fit.offsetY,
  };
}

export function buildPage2TemplateCalibration(input: BuildPage2TemplateCalibrationInput): Page2TemplateCalibration {
  const overlayAnchors = snapshotPage2OverlayAnchors(input.scene);
  const viewportFit = computeViewportFit(input.templatePageSizePt, input.targetViewportSizePx);

  const xSpanTemplate = clampNonZero(input.templateAnchors.rightRailX - input.templateAnchors.leftRailX);
  const xSpanOverlay = clampNonZero(overlayAnchors.rightRailX - overlayAnchors.leftRailX);
  const scaleX = xSpanTemplate / xSpanOverlay;
  const offsetX = input.templateAnchors.leftRailX - overlayAnchors.leftRailX * scaleX;

  const scaleY = input.templateAnchors.pinRowPitch / clampNonZero(overlayAnchors.pinRowPitch);
  const offsetY = input.templateAnchors.pinRowStartY - overlayAnchors.pinRowStartY * scaleY;

  const overlayToTemplatePt: Page2OverlayTransform = {
    scaleX,
    scaleY,
    offsetX,
    offsetY,
  };

  const overlayToViewportPx = composeTransform(overlayToTemplatePt, viewportFit);

  return {
    viewportFit,
    templateAnchors: input.templateAnchors,
    overlayAnchors,
    overlayToTemplatePt,
    overlayToViewportPx,
  };
}
