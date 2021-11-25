let s = sketch => {
    let height = document.getElementById('canvas-container').offsetHeight;
    let width = document.getElementById('canvas-container').offsetWidth;

    let toolPreviewLayer;
    let layerManager;

    let accessingTools;

    sketch.setup = () => {
        sketch.createCanvas(width, height);
        // not accessing tools at the start 
        // set up tool preview i.e. brush size slider
        const currentRadius = document.getElementById('brush-size').value;
        const currentOpacity = document.getElementById('brush-opacity').value;
        toolPreviewLayer = new ToolPreview(currentRadius, currentOpacity, width, height, sketch);
        // set up layer manager
        layerManager = new LayerManager();
        // set up first layer - we never draw on background
        layerManager.addLayer(new Layer(width, height, sketch));
    }

    sketch.draw = () => {
        sketch.background('lightblue');

        // render all layers
        layerManager.renderLayers(sketch);
        // tool preview should always be last line of code executed to be on top
        toolPreviewLayer.drawPreview(sketch.mouseX, sketch.mouseY, width, height, sketch);
    }

    sketch.mouseDragged = () => {
        if(!accessingTools) {
            const currentColor = document.getElementById('color-selector').value;
            const currentRadius = document.getElementById('brush-size').value;
            // the algorithm behind sketch uses twice as large radisu so we need
            // to divide by two to get an accurate size
            layerManager.paintOnLayer(sketch.color(currentColor), Number(currentRadius) / 2, sketch.mouseX, sketch.mouseY, width, sketch);
        }
    }

    // #region event listeners
    document.getElementById('brush-size').oninput = () => {
        accessingTools = true;
        toolPreviewLayer.radius = document.getElementById('brush-size').value;
    }

    document.getElementById('brush-size').onmouseup = () => {
        accessingTools = false;
    }
    
    document.getElementById('brush-opacity').oninput = () => {
        accessingTools = true;
        toolPreviewLayer.opacity = document.getElementById('brush-opacity').value;
    }

    document.getElementById('brush-opacity').onmouseup = () => {
        accessingTools = false;
    }

    // #endregion
}

let p5v1 = new p5(s, 'canvas-container');

// prevent right click
window.addEventListener('contextmenu', e => {
    e.preventDefault();
}, false);