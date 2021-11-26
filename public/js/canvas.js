let s = sketch => {
    // key codes
    let qKey = 81;
    let wKey = 87;
    let eKey = 69;
    let rKey = 82;

    let height = document.getElementById('canvas-container').offsetHeight;
    let width = document.getElementById('canvas-container').offsetWidth;

    let toolPreviewLayer;
    let layerManager;
    let toolManager;
    // is artist currently accessing tools like the slider?
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
        layerManager.addLayer(new Layer(width, height, sketch));
        layerManager.addLayer(new Layer(width, height, sketch));
        // set up tool manager
        toolManager = new ToolManager(layerManager, width, height, sketch);
    }

    sketch.draw = () => {
        sketch.background('lightblue');

        // render all layers
        layerManager.renderLayers(sketch);
        // tool preview should always be last line of code executed to be on top
        toolPreviewLayer.drawPreview(sketch.mouseX, sketch.mouseY, width, height, sketch);
    }

    sketch.mouseDragged = () => {
        if(!accessingTools && toolManager.currentTool === 'brush-tool') {
            const currentColor = document.getElementById('color-selector').value;
            const currentRadius = document.getElementById('brush-size').value;
            const currentOpacity = document.getElementById('brush-opacity').value;
            // convert color from hex to rgba to support alpha
            const currentColorHex = sketch.color(currentColor);
            const r = sketch.red(currentColorHex);
            const g = sketch.green(currentColorHex);
            const b = sketch.blue(currentColorHex);
            const currentColorRGBA = sketch.color('rgba(' + r + ',' + g + ',' + b + ',' + currentOpacity + ')');
            // the algorithm behind sketch uses twice as large radius so we need
            // to divide by two to get an accurate size
            layerManager.paintOnLayer(currentColorRGBA, Number(currentRadius) / 2, sketch.mouseX, sketch.mouseY, width, sketch);
        }
        if(!accessingTools && toolManager.currentTool === 'eraser-tool') {
            const eraserColor = sketch.color(0, 0);
            const currentRadius = document.getElementById('brush-size').value;

            layerManager.paintOnLayer(eraserColor, Number(currentRadius) / 2, sketch.mouseX, sketch.mouseY, width, sketch);
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

    const toolButtons = document.getElementsByClassName('tool');
    toolButtons.forEach((tool) => {
        tool.addEventListener('click', function() {
            toolManager.setTool(this.id, layerManager, width, height, sketch);
        });
    });
    // #endregion
    // #region buttons
    sketch.keyPressed = () => {
        if(sketch.keyCode === qKey) {
            toolManager.setTool('brush-tool', layerManager, width, height, sketch);
        }
        else if(sketch.keyCode === wKey) {
            toolManager.setTool('eraser-tool', layerManager, width, height, sketch);
        }
        else if(sketch.keyCode === eKey) {
            toolManager.setTool('layer-tool', layerManager, width, height, sketch);
        }
    }
    // #endregion
}

let p5v1 = new p5(s, 'canvas-container');

// prevent right click
window.addEventListener('contextmenu', e => {
    e.preventDefault();
});
