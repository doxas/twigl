
const path = require('path');
const webpack = require('webpack');

const FB_API_KEY             = '<your environment>';
const FB_AUTH_DOMAIN         = '<your environment>';
const FB_DATABASE_URL        = '<your environment>';
const FB_PROJECT_ID          = '<your environment>';
const FB_STORAGE_BUCKET      = '<your environment>';
const FB_MESSAGING_SENDER_ID = '<your environment>';

module.exports = (env, argv) => {
    let devmode;
    let isDevelopment = argv.mode === 'development';
    if(isDevelopment === true){
        devmode = 'inline-source-map';
        console.log('[OK] development build');
    }else{
        devmode = 'none';
        console.log('[OK] production build');
    }
    return {
        context: path.resolve(__dirname, 'src'),
        entry: {
            script: './script.js',
        },
        output: {
            path: path.resolve(__dirname, 'public/js'),
            publicPath: './',
            filename: '[name].js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    include: path.resolve(__dirname, 'src'),
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/env']
                            ]
                        }
                    }]
                }
            ]
        },
        devServer: {
            contentBase: path.join(__dirname, 'public'),
            openPage: './index.html',
            open: true,
            port: 9090,
            publicPath: '/js/',
            watchContentBase: true,
        },
        plugins: [
            new webpack.DefinePlugin({
                __FB_API_KEY__:             JSON.stringify(FB_API_KEY),
                __FB_AUTH_DOMAIN__:         JSON.stringify(FB_AUTH_DOMAIN),
                __FB_DATABASE_URL__:        JSON.stringify(FB_DATABASE_URL),
                __FB_PROJECT_ID__:          JSON.stringify(FB_PROJECT_ID),
                __FB_STORAGE_BUCKET__:      JSON.stringify(FB_STORAGE_BUCKET),
                __FB_MESSAGING_SENDER_ID__: JSON.stringify(FB_MESSAGING_SENDER_ID)
            })
        ],
        cache: true,
        devtool: devmode,
    };
};

