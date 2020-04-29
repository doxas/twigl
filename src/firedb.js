
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
     * @param {string} graphicsSource - グラフィックスソースの初期値
     * @param {number} graphicsMode - グラフィックスモード
     * @param {string} soundSource - サウンドソースの初期値
     * @return {Promise} realtime database にチャンネルを登録したら解決する Promise
     */
    createChannel(directorId, graphicsSource, graphicsMode, soundSource){
        return new Promise((resolve) => {
            const channelKey = this.db.ref('channel').push().key;
            const payload = {};
            payload[`channel/${channelKey}`] = {
                initialized: true,
                directorId: directorId,
                visual: 'unknown',
                disc: 'unknown',
                graphics: {
                    source: graphicsSource,
                    cursor: '0|0|0',    // row, column, scrollTop
                    mode: graphicsMode, // current mode of graphics
                },
                sound: {
                    source: soundSource,
                    cursor: '0|0|0',
                    play: 0, // increment at sound play in director location
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
    /**
     * ディレクター ID からデータを取得する
     * @param {string} directorId - チャンネル ID
     * @return {Promise}
     */
    getDirectorData(directorId){
        return new Promise((resolve, reject) => {
            this.db.ref(`director/${directorId}`).once('value', (snapshot) => {
                resolve(snapshot.val());
            }, (err) => {
                reject(err);
            });
        });
    }
    /**
     * チャンネルからデータを取得する
     * @param {string} channelId - チャンネル ID
     * @return {Promise}
     */
    getChannelData(channelId){
        return new Promise((resolve, reject) => {
            this.db.ref(`channel/${channelId}`).once('value', (snapshot) => {
                resolve(snapshot.val());
            }, (err) => {
                reject(err);
            });
        });
    }
    /**
     * スターからデータを取得する
     * @param {string} channelId - チャンネル ID
     * @return {Promise}
     */
    getStarData(channelId){
        return new Promise((resolve, reject) => {
            this.db.ref(`star/${channelId}`).once('value', (snapshot) => {
                resolve(snapshot.val());
            }, (err) => {
                reject(err);
            });
        });
    }
    /**
     * チャンネルをリッスンする
     * @param {string} channelId - チャンネル ID
     * @param {function} resolve - データ更新時に呼ばれるコールバック
     * @param {function} [reject] - データ更新が失敗した際に呼ばれるコールバック
     */
    listenChannelData(channelId, resolve, reject){
        this.db.ref(`channel/${channelId}`).on('value', (snapshot) => {
            resolve(snapshot.val());
        }, (err) => {
            if(reject != null){reject(err);}
        });
    }
    /**
     * スターをリッスンする
     * @param {string} channelId - チャンネル ID
     * @param {function} resolve - データ更新時に呼ばれるコールバック
     * @param {function} [reject] - データ更新が失敗した際に呼ばれるコールバック
     */
    listenStarData(channelId, resolve, reject){
        this.db.ref(`star/${channelId}`).on('value', (snapshot) => {
            resolve(snapshot.val());
        }, (err) => {
            if(reject != null){reject(err);}
        });
    }
}

