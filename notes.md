# Classes
## Layer
### Purpose
- This class will serve as a blueprint for each layer.
### Implementation Notes
- It will contain a method for the actual painting and erasing (painting with alpha) of the canvas. 
### Variables
```js
    layer // from createGraphics
```
### Functions
```js
    paint(color, radius, mX, mY) {
        for x = mX - radius to mX + radius
            for y = mY - radius to mY + radius
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
    // same size as layers will store true if layer is active
    activeLayers = []
```
### Functions
```js
    // this function will be called in mouseDragged() in main js file
    renderLayer() {
        for layer in layers
            image(layer, 0, 0)
    }
    paintOnLayer(l, color, radius, mouseX, mouseY) {
        layer[l].paint(color, radius, mouseX, mouseY)
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

## ToolManager
### Purpose
- To make change which tool is currently colored and keep track of the current 
tool
### Implementation Notes
### Variables
```js
    currentTool
    tools // all tool names
```
### Functions
```js
    // this function will be used in the callback function when clicking tool
    setTool(tool) {
        for t in tools
            if t === tool
                tool.style.fill = active color
            else
                tool.style.fill = inactive color

        if tool === layers
            openLayersWindow
    }
    openLayerWindow() {
        set layers window display to active
    }
```