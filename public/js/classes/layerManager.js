class LayerManager {
    #_layers;
    #_activeLayers;

    constructor() {
        this.#_layers = [];
        this.#_activeLayers = [];
    }

    renderLayer(sketch) {
        for(let i = 0; i < this.#_layers.length; i++) {
            if(this.#_activeLayers[i] === true) {
                sketch.image(this.#_layers[i].layer, 0, 0);
            }
        }
    }

    paintOnLayer(l, color, radius, mX, mY) {
        if(this.#_activeLayers[l] === true) {
            this.#_layers[l].paint(color, radius, mX, mY);
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

    get numOfLayers() {
        return this.#_layers.length;
    }
}