# Classes
## Layer
### Purpose
- This class will serve as a blueprint for each layer.
### Implementation Notes
- It will contain a method for the actual painting and erasing (painting with alpha) of the canvas. 
### Variables
```js
```
### Functions
```js
    paint(color, radius) {
        for x = mouseX - radius to mouseX + radius
            for y = mouseY - radius to mouseY + radius
                if(...) // see example code from online
                    layer.set(x, y, color)
    }
```

## LayerManager
- This class will be a singleton and hold each layer that is created.
### Implementation Notes
- It will have a method that will will loop through each layer and determine if it needs to be drawn (i.e. if the layer is turned off temporarily). 
### Variables
```js
    layers = []
```
### Functions
```js
    // this function will be called in mouseDragged() in main js file
    renderLayer() {
        for layer in layers
            image(layer, 0, 0)
    }
    paintOnLayer(l, color, radius) {
        layer[l].paint(color, radius)
    }
    addLayer(layer) {
        layers.push(layer)
    }
    removeLayer(i) {
        layers.splice(i, 1);
    }
    get numOfLayers() {
        return layers.length;
    }
```