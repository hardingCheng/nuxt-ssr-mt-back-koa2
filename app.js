import Koa from 'koa'
import views from 'koa-views'
import json from 'koa-json'
import onerror from 'koa-onerror'
import bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import session from 'koa-generic-session'
import redisStore from 'koa-redis'
import cors from 'koa2-cors'
import mongoose from 'mongoose'
import dbConfig from './dbs/config'
import index from './routes/index'
import users from './routes/users'
import geos from './routes/geo'
import search from './routes/search'
const app = new Koa()
// error handler
onerror(app)
// middlewares
app.use(cors());
app.keys = ['mt', 'hardingcheng']
app.proxy = true
// session设置
app.use(session(
    {
        cookie: {
            httpOnly: true,
            path: '/',
            overwrite: true,
            signed: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000 //one day in ms
        },
        store: new redisStore({
            password: '097920'
        })
    }))


app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))
app.use(views(__dirname + '/views', {
    extension: 'pug'
}))
// 连接数据库
mongoose.connect(dbConfig.dbs, {
    useNewUrlParser: true,
    useUnifiedTopology: true     //这个即是报的警告
}).then(res => {
    console.log('数据库连接成功')
})
// logger
app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(geos.routes(), geos.allowedMethods())
app.use(search.routes(), search.allowedMethods())
// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});
module.exports = app
