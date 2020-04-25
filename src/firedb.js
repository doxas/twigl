
export class FireDB {
    constructor(firebase){
        this.db = firebase.database();
    }
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
                    cursor: '0|0'
                },
                sound: {
                    source: '',
                    cursor: '0|0',
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
    createStar(channelId){
        return new Promise((resolve) => {
            const payload = {count: 0};
            this.db.ref(`star/${channelId}`).set(payload)
            .then((res) => {
                resolve({response: res});
            });
        });
    }
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

