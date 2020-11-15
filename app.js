//1.导入模块
const express = require('express');
//2.创建服务器
let app = express();

//静态资源托管
app.use(express.static('www'));//静态页面资源
app.use(express.static('static'))//图像资源

//中间件

//body-parser
const bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//express-fileupload
const fileUpload = require('express-fileupload');
app.use(fileUpload());

//cors跨域技术
var cors = require('cors');
app.use(cors())

// mysql - ithm
const hm = require('mysql-ithm');
//2.连接数据库
//如果数据库存在则连接，不存在则会自动创建数据库
hm.connect({
    host: 'localhost',//数据库地址
    port: '3306',
    user: 'root',//用户名，没有可不填
    password: '123456',//密码，没有可不填
    database: 'WZHero'//数据库名称
});
//3.创建Model(表格模型：负责增删改查)
//如果table表格存在则连接，不存在则自动创建
let heroModel = hm.model('heroList', {
    name: String,
    icon: String,
    skill: String
});

let userModel = hm.model('user', {
    username: String,
    password: String,
});

//cookies
const cookieSession = require('cookie-session')
app.use(cookieSession({
    name: 'session',
    keys: [/* secret keys */'a', 'b'],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours 免登录时间
}))

// 路由
//1.查询英雄列表
app.get('/hero/list', (req, res) => {
    console.log(req.url);
    console.log(req.query);
    let { search } = req.query;
    console.log(search);
    if (search) {
        heroModel.find(`name like "%${search}%"`, (err, results) => {
            if (err) {
                res.send({
                    code: 500,
                    msg: err
                });
            } else {
                // console.log(results);
                res.send({
                    code: 200,
                    data: results
                })

            }
        })
    } else {
        heroModel.find((err, results) => {
            if (err) {
                res.send({
                    code: 500,
                    msg: err
                });
            } else {
                // console.log(results);

                res.send({
                    code: 200,
                    data: results,
                    /* 后台把浏览器自动发上来的cookie，响应给ajax */
                    user: req.session.user
                })

            }
        })
    }



})
//2.查询英雄详情
app.get('/hero/info', (req, res) => {
    console.log(req.url);
    console.log(req.query);
    let { id } = req.query;
    // console.log(id);
    heroModel.find(`id=${id}`, (err, results) => {
        if (err) {
            res.send({
                code: 500,
                msg: err
            });

        } else {
            // console.log(results);
            res.send({
                code: 200,
                data: results[0]
            })

        }
    })

})
//3.编辑英雄
app.post('/hero/update', (req, res) => {
    // console.log(req.url);
    // console.log(req.body);
    // console.log(req.files);
    let { id, skill, name } = req.body;
    let { icon } = req.files;
    console.log(icon);

    // 处理
    //文件处理
    icon.mv(`${__dirname}/static/imgs/${name}${id}.png`, (err) => {
        if (err) {
            // throw err;
            res.send({
                code: 500,
                msg: '编辑失败'
            })
        }
    })
    // 文本处理（写入数据库）
    heroModel.update(`id=${id}`, {
        name,
        skill: `http://127.0.0.1:3000/imgs/${name}${id}.png`
    }, err => {
        if (err) {
            throw err;
            //响应
            res.send({
                code: 500,
                msg: err
            })
        } else {
            res.send({
                code: 200,
                msg: '编辑成功'
            })
        }
    })


})
//4.删除英雄
app.post('/hero/delete', (req, res) => {
    console.log(req.body);
    let { id } = req.body;
    heroModel.delete(`id=${id}`, err => {
        if (err) {
            res.send({
                code: 500,
                msg: err
            })

        } else {
            res.send({
                code: 200,
                msg: '删除成功'
            })
        }
    })

})
//5.新增英雄
app.post('/hero/add', (req, res) => {
    console.log(req.body);
    console.log(req.files);
    let { name, skill } = req.body;
    let { icon } = req.files;

    // 文件处理
    icon.mv(`${__dirname}/static/imgs/${name}.png`, err => {
        if (err) {
            res.send({
                code: 500,
                msg: '新增错误'
            })
        }
    })
    // 文本处理
    heroModel.insert({
        name, skill, icon: `http://127.0.0.1:3000//imgs/${name}.png`
    }, err => {
        if (err) {
            res.send({
                code: 500,
                msg: '新增失败'
            })

        } else {
            res.send({
                code: 200,
                msg: '新增成功'
            })
        }
    })

})
// //6.验证码
let text = '';
const svgCaptcha = require('svg-captcha');
app.get('/captcha', (req, res) => {
    var user = svgCaptcha.create({
        size: 4,
        noise: 2,
        color: true,
        background: '#e5562f',
    });
    // console.log(user);// 对象

    text = user.text;

    res.type('svg');
    res.status(200).send(user.data);

})
//7.用户注册
app.post('/user/register', (req, res) => {
    // console.log(req.url);
    // console.log(req.body);
    let { username, code, password } = req.body;
    // 查找
    if (code.toLocaleLowerCase() == text.toLocaleLowerCase()) {// 验证码正确
        console.log(username);
        userModel.find(`username="${username}"`, (err, results) => {//查找用户是否注册
            if (err) {
                // throw err
                res.send({
                    code: 500,
                    msg: '注册失败'
                })
            } else {
                console.log(results);
                if (results.length == 0) {// results.length==0 说明没有该用户
                    userModel.insert({
                        username, password
                    }, err => {
                        if (err) {
                            res.send({
                                code: 500,
                                msg: '注册失败'
                            })

                        } else {
                            res.send({
                                code: 200,
                                msg: '注册成功'
                            })
                        }

                    })

                } else {
                    res.send({
                        code: 401,
                        msg: '该用户已存在'
                    })
                }

            }
        })

    } else {
        res.send({
            code: 402,
            msg: '验证码错误'
        })

    }

})
// //8.用户登录
app.post('/user/login', (req, res) => {
    // console.log(req.url);
    // console.log(req.body);
    let { password, username } = req.body;

    // 判断
    userModel.find(`username="${username}"`, (err, results) => {
        if (err) {// 一般数据库不会返回err 会查找成功
            // throw err
            res.send({
                code: 500,
                msg: '登录失败'
            })

        } else {
            // console.log(results);
            if (results.length == 0) {
                res.send({
                    code: 500,
                    msg: '该用户名还未注册'
                })

            } else {
                if (password == results[0].password) {//检测密码是否正确
                    console.log({ password, username });
                    req.session.user = { password, username };
                    res.send({
                        code: 200,
                        msg: '登录成功'
                    })

                } else {
                    // /* 细节：虽然后台知道账号错还是密码错，但是一般不会告诉你具体原因
                    //                都会返回用户名或密码错误。 防止撞库攻击
                    //                */
                    res.send({
                        code: 402,
                        msg: '用户名或者密码错误'
                    })
                }
            }

        }
    })



})
// //退出登录
app.get('/logout', (req, res) => {
    console.log(req.url);
    //清空session
    req.session = null;
    //2.重定向显示首页
    res.writeHead(302, {
        'Location': './index.html'
    });
    res.end();

})

/* 兜底的路由：404路由(express默认就有的，也可以自己写一个覆盖默认的) */
app.use((req, res) => {
    // res.send('6666')
    res.writeHead(302, { 'Location': '/' });
    res.end();
});





//3.开启服务器
app.listen(3000, () => { console.log('success') })