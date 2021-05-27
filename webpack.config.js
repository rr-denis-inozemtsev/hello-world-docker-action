'use strict';

/* global require module __dirname */

const ClosurePlugin = require('closure-webpack-plugin');
const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtPlugin = require('script-ext-html-webpack-plugin');
const { AngularCompilerPlugin } = require('@ngtools/webpack');

module.exports = {
    watch: false,
    mode: 'production',
    name: 'first',
    entry: {
        bg: './src/background/index.ts',
        content: './src/content/index.js',
        devtools: './src/devtools/index.js',
        dev_tab: './src/dev_tab/index.ts',
    },
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]/bundle.js',
        library: 'source',
    },
    optimization: {
        concatenateModules: false,
        // minimizer: [
        //     new ClosurePlugin({mode: 'AGGRESSIVE_BUNDLE'}, {
        //         // compiler flags here
        //         //
        //         // for debugging help, try these:
        //         //
        //         // dependency_mode: 'PRUNE',
        //         //
        //         // formatting: 'PRETTY_PRINT',
        //         // debug: true,
        //         // renaming: false,
        //
        //         languageOut: 'ECMASCRIPT_2017',
        //     }, {
        //         compilation_level: 'ADVANCED',
        //     })
        // ],
        usedExports: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {from: './src/assets/*', flatten: true},
                {from: './src/devtools/index.html', to: './devtools.html'},
                {from: './src/dev_tab/index.html', to: './dev_tab.html'},
                {from: './src/dev_tab/*.html', to: './', flatten: true, globOptions: {ignore: ['**/index.html']},},
                {
                    from: path.resolve(__dirname, './node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
                    to: './webextension-polyfill.js',
                }
            ]
        }),
        new AngularCompilerPlugin({
            tsConfigPath: './tsconfig.json',
            entryModule: './src/dev-tab/app.module#AppModule',
            sourceMap: true,
            directTemplateLoading: true,
        })

    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                // loader: '@ngtools/webpack'
                use: 'ts-loader',
                // use: {
                //     loader: 'tsickle-loader',
                //     options: {
                //         // the tsconfig file to use during compilation
                //         tsconfig: path.resolve(__dirname, "tsconfig.json"),
                //         // this is the directory where externs will be saved. You
                //         // will probably want to delete these between builds
                //         externDir: "./tmp/externs"
                //     }
                // },
                // exclude: /node_modules/,
            },
            {
                enforce: 'pre',
                test: /\.html$/,
                loader: 'raw-loader'
            }
        ],

    },
};
