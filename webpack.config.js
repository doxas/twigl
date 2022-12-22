
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

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
                }, {
                    test: /\.(vert|frag|glsl)$/,
                    use: 'raw-loader',
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
        cache: true,
        devtool: devmode,
    };
};

