
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
let tweet = null;
let download = null;

let latestStatus = 'success';
let isEncoding = false;

let fragmen = null;
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
    tweet = document.querySelector('#tweet');
    download = document.querySelector('#downloadgif');
    window.addEventListener('resize', resize, false);
    resize();
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
    tweet.addEventListener('click', () => {
        // const anchor = document.createElement('a');
        // let source = editor.getValue();
        // source = source.replace(/\n\r/g, '%0A');
        // source = source.replace(/\n/g, '%0A');
        // source = source.replace(/\r/g, '%0A');
        // anchor.setAttribute('href', `https://twitter.com/intent/tweet?text=${source}&hashtags=つぶやきGLSL`);
        // anchor.setAttribute('rel', 'nofollow');
        // anchor.onClick = () => {
        //     window.open(encodeURI(decodeURI(anchor.href)),'twwindow','width=550, height=450, personalbar=0, toolbar=0, scrollbars=1');
        //     return false;
        // };
        // anchor.click();
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
    const frag = new Fragmen(option);
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

const DEFAULT_SOURCE = `#define t time
precision lowp float;uniform float t;void main(){vec2 u=gl_FragCoord.xy;u.y+=t*3e2;float d,k=1e2;vec3 c=vec3(0);for(int i=0;i<3;i++){d=floor(mod(u.x,k)/k*3.),c+=clamp(mod(d+vec3(2,1,0),3.)-1.,0.,1.),u*=-mat2(.5,-.866,.866,.5);}gl_FragColor=vec4(c,1);}`;


