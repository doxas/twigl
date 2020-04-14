
import 'whatwg-fetch';
import Promise from 'promise-polyfill';
import {Fragmen} from './fragmen.js';

let editor   = null; // Ace editor のインスタンス
let canvas   = null; // スクリーン
let lineout  = null; // ステータスバー DOM
let counter  = null; // 文字数カウンター DOM
let message  = null; // メッセージ DOM
let mode     = null; // variable mode select
let frames   = null; // render frame select
let size     = null; // resolution select
let download = null; // download button

let latestStatus = 'success'; // 直近のステータス
let isEncoding   = false;     // エンコード中かどうか
let geek         = false;     // geek モードかどうか
let fragmen      = null;      // fragmen.js のインスタンス

// fragmen.js 用のオプションの雛形
const FRAGMEN_OPTION = {
    target: null,
    eventTarget: null,
    mouse: true,
    resize: true,
    escape: false
};
// 既定のソース（classic mode）
const DEFAULT_SOURCE = 'void main(){vec2 r=resolution;vec2 p=(gl_FragCoord.xy*2.-r)/min(r.y,r.x)-mouse;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(time*.2)*.4);}gl_FragColor=vec4(p,.2,1);}';
// 既定のソース（geek mode）
const DEFAULT_GEEK_SOURCE = 'void main(){vec2 p=(gl_FragCoord.xy*2.-r)/min(r.y,r.x)-m;for(int i=0;i<8;++i){p.xy=abs(p)/abs(dot(p,p))-vec2(.9+cos(t*.2)*.4);}gl_FragColor=vec4(p,.2,1);}';

window.addEventListener('DOMContentLoaded', () => {
    // Ace editor 関連の初期化
    editor = editorSetting();
    // その他の DOM への参照
    canvas   = document.querySelector('#webgl');
    lineout  = document.querySelector('#lineout');
    counter  = document.querySelector('#counter');
    message  = document.querySelector('#message');
    mode     = document.querySelector('#modeselect');
    frames   = document.querySelector('#frameselect');
    size     = document.querySelector('#sizeselect');
    download = document.querySelector('#downloadgif');

    // ウィンドウのリサイズ時
    window.addEventListener('resize', resize, false);
    // 最初に一回リサイズ相当の処理を行っておく
    resize();

    // モード変更時の処理
    mode.addEventListener('change', () => {
        const source = editor.getValue();
        geek = mode.value !== 'classic';
        fragmen.geek = geek;
        // 既定のソースと同じならモードに応じた既定のソースに書き換える
        if(geek === true && source === DEFAULT_SOURCE){
            editor.setValue(DEFAULT_GEEK_SOURCE);
            setTimeout(() => {editor.gotoLine(1);}, 100);
        }else if(geek !== true && source === DEFAULT_GEEK_SOURCE){
            editor.setValue(DEFAULT_SOURCE);
            setTimeout(() => {editor.gotoLine(1);}, 100);
        }
    }, false);

    // ダウンロードボタン
    download.addEventListener('click', () => {
        // ボタンに .disabled が付与されているかエンコード中は即時終了
        if(
            download.classList.contains('disabled') === true ||
            isEncoding === true
        ){
            return;
        }
        // まず .disabled を付与して再度押せないようにする
        download.classList.add('disabled');
        // エンコード中のフラグを立てておく
        isEncoding = true;
        // 各種パラメータを DOM から取得してキャプチャ開始する
        setTimeout(() => {
            const f = parseInt(frames.value);
            const s = size.value.split('x');
            const w = parseInt(s[0]);
            const h = parseInt(s[1]);
            captureGif(f, w, h);
        }, 100);
    }, false);

    // メインとなる fragmen のインスタンス
    const option = Object.assign(FRAGMEN_OPTION, {
        target: canvas,
        eventTarget: canvas,
    });
    fragmen = new Fragmen(option);
    // シェーダが更新された段階で同時にメッセージを更新
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
    // デフォルトのメッセージを出力
    counter.textContent = `${DEFAULT_SOURCE.length} char`;
    message.textContent = ' > ready';
    // レンダリング開始
    fragmen.render(DEFAULT_SOURCE);
}, false);

/**
 * ウィンドウリサイズ時の処理
 */
function resize(){
    const canvas = document.querySelector('#webgl');
    const bound = canvas.parentElement.getBoundingClientRect();
    canvas.width = bound.width;
    canvas.height = bound.height;
}

/**
 * シェーダのソースを更新
 */
function update(source){
    if(fragmen == null){return;}
    fragmen.render(source);
}

/**
 * Ace editor の初期設定
 */
function editorSetting(){
    const editor = ace.edit('editor');
    editor.setTheme('ace/theme/merbivore_soft');
    editor.session.setOption('indentedSoftWrap', false);
    editor.session.setUseWrapMode(true);
    editor.session.setMode('ace/mode/glsl');
    editor.session.setTabSize(2);
    editor.session.setUseSoftTabs(true);
    editor.$blockScrolling = Infinity;
    editor.setShowPrintMargin(false);
    editor.setHighlightSelectedWord(true);
    editor.setValue(DEFAULT_SOURCE);

    // editor の内容が変化した際のリスナーを設定
    let timeoutId = null;
    editor.session.on('change', (evt) => {
        // １秒以内の場合はタイマーをキャンセル
        if(timeoutId != null){clearTimeout(timeoutId);}
        timeoutId = setTimeout(() => {
            timeoutId = null;
            update(editor.getValue());
        }, 1000);
        // 文字数の出力
        counter.textContent = `${editor.getValue().length} char`;
    });

    // １行目にフォーカスしておく
    setTimeout(() => {editor.gotoLine(1);}, 100);
    return editor;
}

/**
 * GIF をキャプチャする
 * @param {number} [frame=180] - キャプチャするフレーム数
 * @param {number} [width=512] - キャプチャする際の canvas の幅
 * @param {number} [height=256] - キャプチャする際の canvas の高さ
 */
function captureGif(frame = 180, width = 512, height = 256){
    // CCapture の初期化
    const capture = new CCapture({
        verbose: false,
        format: 'gif',
        workersPath: './js/',
        framerate: 60,
        quality: 100,
        onProgress: (range) => {
            // 変換進捗の出力
            const p = Math.floor(range * 100);
            download.textContent = `${p}%`;
            // 完全に変換が終わった瞬間をイベントで取れないので
            // 進捗率が 1.0 以上になった時点で後始末を行っておく
            if(range >= 1.0){
                setTimeout(() => {
                    download.classList.remove('disabled');
                    download.textContent = 'gif';
                    isEncoding = false;
                }, 2000);
            }
        },
    });

    // キャプチャ用の canvas の生成と設定
    let captureCanvas = document.createElement('canvas');
    // document 上に存在しないと WebGL 側で初期化に失敗する
    captureCanvas.width          = width;
    captureCanvas.height         = height;
    captureCanvas.style.position = 'absolute';
    captureCanvas.style.top      = '-9999px';
    captureCanvas.style.left     = '-9999px';
    document.body.appendChild(captureCanvas);
    const option = Object.assign(FRAGMEN_OPTION, {
        target: captureCanvas,
        eventTarget: captureCanvas,
    });
    // モードを揃えて新しい fragmen のインスタンスを生成
    let frag = new Fragmen(option);
    frag.geek = geek;
    // 引数の指定フレーム数分レンダリングし GIF を生成
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


