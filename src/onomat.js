
import EventEmitter3 from 'eventemitter3';

/**
 * @class
 * @extends EventEmitter3
 */
export class Onomat extends EventEmitter3 {
    /**
     * 発火するイベント
     * @type {Array.<string>}
     */
    static get EVENT(){return ['build', 'play', 'stop'];}
    /**
     * analyser に指定する FFT サイズ
     * @type {number}
     */
    static get FFT_SIZE(){return 128;}
    /**
     * 秒単位の全体の長さ
     * @type {number}
     */
    static get DURATION(){return 180;}
    /**
     * レンダリングするバッファの幅
     * @type {number}
     */
    static get BUFFER_WIDTH(){return 512;}
    /**
     * レンダリングするバッファの高さ
     * @type {number}
     */
    static get BUFFER_HEIGHT(){return 512;}
    /**
     * 頂点シェーダのソース
     * @type {string}
     */
    static get VERTEX_SHADER_SOURCE(){return 'attribute vec3 p;void main(){gl_Position=vec4(p,1.);}'};
    /**
     * フラグメントシェーダのソース（編集可能なソース）
     * @type {string}
     */
    static get FRAGMENT_SHADER_SOURCE_DEFAULT(){return `vec2 mainSound(float time){
  return vec2(sin(6.2831*440.*time)*exp(-3.*time));
}`;};
    /**
     * フラグメントシェーダのソースに付与されるヘッダ部分
     * @type {string}
     */
    static get FRAGMENT_SHADER_SOURCE_HEADER(){return `precision highp float;
uniform float blockOffset;
uniform float sampleRate;
`;}
    /**
     * フラグメントシェーダのソースに付与されるフッター部分
     * @type {string}
     */
    static get FRAGMENT_SHADER_SOURCE_FOOTER(){return `void main(){
  float time = blockOffset + ((gl_FragCoord.x - 0.5) + (gl_FragCoord.y - 0.5) * 512.0) / sampleRate;
  vec2 XY = mainSound(time);
  vec2 XV = floor((0.5 + 0.5 * XY) * 65536.0);
  vec2 XL = mod(XV, 256.0) / 255.0;
  vec2 XH = floor(XV / 256.0) / 255.0;
  gl_FragColor = vec4(XL.x, XH.x, XL.y, XH.y);
}`;}

    /**
     * コンストラクタを呼ぶタイミングでユーザーからなんらかの干渉を
     * 受けている必要がある（AudioContext の初期化ができないため）
     * @constructor
     */
    constructor(){
        super();

        /**
         * WebGL 2.0 で初期化できたかどうか
         * @type {boolean}
         */
        this.isWebGL2 = false;
        /**
         * レンダリングに利用する canvas
         * @type {HTMLCanvasElement}
         */
        this.canvas = null;
        /**
         * WebGL コンテキスト
         * @type {WebGLRenderingContext}
         */
        this.gl = null;
        /**
         * シェーダプログラム
         * @type {WebGLProgram}
         */
        this.program = null;
        /**
         * 頂点シェーダオブジェクト
         * @type {WebGLShader}
         */
        this.vs = null;
        /**
         * フラグメントシェーダオブジェクト
         * @type {WebGLShader}
         */
        this.fs = null;
        /**
         * フラグメントシェーダの編集可能なソース
         * @type {string}
         */
        this.source = '';
        /**
         * attribute location の一覧
         * @type {Array.<number>}
         */
        this.attLocation = null;
        /**
         * uniform location の一覧
         * @type {Array.<WebGLUniformLocation>}
         */
        this.uniLocation = null;
        /**
         * WebAudio のコンテキスト
         * @type {AudioContext}
         */
        this.audioCtx = null;
        /**
         * 音声の再生に利用する AudioBufferSourceNode
         * @type {AudioBufferSourceNode}
         */
        this.audioBufferSourceNode = null;
        /**
         * 周波数を得るための AnalyserNode
         * @type {AnalyserNode}
         */
        this.audioAnalyserNode = null;
        /**
         * AnalyserNode から取得する frequencyBinCount
         * @type {number}
         */
        this.audioFrequencyBinCount = 0;
        /**
         * 再生中かどうかのフラグ
         * @type {boolean}
         */
        this.isPlay = false;

        // initialize
        this.init();
    }

