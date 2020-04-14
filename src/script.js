
import 'whatwg-fetch';
import Promise from 'promise-polyfill';
import {Fragmen} from './fragmen.js';

let editor = null;
let canvas = null;
let lineout = null;
let counter = null;
let message = null;
let mode = null;
let frames = null;
let size = null;
let download = null;

let latestStatus = 'success';
let isEncoding = false;

let fragmen = null;
let geek = false;
const FRAGMEN_OPTION = {
    target: null,
    eventTarget: null,
    mouse: true,
    resize: true,
    escape: false
};

window.addEventListener('DOMContentLoaded', () => {
    editor = editorSetting();
    canvas = document.querySelector('#webgl');
    lineout = document.querySelector('#lineout');
    counter = document.querySelector('#counter');
    message = document.querySelector('#message');
    mode = document.querySelector('#modeselect');
    frames = document.querySelector('#frameselect');
    size = document.querySelector('#sizeselect');
    download = document.querySelector('#downloadgif');
    window.addEventListener('resize', resize, false);
    resize();

    mode.addEventListener('change', () => {
        const source = editor.getValue();
        geek = mode.value !== 'classic';
        fragmen.geek = geek;
        if(geek === true && source === DEFAULT_SOURCE){
            editor.setValue(DEFAULT_GEEK_SOURCE);
            setTimeout(() => {editor.gotoLine(1);}, 100);
            fragmen.render(editor.getValue());
        }else if(geek !== true && source === DEFAULT_GEEK_SOURCE){
            editor.setValue(DEFAULT_SOURCE);
            setTimeout(() => {editor.gotoLine(1);}, 100);
            fragmen.render(editor.getValue());
        }
    }, false);
    download.addEventListener('click', () => {
        if(
            download.classList.contains('disabled') === true ||
            isEncoding === true
        ){return;}
        download.classList.add('disabled');
        isEncoding = true;
        setTimeout(() => {
            const f = parseInt(frames.value);
            const s = size.value.split('x');
            const w = parseInt(s[0]);
            const h = parseInt(s[1]);
            captureGif(f, w, h);
        }, 100);
    }, false);

    const option = Object.assign(FRAGMEN_OPTION, {
        target: canvas,
        eventTarget: canvas,
    });
    fragmen = new Fragmen(option);
    fragmen.onBuild((status, msg) => {
        latestStatus = status;
        lineout.classList.remove('warn');
        lineout.classList.remove('error');
        lineout.classList.add(status);
        message.textContent = msg;
        switch(status){
            case 'warn':
            case 'error':
                download.classList.add('disabled');
                break;
            default:
                download.classList.remove('disabled');
        }
    });
    fragmen.render(DEFAULT_SOURCE);
    counter.textContent = `${DEFAULT_SOURCE.length} char`;
    message.textContent = 'hello world';
}, false);

function resize(){
    const canvas = document.querySelector('#webgl');
    const bound = canvas.parentElement.getBoundingClientRect();
    canvas.width = bound.width;
    canvas.height = bound.height;
}

function update(source){
    if(fragmen == null){return;}
    fragmen.render(source);
}

function editorSetting(){
    const editor = ace.edit('editor');
    editor.setTheme('ace/theme/merbivore_soft');
    editor.session.setOption("indentedSoftWrap", false);
    editor.session.setUseWrapMode(true);
    editor.session.setMode('ace/mode/glsl');
    editor.session.setTabSize(2);
    editor.session.setUseSoftTabs(true);
    editor.$blockScrolling = Infinity;
    editor.setShowPrintMargin(false);
    editor.setHighlightSelectedWord(true);
    editor.setValue(DEFAULT_SOURCE);

    let timeoutId = null;
    editor.session.on('change', (evt) => {
        if(timeoutId != null){
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            update(editor.getValue());
        }, 1000);
        counter.textContent = `${editor.getValue().length} char`;
    });
    setTimeout(() => {editor.gotoLine(1);}, 100);
    return editor;
}

function captureGif(frame = 120, width = 256, height = 256){
    const capture = new CCapture({
        verbose: false,
        format: 'gif',
        workersPath: './js/',
        framerate: 60,
        quality: 100,
        onProgress: (range) => {
            const p = Math.floor(range * 100);
            download.textContent = `${p}%`;

            if(range >= 1.0){
                setTimeout(() => {
                    download.classList.remove('disabled');
                    download.textContent = 'gif';
                    isEncoding = false;
                }, 2000);
            }
        },
    });

    let captureCanvas = document.createElement('canvas');
    captureCanvas.width = width;
    captureCanvas.height = height;
    captureCanvas.style.position = 'absolute';
    captureCanvas.style.top = '-9999px';
    captureCanvas.style.left = '-9999px';
    document.body.appendChild(captureCanvas);
    const option = Object.assign(FRAGMEN_OPTION, {
        target: captureCanvas,
        eventTarget: captureCanvas,
    });
    let frag = new Fragmen(option);
    frag.geek = geek;
    let frameCount = 0;
    frag.onDraw(() => {
        if(frameCount < frame){
            capture.capture(captureCanvas);
        }else{
            frag.run = false;
            capture.stop();
            capture.save();
            setTimeout(() => {
                document.body.removeChild(captureCanvas);
                captureCanvas = null;
                frag = null;
            }, 500);
        }
        ++frameCount;
    });
    download.textContent = 'generate...';
    capture.start();
    frag.render(editor.getValue());
}

const DEFAULT_SOURCE = `precision highp float;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
void main(){vec2 p=(gl_FragCoord.xy*2.-resolution)/resolution-mouse;for(int i=0;i<8;++i){p.yx=abs(p)/abs(dot(p,p))-vec2(.8+sin(time*.2)*.3);}gl_FragColor=vec4(p,.5,1);}`;
const DEFAULT_GEEK_SOURCE = `precision highp float;
uniform vec2 r;
uniform vec2 m;
uniform float t;
void main(){vec2 p=(gl_FragCoord.xy*2.-r)/r-m;for(int i=0;i<8;++i){p.yx=abs(p)/abs(dot(p,p))-vec2(.8+sin(t*.2)*.3);}gl_FragColor=vec4(p,.5,1);}`;


