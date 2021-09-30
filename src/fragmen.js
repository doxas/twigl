
import noise from './shader_snippet/noise.glsl';

export class Fragmen {
    /**
     * ES 3.0 専用モードの一覧
     * @type {Array.<number>}
     */
    static get MODE_WITH_ES_300(){return [4, 5, 6, 7, 8, 9, 10, 11];}
    /**
     * resolution, mouse, time, backbuffer の各種 uniform 定義で動作するクラシックモード
     * @type {number}
     */
    static get MODE_CLASSIC(){return 0;}
    /**
     * r, m, t, b の省略形 uniform 定義で動作するギークモード
     * @type {number}
     */
    static get MODE_GEEK(){return 1;}
    /**
     * キークモードの特性に加え、precision と uniform 変数宣言部分を省略したギーカーモード
     * @type {number}
     */
    static get MODE_GEEKER(){return 2;}
    /**
     * ギーカーモードの特性に加え、void main と gl_FragCoord の省略、さらに各種 GLSL スニペットの利用が可能なギーケストモード
     * @type {number}
     */
    static get MODE_GEEKEST(){return 3;}
    /**
     * classic の ES 3.0 版
     * @type {number}
     */
    static get MODE_CLASSIC_300(){return 4;}
    /**
     * geek の ES 3.0 版
     * @type {number}
     */
    static get MODE_GEEK_300(){return 5;}
    /**
     * geeker の ES 3.0 版
     * @type {number}
     */
    static get MODE_GEEKER_300(){return 6;}
    /**
     * geekest の ES 3.0 版
     * @type {number}
     */
    static get MODE_GEEKEST_300(){return 7;}
    /**
     * classic の ES 3.0 + MRT 版
     * @type {number}
     */
    static get MODE_CLASSIC_MRT(){return 8;}
    /**
     * geek の ES 3.0 + MRT 版
     * @type {number}
     */
    static get MODE_GEEK_MRT(){return 9;}
    /**
     * geeker の ES 3.0 + MRT 版
     * @type {number}
     */
    static get MODE_GEEKER_MRT(){return 10;}
    /**
     * geekest の ES 3.0 + MRT 版
     * @type {number}
     */
    static get MODE_GEEKEST_MRT(){return 11;}
    /**
     * MRT のターゲット数
     * ※ MRT では指定されたバッファのすべてに出力を行う必要があり、多ければよいというものではない
     * ※ 将来的には任意にターゲット数を変更できるようにするべきなのかもしれない
     * @type {number}
     */
    static get MRT_TARGET_COUNT(){return 2;}
    /**
     * 各種のデフォルトのソースコード
     * @type {Array.<string>}
     */
    static get DEFAULT_SOURCE(){
        // MRT declaration
        let declareOutColor = '';
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
            declareOutColor += `layout (location = ${i}) out vec4 outColor${i};\n`;
        }
        let declareO = '';
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
            declareO += `layout (location = ${i}) out vec4 o${i};\n`;
        }
        let outColor = '';
        for(let i = 1; i < Fragmen.MRT_TARGET_COUNT; ++i){
            outColor += `outColor${i}=outColor0;`;
        }
        let o = '';
        for(let i = 1; i < Fragmen.MRT_TARGET_COUNT; ++i){
            o += `o${i}=o0;`;
        }
        // sources
        const classic = `precision highp float;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D backbuffer;
void main(){vec2 r=resolution,p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-mouse;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(time*.2)*.4);}gl_FragColor=vec4(p.xxy,1);}`;
        const geek = `precision highp float;
uniform vec2 r;
uniform vec2 m;
uniform float t;
uniform sampler2D b;
void main(){vec2 p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}gl_FragColor=vec4(p.xxy,1);}`;
        const geeker = `void main(){vec2 p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}gl_FragColor=vec4(p.xxy,1);}`;
        const geekest = `vec2 p=(FC.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}gl_FragColor=vec4(p.xxy,1);`;
        const classic300 = `precision highp float;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D backbuffer;
out vec4 outColor;
void main(){vec2 r=resolution,p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-mouse;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(time*.2)*.4);}outColor=vec4(p.xxy,1);}`;
        const geek300 = `precision highp float;
uniform vec2 r;
uniform vec2 m;
uniform float t;
uniform sampler2D b;
out vec4 o;
void main(){vec2 p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}o=vec4(p.xxy,1);}`;
        const geeker300 = `void main(){vec2 p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}o=vec4(p.xxy,1);}`;
        const geekest300 = `vec2 p=(FC.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}o=vec4(p.xxy,1);`;
        const classicMRT = `precision highp float;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D backbuffer0;
uniform sampler2D backbuffer1;
${declareOutColor}void main(){vec2 r=resolution,p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-mouse;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(time*.2)*.4);}outColor0=vec4(p.xxy,1);${outColor}}`;
        const geekMRT = `precision highp float;
uniform vec2 r;
uniform vec2 m;
uniform float t;
uniform sampler2D b;
${declareO}void main(){vec2 p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}o0=vec4(p.xxy,1);${o}}`;
        const geekerMRT = `void main(){vec2 p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}o0=vec4(p.xxy,1);${o}}`;
        const geekestMRT = `vec2 p=(FC.xy*2.-r)/min(r.x,r.y)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}o0=vec4(p.xxy,1);${o}`;
        return [classic, geek, geeker, geekest, classic300, geek300, geeker300, geekest300, classicMRT, geekMRT, geekerMRT, geekestMRT];
    }
    /**
     * GLSL ES 3.0 の場合に付与されるバージョンディレクティブ
     * @type {string}
     */
    static get ES_300_CHUNK(){return '#version 300 es\n';}
    /**
     * ギーカーモード時に先頭に付与されるフラグメントシェーダのコード
     * @type {string}
     */
    static get GEEKER_CHUNK(){return 'precision highp float;uniform vec2 r;uniform vec2 m;uniform float t;uniform float f;uniform float s;uniform sampler2D b;\n';}
    /**
     * ギーカーモード + ES 3.0 の場合に付与される out 修飾子付き変数のコード
     * @type {string}
     */
    static get GEEKER_OUT_CHUNK(){return 'out vec4 o;\n';}
    /**
     * ギーカーモード + MRT 時に先頭に付与されるフラグメントシェーダのコード
     * @type {string}
     */
    static get GEEKER_MRT_CHUNK(){
        const chunk = [];
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
            chunk.push(`uniform sampler2D b${i};`);
        }
        return `precision highp float;uniform vec2 r;uniform vec2 m;uniform float t;uniform float f;uniform float s;${chunk.join('')}\n`;
    }
    /**
     * ギーカーモード + ES 3.0 + MRT の場合に付与される out 修飾子付き変数のコード
     * @type {string}
     */
    static get GEEKER_OUT_MRT_CHUNK(){
        const chunk = [];
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
            chunk.push(`layout (location = ${i}) out vec4 o${i};`);
        }
        return `${chunk.join('')}\n`;
    }
    /**
     * ギーケストモード時に先頭に付与されるフラグメントシェーダのコード
     * @type {string}
     */
    static get GEEKEST_CHUNK(){
        return `#define FC gl_FragCoord
precision highp float;uniform vec2 r;uniform vec2 m;uniform float t;uniform float f;uniform float s;uniform sampler2D b;
${noise}\n`;
    }
    /**
     * ギーケストモード + ES 3.0 の場合に付与される out 修飾子付き変数のコード
     * @type {string}
     */
    static get GEEKEST_OUT_CHUNK(){return 'out vec4 o;\n';}
    /**
     * ギーケストモード + ES 3.0 + MRT の場合に先頭に付与されるフラグメントシェーダのコード
     * @type {string}
     */
    static get GEEKEST_MRT_CHUNK(){
        const chunk = [];
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
            chunk.push(`uniform sampler2D b${i};`);
        }
        return `#define FC gl_FragCoord
precision highp float;uniform vec2 r;uniform vec2 m;uniform float t;uniform float f;uniform float s;${chunk.join('')}
${noise}\n`;
    }
    /**
     * ギーケストモード + ES 3.0 + MRT の場合に付与される layout out 修飾子付き変数のコード
     * @type {string}
     */
    static get GEEKEST_OUT_MRT_CHUNK(){
        const chunk = [];
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
            chunk.push(`layout (location = ${i}) out vec4 o${i};`);
        }
        return `${chunk.join('')}\n`;
    }

    /**
     * constructor of fragmen.js
     * @param {object} option - オプション
     * @property {HTMLElement} option.target - insert canvas to
     * @property {HTMLElement} [option.eventTarget=target] - event target element or window
     * @property {boolean} [option.mouse=false] - mouse event enable
     * @property {boolean} [option.escape=false] - keydown event enable
     * @property {boolean} [option.resize=false] - resize event enable
     */
    constructor(option){
        /**
         * WebGL コンテキストに紐づく canvas の挿入先となるエレメント
         * @type {HTMLElement}
         */
        this.target = null;
        /**
         * マウスイベントの対象となるエレメント（もしくは window）
         * @type {window|HTMLElement}
         */
        this.eventTarget = null;
        /**
         * WebGL コンテキストに紐づく canvas
         * @type {HTMLCanvasElement}
         */
        this.canvas = null;
        /**
         * WebGL 2.0 で初期化できたかどうか
         * @type {boolean}
         */
        this.isWebGL2 = false;
        /**
         * WebGL のレンダリングコンテキスト
         * @type {WebGLRenderingContext}
         */
        this.gl = null;
        /**
         * リサイズが発生したかどうかのフラグ
         * @type {boolean}
         */
        this.resize = false;
        /**
         * コンテキストの幅
         * @type {number}
         */
        this.width  = 0;
        /**
         * コンテキストの高さ
         * @type {number}
         */
        this.height = 0;
        /**
         * マウスカーソルの座標
         * @type {Array.<number>}
         */
        this.mousePosition = [0.0, 0.0];
        /**
         * 現在設定されているモード
         * @type {number}
         */
        this.mode = Fragmen.MODE_CLASSIC;
        /**
         * アニメーションさせるかどうかのフラグ（コンパイルは普通に行うが描画だけを止める）
         * @type {boolean}
         */
        this.animation = true;
        /**
         * 実行中かどうかのフラグ
         * @type {boolean}
         */
        this.run = false;
        /**
         * レンダリングを開始した時点でのタイムスタンプ
         * @type {number}
         */
        this.startTime = 0;
        /**
         * レンダリング開始からの経過時間（秒）
         * @type {number}
         */
        this.nowTime = 0;
        /**
         * レンダリング開始からの経過フレーム数
         * @type {number}
         */
        this.frameCount = 0;
        /**
         * シェーダプログラム
         * @type {WebGLProgram}
         */
        this.program = null;
        /**
         * uniform ロケーション
         * @type {object}
         */
        this.uniLocation = null;
        /**
         * attribute ロケーション
         * @type {object}
         */
        this.attLocation = null;
        /**
         * Onomat.js からの周波数の入力値
         * @type {number}
         */
        this.frequency = 0;
        /**
         * 頂点シェーダのソースコード
         * @type {string}
         */
        this.VS = '';
        /**
         * フラグメントシェーダのソースコード
         * @type {string}
         */
        this.FS = '';
        /**
         * 転写用シェーダのプログラム
         * @type {WebGLProgram}
         */
        this.postProgram = null;
        /**
         * 転写用シェーダの uniform ロケーション
         * @type {object}
         */
        this.postUniLocation = null;
        /**
         * 転写用シェーダの attribute ロケーション
         * @type {object}
         */
        this.postAttLocation = null;
        /**
         * 転写用シェーダの頂点シェーダのソースコード
         * @type {string}
         */
        this.postVS = '';
        /**
         * 転写用シェーダのフラグメントシェーダのソースコード
         * @type {string}
         */
        this.postFS = '';
        /**
         * バッファリング用フレームバッファ
         * @type {WebGLFrameBuffer}
         */
        this.fFront = null;
        /**
         * バッファリング用フレームバッファ
         * @type {WebGLFrameBuffer}
         */
        this.fBack = null;
        /**
         * バッファリング用フレームバッファ
         * @type {WebGLFrameBuffer}
         */
        this.fTemp = null;
        /**
         * MRT で gl.drawBuffers に指定するアタッチメント用定数を格納する配列
         * @type {Array.<number>}
         */
        this.buffers = null;

        // self binding
        this.render    = this.render.bind(this);
        this.rect      = this.rect.bind(this);
        this.reset     = this.reset.bind(this);
        this.draw      = this.draw.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.keyDown   = this.keyDown.bind(this);
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
        const opt = {alpha: false, preserveDrawingBuffer: true};
        this.gl = this.canvas.getContext('webgl2', opt);
        this.isWebGL2 = this.gl != null;
        if(this.isWebGL2 !== true){
            this.gl = this.canvas.getContext('webgl', opt);
            this.gl.getExtension('OES_standard_derivatives');
        }
        if(this.gl == null){
            console.log('webgl unsupported');
            return;
        }
        // check event
        if(option.hasOwnProperty('eventTarget') && option.eventTarget !== null && option.eventTarget !== undefined){
            this.eventTarget = option.eventTarget;
        }
        if(option.hasOwnProperty('mouse') && option.mouse === true){
            this.eventTarget.addEventListener('pointermove', this.mouseMove, false);
        }
        if(option.hasOwnProperty('escape') && option.escape === true){
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
        let vs = this.createShader(this.postProgram, 0, this.postVS);
        let fs = this.createShader(this.postProgram, 1, this.postFS);
        this.gl.linkProgram(this.postProgram);
        this.gl.deleteShader(vs);
        this.gl.deleteShader(fs);
        this.postUniLocation = {};
        this.postUniLocation.texture = this.gl.getUniformLocation(this.postProgram, 'texture');
        this.postAttLocation = this.gl.getAttribLocation(this.postProgram, 'position');

        this.post300VS = `#version 300 es
in  vec3 position;
out vec2 vTexCoord;
void main(){
    vTexCoord   = (position + 1.0).xy / 2.0;
    gl_Position = vec4(position, 1.0);
}`;
        this.post300FS = `#version 300 es
precision mediump float;
uniform sampler2D drawTexture;
in vec2 vTexCoord;
layout (location = 0) out vec4 outColor;
void main(){
    outColor = texture(drawTexture, vTexCoord);
}`;
        if(this.isWebGL2 === true){
            this.post300Program = this.gl.createProgram();
            vs = this.createShader(this.post300Program, 0, this.post300VS);
            fs = this.createShader(this.post300Program, 1, this.post300FS);
            this.gl.linkProgram(this.post300Program);
            this.gl.deleteShader(vs);
            this.gl.deleteShader(fs);
            this.post300UniLocation = {};
            this.post300UniLocation.texture = this.gl.getUniformLocation(this.post300Program, 'drawTexture');
            this.post300AttLocation = this.gl.getAttribLocation(this.post300Program, 'position');
        }

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
        switch(this.mode){
            case Fragmen.MODE_CLASSIC_MRT:
            case Fragmen.MODE_GEEK_MRT:
            case Fragmen.MODE_GEEKER_MRT:
            case Fragmen.MODE_GEEKEST_MRT:
                this.fFront = this.createFramebufferMRT(this.width, this.height, Fragmen.MRT_TARGET_COUNT);
                this.fBack = this.createFramebufferMRT(this.width, this.height, Fragmen.MRT_TARGET_COUNT);
                break;
            default:
                this.fFront = this.createFramebuffer(this.width, this.height);
                this.fBack = this.createFramebuffer(this.width, this.height);
        }
        this.gl.viewport(0, 0, this.width, this.height);
    }

    /**
     * reset renderer
     */
    reset(){
        this.rect();
        let program = this.gl.createProgram();
        let vs = this.createShader(program, 0, this.preprocessVertexCode(this.VS));
        if(vs === false){
            return;
        }
        let fs = this.createShader(program, 1, this.preprocessFragmentCode(this.FS));
        if(fs === false){
            this.gl.deleteShader(vs);
            return;
        }
        this.gl.linkProgram(program);
        this.gl.deleteShader(vs);
        this.gl.deleteShader(fs);
        if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)){
            let msg = this.gl.getProgramInfoLog(program);
            msg = this.formatErrorMessage(msg);
            console.warn(msg);
            if(this.onBuildCallback != null){
                const t = getTimeString();
                this.onBuildCallback('error', ` ● [ ${t} ] ${msg}`);
            }
            program = null;
            return;
        }
        let resolution = 'resolution';
        let mouse      = 'mouse';
        let time       = 'time';
        let frame      = 'frame';
        let sound      = 'sound';
        let backbuffer = 'backbuffer';
        let mrtBuffers = [];
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){mrtBuffers.push(`backbuffer${i}`);}
        let mrtShortBuffers = [];
        for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){mrtShortBuffers.push(`b${i}`);}
        if(
            this.mode === Fragmen.MODE_GEEK ||
            this.mode === Fragmen.MODE_GEEKER ||
            this.mode === Fragmen.MODE_GEEKEST ||
            this.mode === Fragmen.MODE_GEEK_300 ||
            this.mode === Fragmen.MODE_GEEKER_300 ||
            this.mode === Fragmen.MODE_GEEKEST_300 ||
            this.mode === Fragmen.MODE_GEEK_MRT ||
            this.mode === Fragmen.MODE_GEEKER_MRT ||
            this.mode === Fragmen.MODE_GEEKEST_MRT
        ){
            resolution = 'r';
            mouse      = 'm';
            time       = 't';
            frame      = 'f';
            sound      = 's';
            backbuffer = 'b';
        }
        if(this.program != null){this.gl.deleteProgram(this.program);}
        this.program = program;
        this.gl.useProgram(this.program);
        this.uniLocation = {};
        this.uniLocation.resolution = this.gl.getUniformLocation(this.program, resolution);
        this.uniLocation.mouse = this.gl.getUniformLocation(this.program, mouse);
        this.uniLocation.time = this.gl.getUniformLocation(this.program, time);
        this.uniLocation.frame = this.gl.getUniformLocation(this.program, frame);
        this.uniLocation.sound = this.gl.getUniformLocation(this.program, sound);
        switch(this.mode){
            case Fragmen.MODE_CLASSIC_MRT:
                for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
                    this.uniLocation[`sampler${i}`] = this.gl.getUniformLocation(this.program, mrtBuffers[i]);
                }
                break;
            case Fragmen.MODE_GEEK_MRT:
            case Fragmen.MODE_GEEKER_MRT:
            case Fragmen.MODE_GEEKEST_MRT:
                for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
                    this.uniLocation[`sampler${i}`] = this.gl.getUniformLocation(this.program, mrtShortBuffers[i]);
                }
                break;
            default:
                this.uniLocation.sampler = this.gl.getUniformLocation(this.program, backbuffer);
        }
        this.attLocation = this.gl.getAttribLocation(this.program, 'p');
        this.mousePosition = [0.0, 0.0];
        this.startTime = Date.now();
        this.frameCount = 0;
        if(!this.run){
            this.run = true;
            this.draw();
        }
    }

    /**
     * rendering
     */
    draw(){
        if(!this.run){return;}
        if(this.animation === true){
            requestAnimationFrame(this.draw);
        }
        this.nowTime = (Date.now() - this.startTime) * 0.001;
        ++this.frameCount;
        this.gl.useProgram(this.program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fFront.f);
        if(Array.isArray(this.fBack.t) === true){
            this.gl.drawBuffers(this.buffers);
            for(let i = 0; i < Fragmen.MRT_TARGET_COUNT; ++i){
                this.gl.activeTexture(this.gl.TEXTURE0 + i);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.fBack.t[i]);
                this.gl.uniform1i(this.uniLocation[`sampler${i}`], i);
            }
        }else{
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.fBack.t);
            this.gl.uniform1i(this.uniLocation.sampler, 0);
        }
        this.gl.enableVertexAttribArray(this.attLocation);
        this.gl.vertexAttribPointer(this.attLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.uniform2fv(this.uniLocation.mouse, this.mousePosition);
        this.gl.uniform1f(this.uniLocation.time, this.nowTime);
        this.gl.uniform1f(this.uniLocation.frame, this.frameCount);
        this.gl.uniform2fv(this.uniLocation.resolution, [this.width, this.height]);
        this.gl.uniform1f(this.uniLocation.sound, this.frequency);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        if(Array.isArray(this.fBack.t) === true){
            this.gl.useProgram(this.post300Program);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.fFront.t[0]);
            this.gl.enableVertexAttribArray(this.post300AttLocation);
            this.gl.vertexAttribPointer(this.post300AttLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.uniform1i(this.post300UniLocation.texture, 0);
        }else{
            this.gl.useProgram(this.postProgram);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.fFront.t);
            this.gl.enableVertexAttribArray(this.postAttLocation);
            this.gl.vertexAttribPointer(this.postAttLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.uniform1i(this.postUniLocation.texture, 0);
        }
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
     * @return {boolean|WebGLShader} compiled shader object or false
     */
    createShader(p, i, j){
        if(!this.gl){return false;}
        const k = this.gl.createShader(this.gl.VERTEX_SHADER - i);
        this.gl.shaderSource(k, j);
        this.gl.compileShader(k);
        const t = getTimeString();
        if(!this.gl.getShaderParameter(k, this.gl.COMPILE_STATUS)){
            let msg = this.gl.getShaderInfoLog(k);
            msg = this.formatErrorMessage(msg);
            console.warn(msg);
            if(this.onBuildCallback != null){
                this.onBuildCallback('error', ` ● [ ${t} ] ${msg}`);
            }
            return false;
        }
        if(this.onBuildCallback != null){
            this.onBuildCallback('success', ` ● [ ${t} ] shader compile succeeded`);
        }
        this.gl.attachShader(p, k);
        const l = this.gl.getShaderInfoLog(k);
        if(l !== ''){console.info('shader info: ' + l);}
        return k;
    }

    /**
     * create framebuffer
     * @param {number} width - set to framebuffer width
     * @param {number} height - set to framebuffer height
     * @return {object} custom object
     * @property {WebGLFramebuffer} f
     * @property {WebGLRenderbuffer} d
     * @property {WebGLTexture} t
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
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, fTexture, 0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return {f: frameBuffer, d: depthRenderBuffer, t: fTexture};
    }

    /**
     * create framebuffer
     * @param {number} width - set to framebuffer width
     * @param {number} height - set to framebuffer height
     * @param {number} count - colorbuffer count
     * @return {object} custom object
     * @property {WebGLFramebuffer} f
     * @property {WebGLRenderbuffer} d
     * @property {WebGLTexture} t
     */
    createFramebufferMRT(width, height, count){
        const frameBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
        const depthRenderBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthRenderBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, depthRenderBuffer);
        const fTexture = [];
        this.buffers = [];
        for(let i = 0; i < count; ++i){
            const tex = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + i, this.gl.TEXTURE_2D, tex, 0);
            fTexture.push(tex);
            this.buffers.push(this.gl.COLOR_ATTACHMENT0 + i);
        }
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
        if(obj.hasOwnProperty('t') && Array.isArray(obj.t) === true){
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            obj.t.forEach((texture) => {
                this.gl.deleteTexture(texture);
                texture = null;
            });
        }else if(obj.hasOwnProperty('t') && obj.t != null && this.gl.isTexture(obj.t)){
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
        if(eve.clientY > this.target.height){return;}
        const x = Math.min(eve.clientX, this.target.width);
        const y = Math.min(eve.clientY, this.target.height);
        this.mousePosition = [x / this.target.width, 1.0 - y / this.target.height];
    }

    /**
     * key event
     */
    keyDown(eve){
        if(this.gl === null){return;}
        this.run = (eve.keyCode !== 27);
    }

    /**
     * ビルド完了時に呼ばれるコールバックを登録する
     * @param {function}
     */
    onBuild(callback){
        this.onBuildCallback = callback;
    }
    /**
     * 描画完了時に呼ばれるコールバックを登録する
     * @param {function}
     */
    onDraw(callback){
        this.onDrawCallback = callback;
    }

    /**
     * 周波数を更新する
     * @param {number} frequency - 周波数（正確ではないがここでは音量の意味）
     */
    setFrequency(frequency){
        this.frequency = frequency;
    }

    /**
     * アニメーションさせるかどうかを設定する
     * @param {boolean} animate - アニメーションさせるかどうかの真偽値
     */
    setAnimation(animate){
        this.animation = animate;
    }

    /**
     * this.mode により適切にコードを変換する
     * @private
     * @param {string} source - 対象となる頂点シェーダのソースコード
     */
    preprocessVertexCode(source){
        switch(this.mode){
            case Fragmen.MODE_CLASSIC_300:
            case Fragmen.MODE_GEEK_300:
            case Fragmen.MODE_GEEKER_300:
            case Fragmen.MODE_GEEKEST_300:
            case Fragmen.MODE_CLASSIC_MRT:
            case Fragmen.MODE_GEEK_MRT:
            case Fragmen.MODE_GEEKER_MRT:
            case Fragmen.MODE_GEEKEST_MRT:
                return Fragmen.ES_300_CHUNK + source.replace(/attribute/g, 'in');
            default:
                return source;
        }
    }

    /**
     * this.mode により適切にコードを変換する
     * @private
     * @param {string} code - 対象となるフラグメントシェーダのソースコード
     */
    preprocessFragmentCode(code){
        let chunk300 = '';
        let chunkOut = '';
        let chunkMain = ''
        let chunkClose = ''
        switch(this.mode){
            case Fragmen.MODE_GEEKER:
                chunkOut = Fragmen.GEEKER_CHUNK;
                break;
            case Fragmen.MODE_GEEKEST:
                chunkOut = Fragmen.GEEKEST_CHUNK;
                chunkMain = 'void main(){\n'
                chunkClose = '\n}'
                break;
            case Fragmen.MODE_CLASSIC_300:
            case Fragmen.MODE_GEEK_300:
            case Fragmen.MODE_CLASSIC_MRT:
            case Fragmen.MODE_GEEK_MRT:
                chunk300 = Fragmen.ES_300_CHUNK;
                break;
            case Fragmen.MODE_GEEKER_300:
                chunk300 = Fragmen.ES_300_CHUNK;
                chunkOut = Fragmen.GEEKER_CHUNK.substr(0, Fragmen.GEEKER_CHUNK.length - 1) + Fragmen.GEEKER_OUT_CHUNK;
                break;
            case Fragmen.MODE_GEEKER_MRT:
                chunk300 = Fragmen.ES_300_CHUNK;
                chunkOut = Fragmen.GEEKER_MRT_CHUNK.substr(0, Fragmen.GEEKER_MRT_CHUNK.length - 1) + Fragmen.GEEKER_OUT_MRT_CHUNK;
                break;
            case Fragmen.MODE_GEEKEST_300:
                chunk300 = Fragmen.ES_300_CHUNK;
                chunkOut = Fragmen.GEEKEST_CHUNK.substr(0, Fragmen.GEEKEST_CHUNK.length - 1) + Fragmen.GEEKEST_OUT_CHUNK;
                chunkMain = 'void main(){\n'
                chunkClose = '\n}'
                break;
            case Fragmen.MODE_GEEKEST_MRT:
                chunk300 = Fragmen.ES_300_CHUNK;
                chunkOut = Fragmen.GEEKEST_MRT_CHUNK.substr(0, Fragmen.GEEKEST_MRT_CHUNK.length - 1) + Fragmen.GEEKEST_OUT_MRT_CHUNK;
                chunkMain = 'void main(){\n'
                chunkClose = '\n}'
                break;
            default:
                break;
        }
        return chunk300 + chunkOut + chunkMain + code + chunkClose;
    }

    /**
     * this.mode に応じてエラー行番号をインクリメントする
     * @param {string} message
     * @private
     */
    formatErrorMessage(message){
        let dec = 0;
        let noiseDec = noise.split('\n').length;
        switch(this.mode){
            case Fragmen.MODE_CLASSIC:
            case Fragmen.MODE_GEEK:
                dec = 0;
                break;
            case Fragmen.MODE_GEEKER:
                dec += 1;
                break;
            case Fragmen.MODE_GEEKEST:
                dec += 3 + noiseDec;
                break;
            case Fragmen.MODE_CLASSIC_300:
            case Fragmen.MODE_GEEK_300:
            case Fragmen.MODE_CLASSIC_MRT:
            case Fragmen.MODE_GEEK_MRT:
                dec += 1;
                break;
            case Fragmen.MODE_GEEKER_300:
                dec += 2;
                break;
            case Fragmen.MODE_GEEKER_MRT:
                dec += 2;
                break;
            case Fragmen.MODE_GEEKEST_300:
                dec += 4 + noiseDec;
                break;
            case Fragmen.MODE_GEEKEST_MRT:
                dec += 4 + noiseDec;
                break;
        }
        return message.replace(/^ERROR: (\d+):(\d+)/gm, (...args) => {
            const line = parseInt(args[2]) - dec;
            return `ERROR: ${args[1]}:${line}`;
        });
    }
}

/**
 * 時刻を常に２桁に揃える
 * @return {string}
 */
function getTimeString(){
    const d = new Date();
    const h = (new Array(2).join('0') + d.getHours()).substr(-2, 2);
    const m = (new Array(2).join('0') + d.getMinutes()).substr(-2, 2);
    return `${h}:${m}`;
}

