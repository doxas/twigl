
import 'whatwg-fetch';
import Promise from 'promise-polyfill';
import {Fragmen} from './fragmen.js';
import {Onomat} from './onomat.js';

let canvas   = null; // スクリーン
let editor   = null; // Ace editor のインスタンス
let lineout  = null; // ステータスバー DOM
let counter  = null; // 文字数カウンター DOM
let message  = null; // メッセージ DOM
let mode     = null; // variable mode select
let frames   = null; // render frame select
let size     = null; // resolution select
let download = null; // download button

let audioWrap     = null; // サウンドシェーダペインのラッパー
let audioEditor   = null; // Ace editor のインスタンス
let audioLineout  = null; // ステータスバー DOM
let audioCounter  = null; // 文字数カウンター DOM
let audioMessage  = null; // メッセージ DOM
let audioToggle   = null; // トグルボタン
let audioPlayIcon = null; // 再生ボタン
let audioStopIcon = null; // 停止ボタン

let latestStatus       = 'success';            // 直近のステータス
let latestAudioStatus  = 'success';            // 直近のステータス（サウンドシェーダ）
let isEncoding         = false;                // エンコード中かどうか
let currentMode        = Fragmen.MODE_CLASSIC; // 現在の Fragmen モード
let currentSource      = '';                   // 直近のソースコード
let currentAudioSource = '';                   // 直近の Sound Shader のソースコード
let fragmen            = null;                 // fragmen.js のインスタンス
let onomat             = null;                 // onomat.js のインスタンス

let urlParameter = null;

// fragmen.js 用のオプションの雛形
const FRAGMEN_OPTION = {
    target: null,
    eventTarget: null,
    mouse: true,
    resize: true,
    escape: false
}
const BASE_URL = 'https://twigl.app';

