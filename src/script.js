
import 'whatwg-fetch';
import Promise from 'promise-polyfill';
import {Fragmen} from './fragmen.js';
import {Onomat} from './onomat.js';
import {FireDB} from './firedb.js';

import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/analytics';

let canvas     = null; // スクリーン
let editor     = null; // Ace editor のインスタンス
let lineout    = null; // ステータスバー DOM
let counter    = null; // 文字数カウンター DOM
let message    = null; // メッセージ DOM
let mode       = null; // variable mode select
let frames     = null; // render frame select
let size       = null; // resolution select
let download   = null; // download button
let link       = null; // generate link button
let layer      = null; // dialog layer
let dialog     = null; // dialog message wrapper
let canvasWrap = null; // canvas を包んでいるラッパー DOM
let editorWrap = null; // editor を包んでいるラッパー DOM
let iconColumn = null; // icon を包んでいるラッパー DOM
let infoIcon   = null; // information icon
let fullIcon   = null; // fullscreen icon
let broadIcon  = null; // broadcast mode icon

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

let urlParameter = null; // GET パラメータを解析するための searchParams オブジェクト

let fire = null; // firebase

// fragmen.js 用のオプションの雛形
const FRAGMEN_OPTION = {
    target: null,
    eventTarget: null,
    mouse: true,
    resize: true,
    escape: false
}
// bitly にリクエストする際のベース URL
const BASE_URL = 'https://twigl.app';
// firebase のコンフィグ
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAcRObIHeZUmCt_X3FEzLdBJzUDYTVRte8',
    authDomain: 'twigl-f67a0.firebaseapp.com',
    databaseURL: 'https://twigl-f67a0.firebaseio.com',
    projectId: 'twigl-f67a0',
    storageBucket: 'twigl-f67a0.appspot.com',
    messagingSenderId: '653821260349',
    appId: '1:653821260349:web:17e2128ca9a60f2c7ff054',
    measurementId: 'G-WHMVELFNCW'
};

