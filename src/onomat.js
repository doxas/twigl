
import EventEmitter3 from 'eventemitter3';

export class Onomat extends EventEmitter3 {
    static get EVENT(){return ['build', 'play', 'stop'];}
    static get FFT_SIZE(){return 16;}
    static get DURATION(){return 180;}
    static get BUFFER_WIDTH(){return 512;}
    static get BUFFER_HEIGHT(){return 512;}
    static get VERTEX_SHADER_SOURCE(){return 'attribute vec3 p;void main(){gl_Position=vec4(p,1.);}'};
    static get FRAGMENT_SHADER_SOURCE_DEFAULT(){return `vec2 mainSound(float time){
    return vec2(sin(6.2831*440.*time)*exp(-3.*time));
}`;};
    static get FRAGMENT_SHADER_SOURCE_HEADER(){return `precision highp float;
uniform float blockOffset;
uniform float sampleRate;
`;}
    static get FRAGMENT_SHADER_SOURCE_FOOTER(){return `void main(){
   float time = blockOffset + ((gl_FragCoord.x - 0.5) + (gl_FragCoord.y - 0.5) * 512.0) / sampleRate;
   vec2 y = mainSound(time);
   vec2 v = floor((0.5 + 0.5 * y) * 65536.0);
   vec2 l = mod(v, 256.0) / 255.0;
   vec2 h = floor(v / 256.0) / 255.0;
   gl_FragColor = vec4(l.x, h.x, l.y, h.y);
}`;}

    constructor(){
        super();

        this.isWebGL2 = false;
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.vs = null;
        this.fs = null;
        this.source = '';
        this.attLocation = null;
        this.uniLocation = null;
        this.audioCtx = null;
        this.audioBufferSourceNode = null;
        this.audioAnalyserNode = null;
        this.audioFrequencyBitCount = 0;
        this.isPlay = false;

        this.init();
    }

    init(){
        this.canvas = document.createElement('canvas');
        this.canvas.width = Onomat.BUFFER_WIDTH;
        this.canvas.height = Onomat.BUFFER_HEIGHT;
        this.gl = this.canvas.getContext('webgl2');
        this.isWebGL2 = this.gl != null;
        if(this.isWebGL2 !== true){
            this.gl = this.canvas.getContext('webgl', opt);
        }
        if(this.gl == null){
            console.log('webgl unsupported');
            return;
        }
        this.vs = this.createShader(Onomat.VERTEX_SHADER_SOURCE, true);
        this.audioCtx = new AudioContext();
    }

    render(source, draw = false){
        const fragment = `${Onomat.FRAGMENT_SHADER_SOURCE_HEADER}\n${source}\n${Onomat.FRAGMENT_SHADER_SOURCE_FOOTER}`;
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
                message: ` > [ ${t} ] ${msg}`,
                source: source,
            });
            program = null;
            return;
        }else{
            const t = getTimeString();
            this.emit('build', {
                status: 'success',
                message: ` > [ ${t} ] shader compile succeeded`,
                source: source,
            });
        }

        if(draw !== true){return;}

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

    draw(){
        const sample = this.audioCtx.sampleRate;
        const buffer = this.audioCtx.createBuffer(2, sample * Onomat.DURATION, sample);
        const channelDataLeft  = buffer.getChannelData(0);
        const channelDataRight = buffer.getChannelData(1);
        const range = Onomat.BUFFER_WIDTH * Onomat.BUFFER_HEIGHT;
        const pixel = new Uint8Array(Onomat.BUFFER_WIDTH * Onomat.BUFFER_HEIGHT * 4);

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
        if(this.isPlay === true){
            this.audioBufferSourceNode.stop();
            this.isPlay = false;
            this.emit('stop');
        }
        this.audioBufferSourceNode = this.audioCtx.createBufferSource();
        this.audioAnalyserNode = this.audioCtx.createAnalyser();
        this.audioAnalyserNode.smoothingTimeConstant = 0.8;
        this.audioAnalyserNode.fftSize = Onomat.FFT_SIZE * 2;
        this.audioFrequencyBitCount = this.audioAnalyserNode.frequencyBinCount;

        this.audioBufferSourceNode.connect(this.audioAnalyserNode);
        this.audioAnalyserNode.connect(this.audioCtx.destination);
        this.audioBufferSourceNode.buffer = buffer;
        this.audioBufferSourceNode.loop = false;
        this.audioBufferSourceNode.start();
        this.isPlay = true;
        this.emit('play');
    }

    getFrequency(){
        if(this.isPlay !== true){return;}
        const array = new Uint8Array(this.audioFrequencyBitCount);
        this.audioAnalyserNode.getByteFrequencyData(array);
        return array;
    }
    getFrequencyFloat(){
        if(this.isPlay !== true){return;}
        const array = this.getFrequency();
        const freq = array.reduce((accumu, current) => {
            return accumu + current;
        });
        return Math.min(Math.max(freq / (Onomat.FFT_SIZE * 255) - 0.15, 0.0) / 0.85, 1.0);
    }

    stop(){
        if(this.isPlay === true){
            this.audioBufferSourceNode.stop();
            this.isPlay = false;
            this.emit('stop');
        }
    }

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
                message: ` > [ ${t} ] ${msg}`,
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


