class Layer {
    #_layer;
    
    constructor(w, h, sketch) {
        this.#_layer = sketch.createGraphics(w, h);
    }

    paint(color, radius, mX, mY, width, sketch) {
        for(let x = mX - radius; x < mX + radius; x++) {
            for(let y = mY - radius; y < mY + radius; y++) {
                if((sketch.dist(x, y, mX, mY) < radius) && x > 0 && x <= width) {
                    this.#_layer.set(x, y, color);
                }
            }
        }
        this.#_layer.updatePixels();
    }

    get layer() {
        return this.#_layer;
    }
}