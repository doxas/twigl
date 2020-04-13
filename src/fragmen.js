
export class Fragmen {
    /**
     * constructor of fragmen.js
     * @param {object} option - options
     * <ul>
     *   <li> {HTMLElement} target - insert canvas to
     *   <li> {HTMLElement} [eventTarget=target] - event target element or window
     *   <li> {boolean} [mouse=false] - mouse event enable
     *   <li> {boolean} [escape=false] - keydown event enable
     *   <li> {boolean} [resize=false] - resize event enable
     * </ul>
     */
    constructor(option){
        this.target = null;
        this.eventTarget = null;
        this.canvas = null;
        this.gl = null;
        this.source = '';
        this.resize = false;
        this.width = 0;
        this.height = 0;
        this.mouse = false;
        this.mousePosition = null;
        this.escape = false;
        this.run = false;
        this.startTime = 0;
        this.nowTime = 0;
        this.program = null;
        this.uniLocation = null;
        this.attLocation = null;
        this.VS = '';
        this.FS = '';
        this.postProgram = null;
        this.postUniLocation = null;
        this.postAttLocation = null;
        this.postVS = '';
        this.postFS = '';
        this.fFront = null;
        this.fBack = null;
        this.fTemp = null;
        // bind method
        this.render = this.render.bind(this);
        this.rect = this.rect.bind(this);
        this.reset = this.reset.bind(this);
        this.draw = this.draw.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.keyDown = this.keyDown.bind(this);
        // initial call
        this.init(option);
    }

