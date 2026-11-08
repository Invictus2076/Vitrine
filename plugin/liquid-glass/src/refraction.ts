import { displacementPixels } from "./displacement.ts";

/** Floating panels that get refraction. The theme gives the same elements their frosted look. */
export const GLASS_SELECTOR =
  ".modal, .prompt, .menu, .suggestion-container, .popover.hover-popover, .notice, .status-bar";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Built maps are reused across panels of the same size; 24 sizes covers normal use. */
const MAP_CACHE_LIMIT = 24;

/** Red, green and blue are displaced by different amounts, giving a faint colour fringe at the rim. */
const CHANNEL_SCALES = [1, 0.9, 0.8] as const;

interface Tracked {
  filter: SVGFilterElement;
  image: SVGFEImageElement;
  maps: SVGFEDisplacementMapElement[];
  width: number;
  height: number;
}

/**
 * Gives every floating panel in one document its own SVG displacement filter and points the
 * panel's `--lg-refract` custom property at it. The theme puts that property into the panel's
 * `backdrop-filter`. Each panel needs its own filter because the map has to match its size.
 */
export class Refractor {
  private readonly tracked = new Map<HTMLElement, Tracked>();
  private readonly mapCache = new Map<string, string>();
  private readonly pending = new Set<HTMLElement>();
  private readonly svg: SVGSVGElement;
  private readonly resizeObserver: ResizeObserver;
  private readonly mutationObserver: MutationObserver;
  private frame = 0;
  private nextId = 0;

  constructor(private readonly doc: Document, private strength: number) {
    this.svg = this.svgElement("svg", { class: "lg-refraction-defs", "aria-hidden": "true", width: 0, height: 0 }) as SVGSVGElement;
    this.svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    this.svg.appendChild(this.svgElement("defs", {}));
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) this.schedule(entry.target as HTMLElement);
    });
    // subtree: menus, modals, popovers and notices are added at different depths under <body>
    this.mutationObserver = new MutationObserver((mutations) => this.onMutations(mutations));
  }

  start(): void {
    this.doc.body.appendChild(this.svg);
    this.mutationObserver.observe(this.doc.body, { childList: true, subtree: true });
    this.scan(this.doc.body);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
    for (const element of [...this.tracked.keys()]) this.untrack(element);
    this.svg.remove();
    this.mapCache.clear();
  }

  setStrength(strength: number): void {
    this.strength = strength;
    for (const { maps } of this.tracked.values()) this.setScales(maps);
  }

  private onMutations(mutations: MutationRecord[]): void {
    let removed = false;
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => this.scan(node));
      removed ||= mutation.removedNodes.length > 0;
    }
    if (!removed) return;
    for (const element of [...this.tracked.keys()]) {
      if (!element.isConnected) this.untrack(element);
    }
  }

  private scan(node: Node): void {
    if (!(node instanceof HTMLElement) || this.svg.contains(node)) return;
    if (node.matches(GLASS_SELECTOR)) this.track(node);
    node.querySelectorAll<HTMLElement>(GLASS_SELECTOR).forEach((element) => this.track(element));
  }

  private track(element: HTMLElement): void {
    if (this.tracked.has(element)) return;
    const id = `lg-refract-${++this.nextId}`;

    const filter = this.svgElement("filter", {
      id,
      x: 0,
      y: 0,
      width: "100%",
      height: "100%",
      "color-interpolation-filters": "sRGB",
    }) as SVGFilterElement;
    const image = this.svgElement("feImage", { x: 0, y: 0, preserveAspectRatio: "none", result: "map" }) as SVGFEImageElement;
    const channels = ["r", "g", "b"] as const;
    const maps = channels.map((channel) =>
      this.svgElement("feDisplacementMap", {
        in: "SourceGraphic",
        in2: "map",
        xChannelSelector: "R",
        yChannelSelector: "G",
        result: `d${channel}`,
      }) as SVGFEDisplacementMapElement,
    );
    this.setScales(maps);

    // Keep one colour channel from each displaced copy, then add the three back together
    const keep = {
      r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
      g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
      b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
    };
    filter.append(
      image,
      ...maps,
      ...channels.map((channel) =>
        this.svgElement("feColorMatrix", { in: `d${channel}`, type: "matrix", values: keep[channel], result: channel }),
      ),
      this.svgElement("feComposite", { in: "r", in2: "g", operator: "arithmetic", k2: 1, k3: 1, result: "rg" }),
      this.svgElement("feComposite", { in: "rg", in2: "b", operator: "arithmetic", k2: 1, k3: 1 }),
    );
    this.svg.firstElementChild!.appendChild(filter);

    this.tracked.set(element, { filter, image, maps, width: 0, height: 0 });
    this.resizeObserver.observe(element);
    element.style.setProperty("--lg-refract", `url("#${id}")`);
    this.schedule(element);
  }

  private untrack(element: HTMLElement): void {
    const entry = this.tracked.get(element);
    if (!entry) return;
    this.resizeObserver.unobserve(element);
    entry.filter.remove();
    element.style.removeProperty("--lg-refract");
    this.tracked.delete(element);
    this.pending.delete(element);
  }

  /** Coalesces resize notifications into one update per element per frame. */
  private schedule(element: HTMLElement): void {
    this.pending.add(element);
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      for (const target of this.pending) this.resize(target);
      this.pending.clear();
    });
  }

  private resize(element: HTMLElement): void {
    const entry = this.tracked.get(element);
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (!entry || !width || !height || (width === entry.width && height === entry.height)) return;
    entry.image.setAttribute("href", this.mapUrl(width, height));
    entry.image.setAttribute("width", String(width));
    entry.image.setAttribute("height", String(height));
    entry.width = width;
    entry.height = height;
  }

  private mapUrl(width: number, height: number): string {
    const key = `${width}x${height}`;
    const cached = this.mapCache.get(key);
    if (cached) return cached;

    const canvas = this.doc.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.putImageData(new ImageData(displacementPixels(width, height), width, height), 0, 0);
    const url = canvas.toDataURL("image/png");

    if (this.mapCache.size >= MAP_CACHE_LIMIT) this.mapCache.delete(this.mapCache.keys().next().value!);
    this.mapCache.set(key, url);
    return url;
  }

  private setScales(maps: SVGFEDisplacementMapElement[]): void {
    maps.forEach((map, i) => map.setAttribute("scale", String(Math.round(this.strength * CHANNEL_SCALES[i]))));
  }

  private svgElement(tag: string, attributes: Record<string, string | number>): SVGElement {
    const element = this.doc.createElementNS(SVG_NS, tag) as SVGElement;
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
    return element;
  }
}