    /**
     * AudioContext の初期化処理や canvas の初期化を行う
     */
    init(){
        // canvas を内部的に生成して WebGL を初期化する
        this.canvas = document.createElement('canvas');
        this.canvas.width = Onomat.BUFFER_WIDTH;
        this.canvas.height = Onomat.BUFFER_HEIGHT;
        // WebGL 2.0 での初期化を試みる
        this.gl = this.canvas.getContext('webgl2');
        this.isWebGL2 = this.gl != null;
        if(this.isWebGL2 !== true){
            // WebGL 2.0 が無理だった場合 1.0 での初期化を試みる
            this.gl = this.canvas.getContext('webgl', opt);
        }
        if(this.gl == null){
            console.log('webgl unsupported');
            return;
        }
        // 頂点シェーダを生成
        this.vs = this.createShader(this.versionDirective(this.attributeDirective(Onomat.VERTEX_SHADER_SOURCE), false), true);
        // AudioContext を生成
        this.audioCtx = new AudioContext();
    }

    /**
     * WebGL 2.0 が有効かどうかによりバージョンディレクティブを付与する
     * @param {string} source - シェーダのソースコード
     * @param {boolean} [addOutColor=true] - `outColor` を末尾に付与するかどうか
     * @return {string}
     */
    versionDirective(source, addOutColor = true){
        if(this.isWebGL2 === true){
            return `#version 300 es\n${source}\n${addOutColor === true ? 'out vec4 outColor;\n' : ''}`;
        }else{
            return source;
        }
    }
    /**
     * WebGL 2.0 が有効かどうかにより `attribute` を `in` に変換する
     * @param {string} source - シェーダのソースコード
     * @return {string}
     */
    attributeDirective(source){
        if(this.isWebGL2 === true){
            return source.replace(/attribute/, 'in');
        }else{
            return source;
        }
    }
    /**
     * WebGL 2.0 が有効かどうかにより `gl_FragColor` を `outColor` に変換する
     * @param {string} source - シェーダのソースコード
     * @return {string}
     */
    outDirective(source){
        if(this.isWebGL2 === true){
            return source.replace(/gl_FragColor/, 'outColor');
        }else{
            return source;
        }
    }

