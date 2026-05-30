var g = Object.defineProperty;
var p = (o, s, t) => s in o ? g(o, s, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[s] = t;
var e = (o, s, t) => (p(o, typeof s != "symbol" ? s + "" : s, t), t);
import { Stage as v, Player as b, Vector2 as m } from "@motion-canvas/core";
const f = `.initial{display:none}.state-initial .initial{display:block}.loading{display:none}.state-loading .loading{display:block}.ready{display:none}.state-ready .ready{display:block}.error{display:none}.state-error .error{display:block}:host{position:relative;display:block}.overlay{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;opacity:0;background-color:#0000008a;transition:opacity .1s}.overlay.state-ready:not(.auto){cursor:pointer}.overlay.playing:not(.hover):hover{cursor:none}.overlay.hover,.overlay.state-ready:focus-within,.overlay.state-ready:not(.playing){opacity:1}.overlay.hover .button,.overlay.state-ready:focus-within .button,.overlay.state-ready:not(.playing) .button{scale:1;transition:scale .1s ease-out}.overlay.state-loading,.overlay.state-error{opacity:1;transition:opacity 1s}.overlay.state-ready.auto{opacity:0}.button{width:50%;max-width:96px;aspect-ratio:1;scale:.5;transition:scale .1s ease-in,opacity .1s;background-color:transparent;border:none;background-size:100% 100%;background-repeat:no-repeat;opacity:.54;cursor:inherit;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCIgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bS0yIDE0LjV2LTlsNiA0LjUtNiA0LjV6Ii8+PC9zdmc+)}.playing .button{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDI0IDI0IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0cHgiIGZpbGw9IiNmZmZmZmYiPjxnPjxyZWN0IGZpbGw9Im5vbmUiIGhlaWdodD0iMjQiIHdpZHRoPSIyNCIvPjxyZWN0IGZpbGw9Im5vbmUiIGhlaWdodD0iMjQiIHdpZHRoPSIyNCIvPjxyZWN0IGZpbGw9Im5vbmUiIGhlaWdodD0iMjQiIHdpZHRoPSIyNCIvPjwvZz48Zz48Zy8+PHBhdGggZD0iTTEyLDJDNi40OCwyLDIsNi40OCwyLDEyczQuNDgsMTAsMTAsMTBzMTAtNC40OCwxMC0xMFMxNy41MiwyLDEyLDJ6IE0xMSwxNkg5VjhoMlYxNnogTTE1LDE2aC0yVjhoMlYxNnoiLz48L2c+PC9zdmc+)}.button:focus,.overlay:hover .button{opacity:.87}.auto .button{display:none}.canvas{width:100%;display:block;opacity:0;transition:opacity .1s}.canvas.state-ready{opacity:1}.message{font-family:JetBrains Mono,sans-serif;text-align:center;font-size:20px;padding:8px 16px;margin:16px;border-radius:4px;color:#fff9;background-color:#000000de}.loader{width:50%;max-width:96px;display:none;rotate:-90deg;animation:stroke 2s cubic-bezier(.5,0,.5,1) infinite,rotate 2s linear infinite}@keyframes stroke{0%{stroke-dasharray:5.6548667765px 50.8938009883px;stroke-dashoffset:2.8274333882px}50%{stroke-dasharray:50.8938009883px 5.6548667765px;stroke-dashoffset:-2.8274333882px}to{stroke-dasharray:5.6548667765px 50.8938009883px;stroke-dashoffset:-53.7212343766px}}@keyframes rotate{0%{rotate:-110deg}to{rotate:250deg}}
`, I = `<div class="overlay" part="overlay">
  <button
    part="play-button"
    title="Play / Pause"
    class="button ready"
    tabindex="0"
  ></button>
  <div part="message" class="message error">
    An error occurred while loading the animation.
  </div>
  <svg
    part="loader"
    class="loader loading"
    viewBox="0 0 24 24"
    stroke="#ffffff"
    stroke-width="2"
    fill="transparent"
  >
    <circle cx="12" cy="12" r="9" />
  </svg>
</div>
`, M = `<style>${f}</style>${I}`, c = "motion-canvas-player";
class w extends HTMLElement {
  constructor() {
    super();
    e(this, "root");
    e(this, "canvas");
    e(this, "overlay");
    e(this, "button");
    e(this, "state", "initial");
    e(this, "project", null);
    e(this, "player", null);
    e(this, "defaultSettings");
    e(this, "abortController", null);
    e(this, "mouseMoveId", null);
    e(this, "finished", !1);
    e(this, "playing", !1);
    e(this, "connected", !1);
    e(this, "stage", new v());
    e(this, "handleMouseMove", () => {
      this.mouseMoveId && clearTimeout(this.mouseMoveId), this.hover && !this.playing && this.setPlaying(!0), this.mouseMoveId = window.setTimeout(() => {
        this.mouseMoveId = null, this.updateClass();
      }, 2e3), this.updateClass();
    });
    e(this, "handleMouseLeave", () => {
      this.hover && this.setPlaying(!1), this.mouseMoveId && (clearTimeout(this.mouseMoveId), this.mouseMoveId = null, this.updateClass());
    });
    e(this, "handleMouseDown", (t) => {
      t.preventDefault();
    });
    e(this, "handleClick", () => {
      this.auto || (this.handleMouseMove(), this.setPlaying(!this.playing), this.button.animate(
        [
          { scale: "0.9" },
          {
            scale: "1",
            easing: "ease-out"
          }
        ],
        { duration: 200 }
      ));
    });
    e(this, "render", async () => {
      this.player && await this.stage.render(
        this.player.playback.currentScene,
        this.player.playback.previousScene
      );
    });
    this.root = this.attachShadow({ mode: "open" }), this.root.innerHTML = M, this.overlay = this.root.querySelector(".overlay"), this.button = this.root.querySelector(".button"), this.canvas = this.stage.finalBuffer, this.canvas.classList.add("canvas"), this.root.prepend(this.canvas), this.overlay.addEventListener("click", this.handleClick), this.overlay.addEventListener("mousemove", this.handleMouseMove), this.overlay.addEventListener("mouseleave", this.handleMouseLeave), this.button.addEventListener("mousedown", this.handleMouseDown), this.setState(
      "initial"
      /* Initial */
    );
  }
  static get observedAttributes() {
    return ["src", "quality", "width", "height", "auto", "variables"];
  }
  get auto() {
    return !!this.getAttribute("auto");
  }
  get hover() {
    return this.getAttribute("auto") === "hover";
  }
  get quality() {
    const t = this.getAttribute("quality");
    return t ? parseFloat(t) : this.defaultSettings.resolutionScale;
  }
  get width() {
    const t = this.getAttribute("width");
    return t ? parseFloat(t) : this.defaultSettings.size.width;
  }
  get height() {
    const t = this.getAttribute("height");
    return t ? parseFloat(t) : this.defaultSettings.size.height;
  }
  get variables() {
    try {
      const t = this.getAttribute("variables");
      return t ? JSON.parse(t) : {};
    } catch {
      return this.project.logger.warn("Project variables could not be parsed."), {};
    }
  }
  setState(t) {
    this.state = t, this.setPlaying(this.playing);
  }
  setPlaying(t) {
    var a, i;
    this.state === "ready" && (t || this.auto && !this.hover) ? ((a = this.player) == null || a.togglePlayback(!0), this.playing = !0) : ((i = this.player) == null || i.togglePlayback(!1), this.playing = !1), this.updateClass();
  }
  updateClass() {
    this.overlay.className = `overlay state-${this.state}`, this.canvas.className = `canvas state-${this.state}`, this.overlay.classList.toggle("playing", this.playing), this.overlay.classList.toggle("auto", this.auto), this.overlay.classList.toggle("hover", this.mouseMoveId !== null), this.connected && (this.mouseMoveId !== null || !this.playing ? this.dataset.overlay = "" : delete this.dataset.overlay);
  }
  async updateSource(t) {
    var r, l, h, d;
    this.setState(
      "initial"
      /* Initial */
    ), (r = this.abortController) == null || r.abort(), this.abortController = new AbortController();
    let a;
    try {
      const n = import(
        /* webpackIgnore: true */
        /* @vite-ignore */
        t
      ), y = new Promise((u) => setTimeout(u, 200));
      await Promise.any([y, n]), this.setState(
        "loading"
        /* Loading */
      ), a = (await n).default;
    } catch (n) {
      console.error(n), this.setState(
        "error"
        /* Error */
      );
      return;
    }
    this.defaultSettings = a.meta.getFullRenderingSettings();
    const i = new b(a);
    i.setVariables(this.variables), this.finished = !1, (l = this.player) == null || l.onRender.unsubscribe(this.render), (h = this.player) == null || h.togglePlayback(!1), (d = this.player) == null || d.deactivate(), this.project = a, this.player = i, this.updateSettings(), this.player.onRender.subscribe(this.render), this.player.togglePlayback(this.playing), this.setState(
      "ready"
      /* Ready */
    );
  }
  attributeChangedCallback(t, a, i) {
    var r;
    switch (t) {
      case "auto":
        this.setPlaying(this.playing);
        break;
      case "src":
        this.updateSource(i);
        break;
      case "quality":
      case "width":
      case "height":
        this.updateSettings();
        break;
      case "variables":
        (r = this.player) == null || r.setVariables(this.variables);
    }
  }
  disconnectedCallback() {
    var t, a;
    this.connected = !1, (t = this.player) == null || t.deactivate(), (a = this.player) == null || a.onRender.unsubscribe(this.render);
  }
  connectedCallback() {
    var t, a;
    this.connected = !0, (t = this.player) == null || t.activate(), (a = this.player) == null || a.onRender.subscribe(this.render);
  }
  updateSettings() {
    const t = {
      ...this.defaultSettings,
      size: new m(this.width, this.height),
      resolutionScale: this.quality
    };
    this.stage.configure(t), this.player.configure(t);
  }
}
customElements.get(c) || customElements.define(c, w);
