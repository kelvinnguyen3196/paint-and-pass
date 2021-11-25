let s = sketch => {
    let height = document.getElementById('canvas-container').offsetHeight;
    let width = document.getElementById('canvas-container').offsetWidth;

    let toolPreviewLayer;

    sketch.setup = () => {
        sketch.createCanvas(width, height);
        // set up tool preview
        const currentRadius = document.getElementById('brush-size').value;
        const currentOpacity = document.getElementById('brush-opacity').value;
        toolPreviewLayer = new ToolPreview(currentRadius, currentOpacity, width, height, sketch);
    }

    sketch.draw = () => {
        sketch.background('lightblue');
        // tool preview should always be last line of code executed to be on top
        toolPreviewLayer.drawPreview(sketch.mouseX, sketch.mouseY, width, height, sketch);
    }

    // #region event listeners
    document.getElementById('brush-size').oninput = () => {
        toolPreviewLayer.radius = document.getElementById('brush-size').value;
    }
    
    document.getElementById('brush-opacity').oninput = () => {
        toolPreviewLayer.opacity = document.getElementById('brush-opacity').value;
    }
    // #endregion
}

let p5v1 = new p5(s, 'canvas-container');