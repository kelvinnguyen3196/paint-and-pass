class LayerManager {
    #_layers;
    #_activeLayers;
    #_currentLayer;

    constructor() {
        this.#_layers = [];
        this.#_activeLayers = [];
        this.#_currentLayer = 0;
    }

    renderLayers(sketch) {
        for(let i = 0; i < this.#_layers.length; i++) {
            if(this.#_activeLayers[i] === true) {
                sketch.image(this.#_layers[i].layer, 0, 0);
            }
        }
    }

    paintOnLayer(color, radius, mX, mY, width, sketch) {
        if(this.#_activeLayers[this.#_currentLayer] === true) {
            this.#_layers[this.#_currentLayer].paint(color, radius, mX, mY, width, sketch);
        }
    }

    addLayer(layer) {
        this.#_activeLayers.push(true);
        this.#_layers.push(layer);
    }

    removeLayer(i) {
        this.#_activeLayers.splice(i, 1);
        this.#_layers.splice(i, 1);
    }

    toggleLayer(layer) { // set layer as active or inactive
        this.#_activeLayers[layer] = !this.#_activeLayers[layer];
    }
    // #region setters and getters
    get numOfLayers() {
        return this.#_layers.length;
    }

    set currentLayer(layer) {
        this.#_currentLayer = layer;
    }
    // #endregion
}