    /**
     * initialize fragmen.js
     * @param {object} option - options
     */
    init(option){
        // option check
        if(option === null || option === undefined){return;}
        if(!option.hasOwnProperty('target') || option.target === null || option.target === undefined){return;}
        if(!(option.target instanceof HTMLElement)){return;}
        // init canvas
        this.target = this.eventTarget = option.target;
        if(this.target.tagName.match(/canvas/i)){
            this.canvas = this.target;
        }else{
            this.canvas = document.createElement('canvas');
            this.target.appendChild(this.canvas);
        }
        // init webgl context
        this.gl = this.canvas.getContext('webgl', {preserveDrawingBuffer: true});
        if(this.gl === null || this.gl === undefined){
            console.log('webgl unsupported');
            return;
        }
        this.gl.getExtension('OES_standard_derivatives');
        // check event
        if(option.hasOwnProperty('eventTarget') && option.eventTarget !== null && option.eventTarget !== undefined){
            this.eventTarget = option.eventTarget;
        }
        if(option.hasOwnProperty('mouse') && option.mouse === true){
            this.eventTarget.addEventListener('mousemove', this.mouseMove, false);
        }
        if(option.hasOwnProperty('escape') && option.escape === true){
            this.escape = true;
            window.addEventListener('keydown', this.keyDown, false);
        }
        if(option.hasOwnProperty('resize') && option.resize === true){
            this.resize = true;
            window.addEventListener('resize', this.rect, false);
        }
        // render initial
        this.VS = 'attribute vec3 p;void main(){gl_Position=vec4(p,1.);}';
        this.postVS = `
attribute vec3 position;
varying   vec2 vTexCoord;
void main(){
    vTexCoord   = (position + 1.0).xy / 2.0;
    gl_Position = vec4(position, 1.0);
}`;
        this.postFS = `
precision mediump float;
uniform sampler2D texture;
varying vec2      vTexCoord;
void main(){
    gl_FragColor = texture2D(texture, vTexCoord);
}`;
        this.postProgram = this.gl.createProgram();
        this.createShader(this.postProgram, 0, this.postVS);
        this.createShader(this.postProgram, 1, this.postFS);
        this.gl.linkProgram(this.postProgram);
        this.postUniLocation = {};
        this.postUniLocation.texture = this.gl.getUniformLocation(this.postProgram, 'texture');
        this.postAttLocation = this.gl.getAttribLocation(this.postProgram, 'position');
        this.fFront = this.fBack = this.fTemp = null;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,1,0,-1,-1,0,1,1,0,1,-1,0]), this.gl.STATIC_DRAW);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.disable(this.gl.BLEND);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }

    /**
     * rendering hub
     * @param {string} source - fragment shader source
     * @return {object} instance
     */
    render(source){
        if(source === null || source === undefined || source === ''){
            if(this.FS === ''){return;}
        }else{
            this.FS = source;
        }
        this.reset();
        return this;
    }

    /**
     * set rect
     */
    rect(){
        const bound = this.target.getBoundingClientRect();
        this.width = bound.width;
        this.height = bound.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.resetBuffer(this.fFront);
        this.resetBuffer(this.fBack);
        this.resetBuffer(this.fTemp);
        this.fFront = this.createFramebuffer(this.width, this.height);
        this.fBack = this.createFramebuffer(this.width, this.height);
        this.gl.viewport(0, 0, this.width, this.height);
    }

    /**
     * reset renderer
     */
    reset(){
        this.rect();
        const program = this.gl.createProgram();
        if(!this.createShader(program, 0, this.VS) || !this.createShader(program, 1, this.FS)){return;}
        this.gl.linkProgram(program);
        if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)){
            let msg = this.gl.getProgramInfoLog(program);
            console.warn(msg);
            if(this.onBuildCallback != null){
                const t = this.getTimeString();
                this.onBuildCallback('error', ` > [ ${t} ] ${msg}`);
            }
            return;
        }
        this.program = program;
        this.gl.useProgram(this.program);
        this.uniLocation = {};
        this.uniLocation.resolution = this.gl.getUniformLocation(this.program, 'resolution');
        this.uniLocation.mouse = this.gl.getUniformLocation(this.program, 'mouse');
        this.uniLocation.time = this.gl.getUniformLocation(this.program, 'time');
        this.uniLocation.sampler = this.gl.getUniformLocation(this.program, 'backbuffer');
        this.attLocation = this.gl.getAttribLocation(this.program, 'p');
        this.run = true;
        this.mousePosition = [0.0, 0.0];
        this.startTime = Date.now();
        this.draw();
    }

    /**
     * rendering
     */
    draw(){
        if(!this.run){return;}
        requestAnimationFrame(this.draw);
        this.nowTime = (Date.now() - this.startTime) * 0.001;
        this.gl.useProgram(this.program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fFront.f);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.fBack.t);
        this.gl.enableVertexAttribArray(this.attLocation);
        this.gl.vertexAttribPointer(this.attLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.uniform2fv(this.uniLocation.mouse, this.mousePosition);
        this.gl.uniform1f(this.uniLocation.time, this.nowTime);
        this.gl.uniform2fv(this.uniLocation.resolution, [this.width, this.height]);
        this.gl.uniform1i(this.uniLocation.sampler, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        this.gl.useProgram(this.postProgram);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.fFront.t);
        this.gl.enableVertexAttribArray(this.postAttLocation);
        this.gl.vertexAttribPointer(this.postAttLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.uniform1i(this.postUniLocation.texture, 1);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        this.gl.flush();
        this.fTemp = this.fFront;
        this.fFront = this.fBack;
        this.fBack = this.fTemp;

        if(this.onDrawCallback != null){
            this.onDrawCallback();
        }
    }

    /**
     * create and compile shader
     * @param {WebGLProgram} p - target program object
     * @param {number} i - 0 or 1, 0 is vertex shader compile mode
     * @param {string} j - shader source
     * @return {boolean} succeeded or not
     */
    createShader(p, i, j){
        if(!this.gl){return;}
        const k = this.gl.createShader(this.gl.VERTEX_SHADER - i);
        this.gl.shaderSource(k, j);
        this.gl.compileShader(k);
        const t = this.getTimeString();
        if(!this.gl.getShaderParameter(k, this.gl.COMPILE_STATUS)){
            let msg = this.gl.getShaderInfoLog(k);
            console.warn(msg);
            if(this.onBuildCallback != null){
                this.onBuildCallback('error', ` > [ ${t} ] ${msg}`);
            }
            return false;
        }
        if(this.onBuildCallback != null){
            this.onBuildCallback('success', ` > [ ${t} ] shader compile succeeded`);
        }
        this.gl.attachShader(p, k);
        const l = this.gl.getShaderInfoLog(k);
        if(l !== ''){console.info('shader info: ' + l);}
        return true;
    }

    /**
     * create framebuffer
     * @param {number} width - set to framebuffer width
     * @param {number} height - set to framebuffer height
     * @return {object} custom object
     * <ul>
     *   <li> f {WebGLFramebuffer}
     *   <li> d {WebGLRenderbuffer}
     *   <li> t {WebGLTexture}
     * </ul>
     */
    createFramebuffer(width, height){
        const frameBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
        const depthRenderBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthRenderBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, depthRenderBuffer);
        const fTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, fTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, fTexture, 0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return {f: frameBuffer, d: depthRenderBuffer, t: fTexture};
    }

    /**
     * framebuffer reset
     * @param {object} obj - custom object(this.createFramebuffer return value)
     */
    resetBuffer(obj){
        if(!this.gl || !obj){return;}
        if(obj.hasOwnProperty('f') && obj.f != null && this.gl.isFramebuffer(obj.f)){
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.gl.deleteFramebuffer(obj.f);
            obj.f = null;
        }
        if(obj.hasOwnProperty('d') && obj.d != null && this.gl.isRenderbuffer(obj.d)){
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
            this.gl.deleteRenderbuffer(obj.d);
            obj.d = null;
        }
        if(obj.hasOwnProperty('t') && obj.t != null && this.gl.isTexture(obj.t)){
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this.gl.deleteTexture(obj.t);
            obj.t = null;
        }
        obj = null;
    }

    /**
     * mouse event
     */
    mouseMove(eve){
        let bound, x, y, w, h;
        if(this.eventTarget === window){
            x = eve.clientX; y = eve.clientY;
            w = window.innerWidth; h = window.innerHeight;
        }else{
            bound = this.eventTarget.getBoundingClientRect();
            x = eve.clientX - (bound.left - window.scrollX);
            y = eve.clientY - (bound.top - window.scrollY);
            w = bound.width; h = bound.height;
        }
        this.mousePosition = [x / w, 1.0 - y / h];
    }

    /**
     * key event
     */
    keyDown(eve){
        if(this.gl === null){return;}
        this.run = (eve.keyCode !== 27);
    }

    onBuild(callback){
        this.onBuildCallback = callback;
    }
    onDraw(callback){
        this.onDrawCallback = callback;
    }

    getTimeString(){
        const d = new Date();
        const h = (new Array(2).join('0') + d.getHours()).substr(-2, 2);
        const m = (new Array(2).join('0') + d.getMinutes()).substr(-2, 2);
        return `${h}:${m}`;
    }
}

