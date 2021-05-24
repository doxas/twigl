
import EventEmitter3 from 'eventemitter3';

/**
 * @class
 * @extends EventEmitter3
 */
export class Musician extends EventEmitter3 {
    /**
     * analyser に指定する FFT サイズ
     * @type {number}
     */
    static get FFT_SIZE(){return 128;}

    /**
     * コンストラクタを呼ぶタイミングでユーザーからなんらかの干渉を
     * 受けている必要がある（AudioContext の初期化ができないため）
     * @constructor
     */
    constructor(){
        super();

        /**
         * 処理の対象となったファイル
         * @type {File}
         */
        this.file = null;
        /**
         * ファイルから読み込んだ AraryBuffer
         * @type {ArrayBuffer}
         */
        this.buffer = null;
        /**
         * AudioContext のインスタンス
         * @type {AudioContext}
         */
        this.audioContext = null;
        /**
         * 音声の再生に利用する AudioBufferSourceNode
         * @type {AudioBufferSourceNode}
         */
        this.source = null;
        /**
         * 周波数を得るための AnalyserNode
         * @type {AnalyserNode}
         */
        this.analyser = null;
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
    }
    /**
     * ファイルを開くダイアログを表示しファイルを受け取り ArrayBuffer として読み込む
     * @return {Promise}
     */
    loadFile(){
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.addEventListener('change', () => {
                if(input.files[0] == null){return;}
                this.file = input.files[0];

                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    this.buffer = reader.result;
                    resolve(this.buffer);
                    this.emit('load', this.buffer);
                });
                reader.readAsArrayBuffer(this.file);
            }, false);
            input.click();
        });
    }
    /**
     * 音声を再生する
     * @param {ArrayBuffer} [data=null]
     * @return {boolean}
     */
    play(data = null){
        const buffer = data != null ? data : this.buffer;
        if(buffer == null){return;}
        if(this.audioContext == null){
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = Musician.FFT_SIZE * 2;
            this.analyser.connect(this.audioContext.destination);
            this.audioFrequencyBinCount = this.analyser.frequencyBinCount;
        }
        if(this.isPlay === true){
            this.stop();
        }
        this.audioContext.decodeAudioData(buffer, (decoded) => {
            this.source = this.audioContext.createBufferSource();
            this.source.connect(this.analyser);
            this.source.buffer = decoded;
            this.source.loop = true;
            this.source.start(0);
            this.isPlay = true;
            this.emit('play');
        });
        return this.isPlay;
    }
    /**
     * 周波数データを AnalyserNode 経由で取得する
     * @return {Uint8Array}
     */
    getFrequency(){
        if(this.isPlay !== true){return;}
        const array = new Uint8Array(this.audioFrequencyBinCount);
        this.analyser.getByteFrequencyData(array);
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
        const range = Math.log(Musician.FFT_SIZE);
        return f / (range * range);
    }
    /**
     * 再生中の音声を停止する
     */
    stop(){
        if(this.isPlay === true){
            this.source.stop();
            this.isPlay = false;
            this.emit('stop');
        }
    }
}

