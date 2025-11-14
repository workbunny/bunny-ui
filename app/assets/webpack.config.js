const path = require('path'); //调用node.js中的路径
module.exports = {
    entry: {
        index: './src/js/index.js' //需要打包的文件
    },
    output: {
        filename: 'bunny.js',    //输入的文件名是什么，生成的文件名也是什么
        path: path.resolve(__dirname, './dist') //指定生成的文件目录
    },
    module: {
        rules: [
            {
                test: /\.css$/, //匹配所有的css文件
                use: [
                    'style-loader', //在html中创建一个style标签，里面含有css代码
                    'css-loader' //将css文件变成模块
                ]
            }
        ]
    },
    mode: "production"    //开发模式，没有对js等文件压缩，默认生成的是压缩文件 
}