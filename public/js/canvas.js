let s = sketch => {
    let height = document.getElementById('canvas-container').offsetHeight;
    let width = document.getElementById('canvas-container').offsetWidth;

    let toolPreviewLayer;

    let toolRadius = document.getElementById('brush-size').value;

    sketch.setup = () => {
        sketch.createCanvas(width, height);

        toolPreviewLayer = sketch.createGraphics(width, height);
        toolPreviewLayer.clear();
    }

    sketch.draw = () => {
        sketch.background('lightblue');

        toolPreviewLayer.clear();
        toolPreviewLayer.noFill();
        toolPreviewLayer.stroke(0);
        toolPreviewLayer.ellipse(sketch.mouseX, sketch.mouseY, toolRadius, toolRadius);
        // tool preview should always be last line of code executed to be on top
        sketch.image(toolPreviewLayer, 0, 0, width, height);
    }

    document.getElementById('brush-size').oninput = () => {
        toolRadius = document.getElementById('brush-size').value;
    }
}

let p5v1 = new p5(s, 'canvas-container');
// function setup() {
//     let c = createCanvas(400, 400);
//     c.parent('canvas-container');
// }

// function draw() {
//     background('blue');
// }