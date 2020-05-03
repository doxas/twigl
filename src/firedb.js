
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
     * @param {string} name - ディレクター名（純粋な視聴者側のメニュー位置に表示される）
     * @return {Promise} realtime database にディレクターを登録したら解決する Promise
     */
    createDirector(name){
        if(name == null || name === ''){return Promise.reject('invalid argument');}
        return new Promise((resolve) => {
            // ユニークなキーを取得してデータを作成
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
            // ユニークなキーを取得してデータを作成
            const channelKey = this.db.ref('channel').push().key;
            const payload = {};
            payload[`channel/${channelKey}`] = {
                initialized: true,      // 初期代入の際にのみ必要（validation の都合）
                directorId: directorId, // オーナーとなるディレクター ID
                visual: 'unknown',      // VJ 担当となるディレクター（初期値は unknown）
                disc: 'unknown',        // DJ 担当となるディレクター（初期値は unknown）
                graphics: {
                    source: graphicsSource,
                    cursor: '0|0|0',    // row, column, scrollTop（復元用）
                    mode: graphicsMode, // current mode of graphics（classic, geek, geeker, and others）
                },
                sound: {
                    source: soundSource,
                    cursor: '0|0|0',    // グラフィックス側と同じ
                    play: 0,            // ディレクターが手動で音声を再生したカウント数
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
     * チャンネルに紐づく視聴者数を新規に生成する
     * @param {string} channelId - チャンネル ID
     * @return {Promise} realtime database に視聴者数を登録したら解決する Promise
     */
    createViewer(channelId){
        return new Promise((resolve) => {
            const payload = {count: 0};
            this.db.ref(`viewer/${channelId}`).set(payload)
            .then((res) => {
                resolve({response: res});
            });
        });
    }
    /**
     * チャンネルに紐づくディレクター情報を更新する（ここで担当ディレクターが決まる）
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
     * スターをインクリメントした値で更新する（渋滞する可能性があるのでトランザクションを利用）
     * @param {string} channelId - チャンネル ID
     */
    updateStarData(channelId){
        const ref = this.db.ref(`star/${channelId}`);
        ref.transaction((currentData) => {
            if(currentData == null){return;}
            return {count: currentData.count + 1};
        });
    }
    /**
     * 視聴者数更新する
     * @param {string} channelId - チャンネル ID
     * @param {boolean} [isCountup=true] - カウントアップするかどうか（そうでない場合カウントダウン）
     */
    updateViewerData(channelId, isCountup = true){
        const ref = this.db.ref(`viewer/${channelId}`);
        ref.once('value', (res) => {
            const count = res.val().count;
            ref.update({count: count + (isCountup === true ? 1 : -1)});
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
     * 視聴者数からデータを取得する
     * @param {string} channelId - チャンネル ID
     * @return {Promise}
     */
    getViewerData(channelId){
        return new Promise((resolve, reject) => {
            this.db.ref(`viewer/${channelId}`).once('value', (snapshot) => {
                resolve(snapshot.val());
            }, (err) => {
                reject(err);
            });
        });
    }
    /**
     * チャンネルに対するリスナーを設定する
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
     * スターに対するリスナーを設定する
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
    /**
     * 視聴者数に対するリスナーを設定する
     * @param {string} channelId - チャンネル ID
     * @param {function} resolve - データ更新時に呼ばれるコールバック
     * @param {function} [reject] - データ更新が失敗した際に呼ばれるコールバック
     */
    listenViewerData(channelId, resolve, reject){
        this.db.ref(`viewer/${channelId}`).on('value', (snapshot) => {
            resolve(snapshot.val());
        }, (err) => {
            if(reject != null){reject(err);}
        });
    }
}

