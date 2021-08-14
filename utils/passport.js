import passport from "koa-passport";
import UserModel from "../dbs/models/users";
import LocalStrategy from "passport-local";

passport.use(
  new LocalStrategy(async function (username, password, done) {
    let where = {
      username,
    };
    let user = await UserModel.findOne(where);
    if (user != null) {
      if (user.password === password) {
        return done(null, user);
      } else {
        return done(null, false, "密码错误");
      }
    } else {
      return done(null, false, "用户不存在");
    }
  })
);


// serializeUser 在用户登录验证成功以后将会把用户的数据存储到 session 中
passport.serializeUser(function (user, done) {
    done(null, user)
})

// deserializeUser 在每次请求的时候将从 session 中读取用户对象
passport.deserializeUser(function (user, done) {
    console.log(user)
    return done(null, user)
})

module.exports = passport
