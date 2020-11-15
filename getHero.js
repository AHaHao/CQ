const Crawler = require("crawler");
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


var c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            var $ = res.$;
            //将解析出来的数据放到数组里，一次性存入数据库
            //1.声明空数组
            let heroArr = [];
            $('.herolist>li').each((index, elm) => {
                let name = $(elm).children('a').text();
                // console.log(name);
                let icon = $(elm).find('img').attr('src');
                // console.log(icon);
                let id = icon.split('/').reverse()[1];
                // console.log(id);

                // 根据id 拼接 skill 图
                let skill = `https://game.gtimg.cn/images/yxzj/img201606/heroimg/${id}/${id}00.png`;
                // console.log(skill);

                heroArr.push({
                    name,
                    skill,
                    icon
                })


            })
            // console.log(heroArr);

            //4.调用API：添加数据
            heroModel.insert(heroArr, (err, results) => {
                // console.log(err);
                // console.log(results);
                if (!err) console.log('增加成功');
            });


        }
        done();
    }
});

// Queue just one URL, with default callback
c.queue('https://pvp.qq.com/web201605/herolist.shtml');