    /**
     * シェーダのソースコードをコンパイルし場合により描画処理を呼び出す
     * @param {string} source - シェーダのソースコード
     * @param {boolean} [draw=false] - 描画まで行うかどうかのフラグ
     */
    render(source, draw = false){
        // WebGL 2.0 かどうかなどを踏まえつつシェーダの各セクションをつなぐ
        const header = this.versionDirective(Onomat.FRAGMENT_SHADER_SOURCE_HEADER);
        const footer = this.outDirective(Onomat.FRAGMENT_SHADER_SOURCE_FOOTER);
        const fragment = `${header}\n${source}\n${footer}`;
        // シェーダをコンパイルしプログラムをリンク
        this.fs = this.createShader(fragment, false);
        if(this.fs == null || this.fs === false){return;}
        let program = this.gl.createProgram();
        this.gl.attachShader(program, this.vs);
        this.gl.attachShader(program, this.fs);
        this.gl.linkProgram(program);
        this.gl.deleteShader(this.fs);
        if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)){
            let msg = this.gl.getProgramInfoLog(program);
            console.warn(msg);
            const t = getTimeString();
            this.emit('build', {
                status: 'error',
                message: ` ● [ ${t} ] ${msg}`,
                source: source,
            });
            program = null;
            return;
        }else{
            const t = getTimeString();
            this.emit('build', {
                status: 'success',
                message: ` ● [ ${t} ] shader compile succeeded`,
                source: source,
            });
        }

        if(draw !== true){return;}

        // プログラム生成まで問題なければプロパティに保持しレンダリング
        if(this.program != null){this.gl.deleteProgram(this.program);}
        this.program = program;
        this.gl.useProgram(this.program);
        this.attLocation = this.gl.getAttribLocation(this.program, 'p');
        this.uniLocation = {
            blockOffset: this.gl.getUniformLocation(this.program, 'blockOffset'),
            sampleRate: this.gl.getUniformLocation(this.program, 'sampleRate'),
        };
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,1,0,-1,-1,0,1,1,0,1,-1,0]), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.attLocation);
        this.gl.vertexAttribPointer(this.attLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.disable(this.gl.BLEND);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.viewport(0, 0, Onomat.BUFFER_WIDTH, Onomat.BUFFER_HEIGHT);

        this.draw();
    }

    /**
     * 描画を行うと同時に音源を生成し、再生まで行う
     */
    draw(){
        // WebAudio 関係の初期設定
        const sample = this.audioCtx.sampleRate;
        const buffer = this.audioCtx.createBuffer(2, sample * Onomat.DURATION, sample);
        const channelDataLeft  = buffer.getChannelData(0);
        const channelDataRight = buffer.getChannelData(1);
        const range = Onomat.BUFFER_WIDTH * Onomat.BUFFER_HEIGHT;
        const pixel = new Uint8Array(Onomat.BUFFER_WIDTH * Onomat.BUFFER_HEIGHT * 4);

        // 全フレームを描画し、readPixels し、描画結果から波形データを配列に確保
        this.gl.uniform1f(this.uniLocation.sampleRate, sample);
        const block = Math.ceil((sample * Onomat.DURATION) / range);
        for(let i = 0, j = block; i < j; ++i){
            this.gl.uniform1f(this.uniLocation.blockOffset, i * range / sample);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            this.gl.readPixels(0, 0, Onomat.BUFFER_WIDTH, Onomat.BUFFER_HEIGHT, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
            for(let k = 0, l = range; k < l; ++k){
                channelDataLeft[i * range + k]  = (pixel[k * 4 + 0] + 256 * pixel[k * 4 + 1]) / 65535 * 2 - 1;
                channelDataRight[i * range + k] = (pixel[k * 4 + 2] + 256 * pixel[k * 4 + 3]) / 65535 * 2 - 1;
            }
        }
        // 既に再生中の物がある場合停止する
        if(this.isPlay === true){
            this.audioBufferSourceNode.stop();
            this.isPlay = false;
            this.emit('stop');
        }
        // 再生のための準備と再生処理
        this.audioBufferSourceNode = this.audioCtx.createBufferSource();
        this.audioAnalyserNode = this.audioCtx.createAnalyser();
        this.audioAnalyserNode.smoothingTimeConstant = 0.8;
        this.audioAnalyserNode.fftSize = Onomat.FFT_SIZE * 2;
        this.audioFrequencyBinCount = this.audioAnalyserNode.frequencyBinCount;

        this.audioBufferSourceNode.connect(this.audioAnalyserNode);
        this.audioAnalyserNode.connect(this.audioCtx.destination);
        this.audioBufferSourceNode.buffer = buffer;
        this.audioBufferSourceNode.loop = false;
        this.audioBufferSourceNode.start();
        this.isPlay = true;
        this.emit('play');
    }

    /**
     * 周波数データを AnalyserNode 経由で取得する
     * @return {Uint8Array}
     */
    getFrequency(){
        if(this.isPlay !== true){return;}
        const array = new Uint8Array(this.audioFrequencyBinCount);
        this.audioAnalyserNode.getByteFrequencyData(array);
        return array;
    }
    /**
     * 周波数データを単一の float に変換する
     * @return {number}
     */
    getFrequencyFloat(){
        if(this.isPlay !== true){return 0.0;}
        let f = 0;
        const array = this.getFrequency();
        for(let i = 0, j = array.length; i < j; ++i){
            f += (array[i] / 255) / Math.log(i + 2);
        }
        const range = Math.log(Onomat.FFT_SIZE);
        return f / (range * range);
    }
    /**
     * 再生中の音声を停止する
     */
    stop(){
        if(this.isPlay === true){
            this.audioBufferSourceNode.stop();
            this.isPlay = false;
            this.emit('stop');
        }
    }

    /**
     * シェーダオブジェクトのコンパイル
     * @param {string} source - シェーダのソースコード
     * @param {boolean} isVertexShader - 頂点シェーダかどうか
     * @return {WebGLShader}
     */
    createShader(source, isVertexShader){
        const type = isVertexShader === true ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER;
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)){
            let msg = this.gl.getShaderInfoLog(shader);
            console.warn(msg);
            const t = getTimeString();
            this.emit('build', {
                status: 'error',
                message: ` ● [ ${t} ] ${msg}`,
                source: source,
            });
            return false;
        }
        return shader;
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


