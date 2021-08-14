import Router from 'koa-router';
import Redis from 'koa-redis'
import nodeMailer from 'nodemailer'
import jwt from 'jsonwebtoken'
import { checkToken } from '../middleware/users'
import User from '../dbs/models/users'
import Email from '../dbs/config'
import axios from '../utils/axios'
import UserModel from "../dbs/models/users";
const Store = new Redis({
  password:'097920'
}).client
const router = new Router({prefix: '/users'})

// 注册
router.post('/signup', async (ctx) => {
  const {username, password, email, code} = ctx.request.body;
  if (code) {
    // 哈希存储
    const saveCode = await Store.hget(`nodemail:${username}`, 'code')
    const saveExpire = await Store.hget(`nodemail:${username}`, 'expire')
    if (code === saveCode) {
      if (new Date().getTime() - saveExpire > 0) {
        ctx.body = {
          code: -1,
          msg: '验证码已过期，请重新尝试'
        }
        return false
      }
    } else {
      ctx.body = {
        code: -1,
        msg: '请填写正确的验证码'
      }
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '请填写验证码'
    }
  }
  const user = await User.find({username})
  if (user.length) {
    ctx.body = {
      code: -1,
      msg: '已被注册'
    }
    return
  }
  const nuser = await User.create({username, password, email})
  if (nuser) {
    const res = await axios.post('/users/signin', {username, password})
    console.log(res)
    if (res.data && res.data.code === 0) {
      ctx.body = {
        code: 1,
        msg: '注册成功',
        user: res.data.user
      }
    } else {
      ctx.body = {
        code: -1,
        msg: 'error'
      }
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '注册失败'
    }
  }
})

// 登录
router.post('/signin', async (ctx, next) => {
  let { username, password} = ctx.request.body
  let user = await UserModel.findOne({username:username});
  if (user != null) {
    if (user.password === password) {
      let token = jwt.sign(
          {username},
          Email.token.jwtSecretKey,
          {expiresIn: Email.token.expiresIn}
      )
      ctx.body = {
        code: 1,
        msg: '登录成功',
        token
      }
    } else {
      ctx.body = {
        code: -1,
        msg: '账号密码错误'
      }
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '用户不存在'
    }
  }
})


// 获取验证码
router.post('/verify', async (ctx, next) => {
  const username = ctx.request.body.username
  const saveExpire = await Store.hget(`nodemail:${username}`, 'expire')
  if (saveExpire && new Date().getTime() - saveExpire < 0) {
    ctx.body = {
      code: -1,
      msg: '验证请求过于频繁，1分钟内1次'
    }
    return false
  }
  // 配置邮件相关服务
  const transporter = nodeMailer.createTransport({
    service: 'qq',
    auth: {
      user: Email.smtp.user,
      pass: Email.smtp.pass
    }
  })
  // 配置邮件相关信息
  const ko = {
    code: Email.smtp.code(),
    expire: Email.smtp.expire(),
    email: ctx.request.body.email,
    user: ctx.request.body.username
  }
  // 配置邮件主题内容
  const mailOptions = {
    from: `"认证邮件" <${Email.smtp.user}>`,
    to: ko.email,
    subject: '《高仿美团网全栈实战》注册码',
    html: `您在《高仿美团网全栈实战》中注册，您的验证码是${ko.code}`
  }
  // 发送邮件
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error)
    } else {
      Store.hmset(`nodemail:${ko.user}`, 'code', ko.code, 'expire', ko.expire, 'email', ko.email)
    }
  })
  ctx.body = {
    code: 1,
    msg: '验证码已发送，可能会有延时，有效期1分钟'
  }
})

router.get('/exit', checkToken,async (ctx, next) => {
  ctx.body = {
    code: 1
  }
})

router.get('/getUser',checkToken, async (ctx) => {
  ctx.body={
    user:'213131',
  }
})

export default router

