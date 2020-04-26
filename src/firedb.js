
/**
 * @class
 */
export class FireDB {
    /**
     * @constructor
     * @param {firebase} - firebase
     */
    constructor(firebase){
        /**
         * Firebase の Database インスタンス
         * @type {Database}
         */
        this.db = firebase.database();
    }
    /**
     * ディレクターを新規に生成する
     * @param {string} name - ディレクター名
     * @return {Promise} realtime database にディレクターを登録したら解決する Promise
     */
    createDirector(name){
        if(name == null || name === ''){return Promise.reject('invalid argument');}
        return new Promise((resolve) => {
            const directorKey = this.db.ref('director').push().key;
            const payload = {};
            payload[`director/${directorKey}`] = {name: name};
            this.db.ref().update(payload)
            .then((res) => {
                resolve({
                    response: res,
                    name: name,
                    directorId: directorKey,
                });
            });
        });
    }
    /**
     * チャンネルを新規に生成する
     * @param {string} directorId - ディレクター ID
     * @return {Promise} realtime database にチャンネルを登録したら解決する Promise
     */
    createChannel(directorId){
        return new Promise((resolve) => {
            const channelKey = this.db.ref('channel').push().key;
            const payload = {};
            payload[`channel/${channelKey}`] = {
                initialized: true,
                directorId: directorId,
                visual: 'unknown',
                disc: 'unknown',
                graphics: {
                    source: '',
                    cursor: '0|0|0', // row, column, scrollTop
                },
                sound: {
                    source: '',
                    cursor: '0|0|0',
                    play: 0,
                },
            };
            this.db.ref().update(payload)
            .then((res) => {
                resolve({
                    response: res,
                    channelId: channelKey,
                });
            });
        });
    }
    /**
     * チャンネルに紐づくスターを新規に生成する
     * @param {string} channelId - チャンネル ID
     * @return {Promise} realtime database にスターを登録したら解決する Promise
     */
    createStar(channelId){
        return new Promise((resolve) => {
            const payload = {count: 0};
            this.db.ref(`star/${channelId}`).set(payload)
            .then((res) => {
                resolve({response: res});
            });
        });
    }
    /**
     * チャンネルに紐づくディレクター情報を更新する
     * @param {string} channelId - チャンネル ID
     * @param {string} visual - VJ を担当するディレクターの ID
     * @param {string} disc - DJ を担当するディレクターの ID
     * @return {Promise} データを更新したら解決する Promise
     */
    updateChannelDirector(channelId, visual = 'unknown', disc = 'unknown'){
        return new Promise((resolve) => {
            const payload = {};
            if(visual !== 'unknown'){
                payload.visual = visual;
            }
            if(disc !== 'unknown'){
                payload.disc = disc;
            }
            this.db.ref(`channel/${channelId}`).update(payload)
            .then((res) => {
                resolve({response: res});
            });
        });
    }
    /**
     * チャンネルに紐づく各種データを更新する
     * @param {string} directorId - ディレクター ID
     * @param {string} channelId - チャンネル ID
     * @param {object} graphicsData - channel.graphics に設定するデータを含むオブジェクト
     * @param {object} soundData - channel.sound に設定するデータを含むオブジェクト
     * @return {Promise} データを更新したら解決する Promise
     */
    updateChannelData(directorId, channelId, graphicsData, soundData){
        return new Promise((resolve) => {
            const payload = {
                directorId: directorId,
            };
            if(graphicsData != null){
                payload.graphics = graphicsData;
            }
            if(soundData != null){
                payload.sound = soundData;
            }
            this.db.ref(`channel/${channelId}`).update(payload)
            .then((res) => {
                resolve({response: res});
            });
        });
    }
}

