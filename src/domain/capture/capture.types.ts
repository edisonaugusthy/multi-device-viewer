export type CaptureMode = "viewport" | "framed" | "comparison";

export type AnnotationTool = "select" | "arrow" | "rectangle" | "pen" | "text" | "cover";

export interface AnnotationMark {
  id: string;
  tool: AnnotationTool;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
}
