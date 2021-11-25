class toolPreview {
    #_toolRadius;
    #_toolOpacity;
    #_previewLayer;

    constructor(toolRadius, toolOpacity, w, h, sketch) {
        this.#_toolRadius = toolRadius;
        this.#_toolOpacity = toolOpacity;

        this.#_previewLayer = sketch.createGraphics(w, h);
        this.#_previewLayer.clear();
    }
    // #region setters and getters
    set radius(newRadius) {
        this.#_toolRadius = newRadius;
    }

    get radius() {
        return this.#_toolRadius;
    }

    set opacity(newOpacity) {
        this.#_toolOpacity = newOpacity;
    }

    get opacity() {
        return this.#_toolOpacity;
    }
    // #endregion
    // #region class methods
    drawPreview(x, y, w, h, sketch) {
        this.#_previewLayer.clear();
        this.#_previewLayer.noFill();
        this.#_previewLayer.stroke(`rgba(0, 0, 0, ${this.#_toolOpacity})`);
        this.#_previewLayer.ellipse(x, y, this.#_toolRadius, this.#_toolRadius);
        sketch.image(this.#_previewLayer, 0, 0, w, h);
    }
    // #endregion
}