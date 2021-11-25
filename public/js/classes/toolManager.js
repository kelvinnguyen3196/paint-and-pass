class ToolManager {
    #_currentTool;
    #_tools;
    #_toolPaths;
    #_toolColors;

    constructor(currentTool) {
        this.#_currentTool = currentTool;
        this.#_tools = ['brush-tool', 'eraser-tool', 'layer-tool'];
        this.#_toolPaths = ['brush-path', 'eraser-path', 'layer-path'];
        this.#_toolColors = {
            active: '#dd6b6f',
            inactive: '#dfe6e9'
        }
    }
    // this function will be used for onclick for each of the tool icons
    setTool(tool) {
        // recolor tools to active and inactive and set active tool
        for(let i = 0; i < this.#_tools.length; i++) {
            if(tool === this.#_tools[i]) {
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
        if(tool === 'layer-tool') {
            this.openLayersWindow;
        }
        else {
            this.closeLayersWindow();
        }
    }

    openLayersWindow() {
        document.getElementById('layers-window').style.display = 'block';
    }

    closeLayersWindow() {
        document.getElementById('layers-window').style.display = 'none';
    }
    // #region setters and getters
    get currentTool() {
        return this.#_currentTool;
    }
    // #endregion
}