window.addEventListener('DOMContentLoaded', () => {
    // DOM への参照
    canvas   = document.querySelector('#webgl');
    lineout  = document.querySelector('#lineout');
    counter  = document.querySelector('#counter');
    message  = document.querySelector('#message');
    mode     = document.querySelector('#modeselect');
    frames   = document.querySelector('#frameselect');
    size     = document.querySelector('#sizeselect');
    download = document.querySelector('#downloadgif');

    audioWrap     = document.querySelector('#audio');
    audioLineout  = document.querySelector('#lineoutaudio');
    audioCounter  = document.querySelector('#counteraudio');
    audioMessage  = document.querySelector('#messageaudio');
    audioToggle   = document.querySelector('#audiotoggle');
    audioPlayIcon = document.querySelector('#playicon');
    audioStopIcon = document.querySelector('#stopicon');

    const fragmenDefaultSource = Fragmen.DEFAULT_SOURCE;

    // URL
    urlParameter = getParameter();
    urlParameter.forEach((value, key) => {
        console.log(key, value);
        switch(key){
            case 'mode':
                currentMode = parseInt(value);
                break;
            case 'sound':
                audioToggle.checked = true;
                break;
            case 'source':
                currentSource = decodeURIComponent(value);
                break;
            case 'soundsource':
                currentAudioSource = decodeURIComponent(value);
                break;
        }
    });
    if(fragmenDefaultSource[currentMode] != null){
        mode.selectedIndex = currentMode;
    }else{
        currentMode = Fragmen.MODE_CLASSIC;
    }
    if(currentSource === ''){
        currentSource = fragmenDefaultSource[currentMode];
    }
    if(currentAudioSource === ''){
        currentAudioSource = Onomat.FRAGMENT_SHADER_SOURCE_DEFAULT;
    }
    if(audioToggle.checked === true){
        const result = confirm('This URL is a valid of sound shader.\nIt is OK play the audio?');
        onomatSetting(result);
    }

    // Ace editor 関連の初期化
    let timeoutId = null;
    editor = editorSetting('editor', currentSource, (evt) => {
        // １秒以内の場合はタイマーをキャンセル
        if(timeoutId != null){clearTimeout(timeoutId);}
        timeoutId = setTimeout(() => {
            timeoutId = null;
            update(editor.getValue());
        }, 1000);
        // 文字数の出力
        counter.textContent = `${editor.getValue().length}`;
    });
    let audioTimeoutId = null;
    audioEditor = editorSetting('editoraudio', currentAudioSource, (evt) => {
        // １秒以内の場合はタイマーをキャンセル
        if(audioTimeoutId != null){clearTimeout(audioTimeoutId);}
        audioTimeoutId = setTimeout(() => {
            audioTimeoutId = null;
            updateAudio(audioEditor.getValue());
        }, 1000);
        // 文字数の出力
        audioCounter.textContent = `${audioEditor.getValue().length}`;
    });

    // ウィンドウのリサイズ時
    window.addEventListener('resize', resize, false);
    // 最初に一回リサイズ相当の処理を行っておく
    resize();

    // モード変更時の処理
    mode.addEventListener('change', () => {
        const defaultSourceInPrevMode = fragmenDefaultSource[currentMode];

        const source = editor.getValue();
        currentMode = parseInt(mode.value);
        fragmen.mode = currentMode;

        // 既定のソースと同じならモードに応じた既定のソースに書き換える
        if(source === defaultSourceInPrevMode){
            const defaultSource = fragmenDefaultSource[currentMode];
            editor.setValue(defaultSource);
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
    fragmen.onDraw(() => {
        if(audioToggle.checked !== true || latestAudioStatus !== 'success'){return;}
        fragmen.setFrequency(onomat.getFrequencyFloat());
    });
    // デフォルトのメッセージを出力
    counter.textContent = `${currentSource.length}`;
    message.textContent = ' ● ready';
    // レンダリング開始
    fragmen.mode = currentMode;
    fragmen.render(currentSource);

    // WebGL 2.0 に対応しているかどうかによりドロップダウンリストの状態を変更
    if(fragmen.isWebGL2 !== true){
        for(let i = 0; i < mode.children.length; ++i){
            mode.children[i].disabled = Fragmen.MODE_WITH_ES_300.includes(i);
        }
    }

    // サウンドシェーダ関連
    audioToggle.addEventListener('change', () => {
        onomatSetting();
    }, false);
    audioPlayIcon.addEventListener('click', () => {
        if(audioToggle.checked !== true || latestAudioStatus !== 'success'){return;}
        updateAudio(audioEditor.getValue(), true);
    }, false);
    audioStopIcon.addEventListener('click', () => {
        if(audioToggle.checked !== true){return;}
        onomat.stop();
    }, false);
    window.addEventListener('keydown', (evt) => {
        if(evt.key === 'Enter' && evt.shiftKey === true){
            generatePermamentLink();
        }
        if(audioToggle.checked !== true || latestAudioStatus !== 'success'){return;}
        if(evt.key === 'Enter' && evt.altKey === true){
            if(evt.ctrlKey === true){
                onomat.stop();
            }else{
                updateAudio(audioEditor.getValue(), true);
            }
        }
    }, false);
    // デフォルトのメッセージを出力
    audioCounter.textContent = `${Onomat.FRAGMENT_SHADER_SOURCE_DEFAULT.length}`;
    audioMessage.textContent = ' ● ready';
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
 * シェーダのソースを更新
 */
function updateAudio(source, force){
    if(onomat == null){return;}
    onomat.render(source, force);
}

/**
 * Ace editor の初期設定
 */
function editorSetting(id, source, onChange, theme = 'chaos'){
    const edit = ace.edit(id);
    edit.setTheme(`ace/theme/${theme}`);
    edit.session.setOption('indentedSoftWrap', false);
    edit.session.setUseWrapMode(true);
    edit.session.setMode('ace/mode/glsl');
    edit.session.setTabSize(2);
    edit.session.setUseSoftTabs(true);
    edit.$blockScrolling = Infinity;
    edit.setShowPrintMargin(false);
    edit.setHighlightSelectedWord(true);
    // edit.setShowInvisibles(true);
    edit.setValue(source);

    // editor の内容が変化した際のリスナーを設定
    edit.session.on('change', onChange);

    // １行目にフォーカスしておく
    setTimeout(() => {edit.gotoLine(1);}, 100);
    return edit;
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
    frag.mode = currentMode;
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

function onomatSetting(play = true){
    if(onomat == null){
        onomat = new Onomat();
        onomat.on('build', (res) => {
            latestAudioStatus = res.status;
            audioLineout.classList.remove('warn');
            audioLineout.classList.remove('error');
            audioLineout.classList.add(res.status);
            audioMessage.textContent = res.message;
        });
        if(play === true){
            setTimeout(() => {
                updateAudio(audioEditor.getValue(), true);
            }, 500);
        }
    }
    if(audioToggle.checked === true){
        audioWrap.classList.remove('invisible');
        audioPlayIcon.classList.remove('disabled');
        audioStopIcon.classList.remove('disabled');
    }else{
        audioWrap.classList.add('invisible');
        audioPlayIcon.classList.add('disabled');
        audioStopIcon.classList.add('disabled');
    }
    editor.resize();
    audioEditor.resize();
}

function getParameter(){
    return new URL(document.location).searchParams;
}

function generatePermamentLink(){
    let result = [];
    if(latestStatus === 'success'){
        result.push(`mode=${mode.value}`);
        result.push(`source=${encodeURIComponent(editor.getValue())}`);
        if(audioToggle.checked === true){
            if(latestAudioStatus === 'success'){
                result.push(`sound=true`);
                result.push(`soundsource=${encodeURIComponent(audioEditor.getValue())}`);
            }
        }
    }
    if(result.length > 0){
        const param = result.join('&');
        generateUrl(`${BASE_URL}?${param}`)
        .then((json) => {
            console.log('🍑', json);
        });
    }
}

function generateUrl(url){
    const endpoint = 'https://api-ssl.bitly.com/v4/shorten';
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__BITLY_ACCESS_TOKEN__}`
    };
    return new Promise((resolve, reject) => {
        return fetch(endpoint, {
            method: 'post',
            headers, headers,
            body: JSON.stringify({long_url: url}),
        })
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            console.log(json);
            return json;
        });
    });
}

