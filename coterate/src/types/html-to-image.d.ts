declare module 'html-to-image' {
  export interface Options {
    /**
     * Quality of the image (0-1)
     */
    quality?: number;
    /**
     * Background color of the image
     */
    backgroundColor?: string;
    /**
     * Width of the canvas
     */
    width?: number;
    /**
     * Height of the canvas
     */
    height?: number;
    /**
     * Images with crossOrigin set to anonymous won't be inlined
     */
    skipCrossOriginImages?: boolean;
    /**
     * CSS styles to be applied to the element
     */
    style?: Record<string, string>;
    /**
     * Pixel ratio of the output image
     */
    pixelRatio?: number;
    /**
     * Canvas scale factor
     */
    scale?: number;
    /**
     * Cache the image and avoid duplicated requests
     */
    cache?: Map<string, string>;
    /**
     * Log warnings to console
     */
    logging?: boolean;
    /**
     * Allow images from other domains
     */
    useCORS?: boolean;
  }

  /**
   * Converts a DOM node to a PNG image
   * @param node DOM node to convert
   * @param options Conversion options
   */
  export function toPng(node: HTMLElement, options?: Options): Promise<string>;

  /**
   * Converts a DOM node to a JPEG image
   * @param node DOM node to convert
   * @param options Conversion options
   */
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;

  /**
   * Converts a DOM node to a SVG image
   * @param node DOM node to convert
   * @param options Conversion options
   */
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;

  /**
   * Converts a DOM node to a canvas
   * @param node DOM node to convert
   * @param options Conversion options
   */
  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
} 