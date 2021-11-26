class ToolManager {
    #_currentTool;
    #_tools;
    #_toolPaths;
    #_toolColors;

    constructor(layerManager, width, height, sketch) {
        this.#_currentTool = 'brush-tool';
        this.#_tools = ['brush-tool', 'eraser-tool', 'layer-tool'];
        this.#_toolPaths = ['brush-path', 'eraser-path', 'layer-path'];
        this.#_toolColors = {
            active: '#dd6b6f',
            inactive: '#dfe6e9'
        }
        this.setTool(this.#_currentTool, width, height, layerManager, sketch);
    }
    // this function will be used for onclick for each of the tool icons
    setTool(tool, layerManager, width, height, sketch) {
        // recolor tools to active and inactive and set active tool
        for (let i = 0; i < this.#_tools.length; i++) {
            if (tool === this.#_tools[i]) {
                // change active tool
                this.#_currentTool = this.#_tools[i];
                // color tool svg active
                const toolPath = this.#_toolPaths[i];
                document.getElementById(toolPath).style.fill = this.#_toolColors.active;
            }
            else {
                // color tool svg inactive
                const toolPath = this.#_toolPaths[i];
                document.getElementById(toolPath).style.fill = this.#_toolColors.inactive;
            }
        }
        // if layers tool click open window else close
        if (tool === 'layer-tool') {
            this.openLayersWindow(layerManager, width, height, sketch);
        }
        else {
            this.closeLayersWindow();
        }
    }

    openLayersWindow(layerManager, width, height, sketch) {
        const html = this.createHTMLLayersElement(layerManager);

        document.getElementById('layers-window').innerHTML = html;

        layerManager.colorLayers();

        this.layerToolHandler(layerManager, width, height, sketch, this);

        document.getElementById('layers-window').style.display = 'block';
    }

    createHTMLLayersElement(layerManager) {
        let layersHTML = [];
        layersHTML.push(this.getLayersTitleHTML());
        // for(let i = 0; i < layerManager.numOfLayers; i++) {
        for (let i = layerManager.numOfLayers; i > 0; i--) {
            layersHTML.push(`<div id="layer_${i}" class="layer">`);
            layersHTML.push(this.getEyeIconHTML(i));
            layersHTML.push(`<p>Layer ${i}</p>`);
            layersHTML.push(this.getTrashIconHTML(i));
            layersHTML.push('</div>');
        }
        const html = layersHTML.join('');

        return html;
    }

    closeLayersWindow() {
        document.getElementById('layers-window').style.display = 'none';
    }

    layerToolHandler(layerManager, width, height, sketch, toolManager) {
        const layerToolButtons = document.getElementsByClassName('layers-tool');
        layerToolButtons.forEach((layerTool) => {
            layerTool.addEventListener('click', function () {
                const idSplit = this.id.split('_');

                if(idSplit[0] === 'layer-trash') {
                    layerManager.clearLayer(Number(idSplit[1]) - 1, width, height, sketch, toolManager);
                }

                if(idSplit[0] === 'layer-eye') {
                    layerManager.toggleLayer(Number(idSplit[1]) - 1);
                }
            });
        });
    }

    getEyeIconHTML(id) {
        const html = `<svg id="layer-eye_${id}" class="layers-tool" viewBox="0 0 24 24">` +
            '<path fill="none" d="M0 0h24v24H0z"/>' +
            '<path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1-4.78 3.527A2.499 2.499 0 0 0 12 9.5a2.5 2.5 0 0 0-1.473-2.28c.466-.143.96-.22 1.473-.22z" fill="#000"/>' +
            '</svg>';
        return html;
    }

    getTrashIconHTML(id) {
        const html = `<svg id="layer-trash_${id}" class="layers-tool" viewBox="0 0 24 24" fill="none">` +
            '<path fill-rule="evenodd" clip-rule="evenodd" d="M11 2C10.4477 2 10 2.44772 10 3V4H14V3C14 2.44772 13.5523 2 13 2H11ZM16 4V3C16 1.34315 14.6569 0 13 0H11C9.34315 0 8 1.34315 8 3V4H3C2.44772 4 2 4.44772 2 5C2 5.55228 2.44772 6 3 6H3.10496L4.80843 21.3313C4.97725 22.8506 6.26144 24 7.79009 24H16.2099C17.7386 24 19.0228 22.8506 19.1916 21.3313L20.895 6H21C21.5523 6 22 5.55228 22 5C22 4.44772 21.5523 4 21 4H16ZM18.8827 6H5.11726L6.7962 21.1104C6.85247 21.6169 7.28054 22 7.79009 22H16.2099C16.7195 22 17.1475 21.6169 17.2038 21.1104L18.8827 6ZM10 9C10.5523 9 11 9.44771 11 10V18C11 18.5523 10.5523 19 10 19C9.44772 19 9 18.5523 9 18V10C9 9.44771 9.44772 9 10 9ZM14 9C14.5523 9 15 9.44771 15 10V18C15 18.5523 14.5523 19 14 19C13.4477 19 13 18.5523 13 18V10C13 9.44771 13.4477 9 14 9Z" fill="#293644"/>' +
            '</svg>';
        return html;
    }

    getLayersTitleHTML() {
        const html = '<div class="layers-title">' +
            '<p>Layers</p>' +
            '<svg class="layers-tool" viewBox="0 0 512 512">' +
            '<path fill-rule="evenodd" clip-rule="evenodd" d="M272 48C272 39.1634 264.837 32 256 32C247.163 32 240 39.1634 240 48V240H48C39.1634 240 32 247.163 32 256C32 264.837 39.1634 272 48 272H240V464C240 472.837 247.163 480 256 480C264.837 480 272 472.837 272 464V272H464C472.837 272 480 264.837 480 256C480 247.163 472.837 240 464 240H272V48Z" fill="black"/>' +
            '</svg>' +
            '</div>';
        return html;
    }
    // #region setters and getters
    get currentTool() {
        return this.#_currentTool;
    }
    // #endregion
}