window.addEventListener('DOMContentLoaded', () => {
    // firebase の初期化
    firebase.initializeApp(FIREBASE_CONFIG);
    firebase.analytics();
    // firebaseSetting();

    // DOM への参照
    canvas     = document.querySelector('#webgl');
    lineout    = document.querySelector('#lineout');
    counter    = document.querySelector('#counter');
    message    = document.querySelector('#message');
    mode       = document.querySelector('#modeselect');
    frames     = document.querySelector('#frameselect');
    size       = document.querySelector('#sizeselect');
    download   = document.querySelector('#downloadgif');
    link       = document.querySelector('#permanentlink');
    layer      = document.querySelector('#layer');
    dialog     = document.querySelector('#dialogmessage');
    canvasWrap = document.querySelector('#canvaswrap');
    editorWrap = document.querySelector('#editorwrap');
    iconColumn = document.querySelector('#globaliconcolumn');
    infoIcon   = document.querySelector('#informationicon');
    fullIcon   = document.querySelector('#fullscreenicon');
    broadIcon  = document.querySelector('#broadcasticon');

    audioWrap     = document.querySelector('#audio');
    audioLineout  = document.querySelector('#lineoutaudio');
    audioCounter  = document.querySelector('#counteraudio');
    audioMessage  = document.querySelector('#messageaudio');
    audioToggle   = document.querySelector('#audiotoggle');
    audioPlayIcon = document.querySelector('#playicon');
    audioStopIcon = document.querySelector('#stopicon');

    // fragmen からデフォルトのソース一覧を取得
    const fragmenDefaultSource = Fragmen.DEFAULT_SOURCE;

    // URL の GET パラメータの解析
    urlParameter = getParameter();
    urlParameter.forEach((value, key) => {
        switch(key){
            case 'mode':
                currentMode = parseInt(value);
                break;
            case 'sound':
                audioToggle.checked = value === `true`;
                break;
            case 'source':
                currentSource = value;
                break;
            case 'soundsource':
                currentAudioSource = value;
                break;
        }
    });
    // URL パラメータより得たカレントモードが存在するか
    if(fragmenDefaultSource[currentMode] != null){
        mode.selectedIndex = currentMode;
    }else{
        currentMode = Fragmen.MODE_CLASSIC;
    }
    // この時点でカレントソースが空である場合既定のソースを利用する
    if(currentSource === ''){
        currentSource = fragmenDefaultSource[currentMode];
    }
    // audioToggle が checked ではないかサウンドシェーダのソースが空の場合既定のソースを利用する
    if(audioToggle.checked !== true || currentAudioSource === ''){
        currentAudioSource = Onomat.FRAGMENT_SHADER_SOURCE_DEFAULT;
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
    // audioToggle が checked である場合、URL からサウンドシェーダが有効化されている
    if(audioToggle.checked === true){
        // まず自家製ダイアログを出しユーザーにクリック操作をさせる
        showDialog('This URL is a valid of sound shader.\nIt is OK play the audio?')
        .then((result) => {
            // ユーザーが OK, Cancel のいずれをクリックしたかのフラグを引数に与える
            onomatSetting(result);
            // OK がクリックされた場合は文字数等を更新する
            if(result === true){
                update(editor.getValue());
                counter.textContent = `${editor.getValue().length}`;
                audioCounter.textContent = `${audioEditor.getValue().length}`;
            }
        });
    }

    // ウィンドウのリサイズ時
    window.addEventListener('resize', () => {
        resize();
    }, false);
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

    // リンク生成ボタン
    link.addEventListener('click', () => {
        if(link.classList.contains('disabled') === true){return;}
        link.classList.add('disabled');
        generatePermamentLink()
        .then((json) => {
            copyToClipboard(json.link);
            alert('Copied link to the clipboard!');
        })
        .finally(() => {
            link.classList.remove('disabled');
        });
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
                link.classList.add('disabled');
                break;
            default:
                download.classList.remove('disabled');
                if(latestStatus === 'success' && latestAudioStatus === 'success'){
                    link.classList.remove('disabled');
                }else{
                    link.classList.add('disabled');
                }
        }
    });
    fragmen.onDraw(() => {
        if(onomat == null || audioToggle.checked !== true || latestAudioStatus !== 'success'){return;}
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
        if(audioToggle.checked !== true || latestAudioStatus !== 'success'){return;}
        // Alt + Enter で再生、Ctrl をさらに付与すると停止
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

    // フルスクリーン解除時に DOM を元に戻すためのリスナー
    const onFullscreenChange = (evt) => {
        if(
            document.FullscreenElement == null &&
            document.webkitFullscreenElement == null &&
            document.msFullscreenElement == null
        ){
            // すべての要素が null だった場合、DOM 操作を行いエディタを表示させる
            exitFullscreenMode();
        }
    };
    // F11 ではなく、意図的なショートカットキー操作によってフルスクリーンへと移行するためのリスナー
    const onFullscreenKeyDown = (evt) => {
        if(evt.altKey === true && evt.ctrlKey === true && (evt.key.toLowerCase() === 'f' || evt.key === 'ƒ')){
            if(
                document.FullscreenElement != null ||
                document.webkitFullscreenElement != null ||
                document.msFullscreenElement != null
            ){
                // この場合、絶対に JavaScript から fullscreen 化しているので強制的に戻せばよい
                // ただし、イベントリスナーによって事後処理が自動的に行われることになるので
                // 発火するのは document.exitFullsScreen までで、DOM はここでは操作しない
                exitFullscreen();
            }else{
                // この場合、F11 で既に見た目上は fullscreen 化している可能性がある
                // F11 の fullscreen は requestFullscreen 等で fullscreen 化したものとは
                // 別物として扱われているが、いずれも Escape で解除できるため注意
                requestFullscreenMode();
            }
        }
    };
    // アイコンが押されたとき
    const onFullscreenRequest = () => {
        if(
            document.FullscreenElement == null ||
            document.webkitFullscreenElement == null ||
            document.msFullscreenElement == null
        ){
            requestFullscreenMode();
        }
    };
    // API がサポートされている場合に限りフルスクリーン関連のリスナーを登録する
    if(document.fullscreenEnabled === true){
        document.addEventListener('fullscreenchange', onFullscreenChange, false);
        window.addEventListener('keydown', onFullscreenKeyDown, false);
        fullIcon.addEventListener('click', onFullscreenRequest, false);
    }else if(document.webkitFullscreenEnabled === true){
        document.addEventListener('webkitfullscreenchange', onFullscreenChange, false);
        window.addEventListener('keydown', onFullscreenKeyDown, false);
        fullIcon.addEventListener('click', onFullscreenRequest, false);
    }else{
        // いずれでもない場合は API でフルスクリーン化することができないのでアイコンを消す
        fullIcon.classList.add('invisible');
    }

    // TODO:
    // showDialog('Do you want to start setting up a broadcast?')
    // .then((isOk) => {
    //     if(isOk === true){
    //         showDialog('please wait...', true);
    //         setTimeout(() => {
    //             showDialog('thanks!');
    //         }, 5000);
    //     }
    // });
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
                    download.textContent = 'Download GIF';
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

/**
 * audioToggle の状態によりエディタの表示・非表示を切り替え、場合により Onomat の初期化を行う
 * @param {boolean} [play=true] - そのまま再生まで行うかどうかのフラグ
 */
function onomatSetting(play = true){
    // onomat のインスタンスが既に存在するかどうか
    if(onomat == null){
        // 存在しない場合生成を試みる
        onomat = new Onomat();
        // ビルド時のイベントを登録
        onomat.on('build', (res) => {
            latestAudioStatus = res.status;
            audioLineout.classList.remove('warn');
            audioLineout.classList.remove('error');
            audioLineout.classList.add(res.status);
            audioMessage.textContent = res.message;
            if(latestStatus === 'success' && latestAudioStatus === 'success'){
                link.classList.remove('disabled');
            }else{
                link.classList.add('disabled');
            }
        });
        // 再生まで行うよう引数で指定されている場合は再生処理をタイマーで登録
        if(play === true){
            setTimeout(() => {
                updateAudio(audioEditor.getValue(), true);
            }, 500);
        }
    }
    // 表示・非表示の切り替え
    if(audioToggle.checked === true){
        audioWrap.classList.remove('invisible');
        audioPlayIcon.classList.remove('disabled');
        audioStopIcon.classList.remove('disabled');
    }else{
        audioWrap.classList.add('invisible');
        audioPlayIcon.classList.add('disabled');
        audioStopIcon.classList.add('disabled');
    }
    // エディタのスクロールがおかしくならないようにリサイズ処理を呼んでおく
    editor.resize();
    audioEditor.resize();
}

/**
 * firebase の初期化を行う
 * @return {Promise}
 */
function firebaseSetting(){
    return new Promise((resolve, reject) => {
        fire = new FireDB(firebase);
        let directorId;
        let channelId;
        fire.createDirector('doxas')
        .then((res) => {
            console.log('🍆', res);
            directorId = res.directorId;
            return fire.createChannel(res.directorId);
        })
        .then((res) => {
            console.log('👩', res);
            channelId = res.channelId;
            return fire.createStar(res.channelId);
        })
        .then((res) => {
            console.log('🚀', res);
            return fire.updateChannelDirector(channelId, directorId, directorId);
        })
        .then((res) => {
            console.log('🌏', res);
            return fire.updateChannelData(directorId, channelId, {
                source: 'graphics',
                cursor: '10|10',
            }, {
                source: 'sound',
                cursor: '99|99',
                play: 9,
            });
        })
        .then((res) => {
            console.log('🌠', res);
            resolve();
        })
        .catch((err) => {
            console.log('💣', err);
            reject(err);
        });
    });
}

/**
 * searchParams を取得する
 * @return {URLSearchParams}
 */
function getParameter(){
    return new URL(document.location).searchParams;
}

/**
 * 現在の状態を再現するための URL パラメータを生成し短縮 URL を取得する
 * @return {Promise} - 短縮 URL を取得すると解決する Promise
 */
function generatePermamentLink(){
    return new Promise((resolve, reject) => {
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
        // 何らかのパラメータが付与された場合 URL に結合する
        if(result.length > 0){
            const param = result.join('&');
            generateUrl(`${BASE_URL}?${param}`)
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                resolve(json);
            });
        }else{
            reject();
        }
    });
}

/**
 * パラメータの付与された「もととなる URL」から短縮 URL の取得を試みる
 * @param {string} - もととなる URL
 * @return {Promise}
 */
function generateUrl(url){
    const endpoint = 'https://api-ssl.bitly.com/v4/shorten';
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__BITLY_ACCESS_TOKEN__}`
    };
    return fetch(endpoint, {
        method: 'post',
        headers, headers,
        body: JSON.stringify({long_url: url}),
    });
}

/**
 * 自家製ダイアログを表示する
 * @param {string} message - 表示するメッセージ
 * @param {boolean} [disable=false] - ボタンに disabled を設定するかどうか
 * @return {Promise} - Ok, Cancel のいずれかのボタンが押されたときに解決する Promise
 */
function showDialog(message, disable = false){
    return new Promise((resolve) => {
        // ダイアログ上にメッセージを設定しレイヤを表示する
        while(dialog.firstChild != null){
            dialog.removeChild(dialog.firstChild);
        }
        const sentence = message.split('\n');
        sentence.forEach((s) => {
            const div = document.createElement('div');
            div.textContent = s;
            dialog.appendChild(div);
        });
        setLayerVisible(true);
        const ok = document.querySelector('#dialogbuttonok');
        const cancel = document.querySelector('#dialogbuttoncancel');
        if(disable === true){
            ok.classList.add('disabled');
            cancel.classList.add('disabled');
        }else{
            ok.classList.remove('disabled');
            cancel.classList.remove('disabled');
            // 各ボタンには、毎回イベントを設定してボタン押下時に解除する
            const okClick = () => {
                ok.removeEventListener('click', okClick);
                cancel.removeEventListener('click', cancelClick);
                resolve(true);
                hideDialog();
            };
            const cancelClick = () => {
                ok.removeEventListener('click', okClick);
                cancel.removeEventListener('click', cancelClick);
                resolve(false);
                hideDialog();
            };
            ok.addEventListener('click', okClick, false);
            cancel.addEventListener('click', cancelClick, false);
        }
    });
}

/**
 * ダイアログ（及びレイヤ）を非表示にする
 */
function hideDialog(){
    setLayerVisible(false);
}

/**
 * フロートレイヤの表示状態を設定する
 * @param {boolean} visible - 表示するかどうかのフラグ
 */
function setLayerVisible(visible){
    if(visible === true){
        layer.classList.add('visible');
    }else{
        layer.classList.remove('visible');
    }
}

/**
 * フルスクリーンを解除する（DOM 操作はしない）
 */
function exitFullscreen(){
    if(
        document.fullscreenEnabled !== true &&
        document.webkitFullscreenEnabled !== true
    ){
        return;
    }
    // 一度変数にキャッシュしたりすると Illegal invocation になるので直接呼ぶ
    if(document.exitFullsScreen != null){
        document.exitFullscreen();
    }else if(document.webkitExitFullscreen != null){
        document.webkitExitFullscreen();
    }
}

/**
 * フルスクリーンを解除後の DOM 操作とエディタ領域のリサイズのみを行う
 */
function exitFullscreenMode(){
    canvasWrap.classList.remove('fullscreen');
    editorWrap.classList.remove('invisible');
    iconColumn.classList.remove('invisible');
    editor.resize();
    audioEditor.resize();
    resize();
    fragmen.rect();
}

/**
 * フルスクリーンモードへ移行しエディタ領域をリサイズする
 */
function requestFullscreenMode(){
    if(
        document.fullscreenEnabled !== true &&
        document.webkitFullscreenEnabled !== true
    ){
        return;
    }
    // 一度変数にキャッシュしたりすると Illegal invocation になるので直接呼ぶ
    if(document.body.requestFullscreen != null){
        document.body.requestFullscreen();
        canvasWrap.classList.add('fullscreen');
        editorWrap.classList.add('invisible');
        iconColumn.classList.add('invisible');
    }else if(document.body.webkitRequestFullScreen != null){
        document.body.webkitRequestFullScreen();
        canvasWrap.classList.add('fullscreen');
        editorWrap.classList.add('invisible');
        iconColumn.classList.add('invisible');
    }
    editor.resize();
    audioEditor.resize();
    resize();
    fragmen.rect();
}

/**
 * 引数から受け取った文字列をクリップボードにコピーする
 * @param {string} str - コピーしたい文字列
 */
function copyToClipboard(str){
    // textarea を生成して値を設定し文字列選択でコマンド発行
    const t = document.createElement('textarea');
    t.value = str;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    // body 配下から削除
    document.body.removeChild(t);
}

