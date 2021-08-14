import jwt from 'jsonwebtoken'
import jwtConfig from '../dbs/config'
export function checkToken (ctx, next) {
    let token = ctx.headers['authorization']
    if (!token) {
        ctx.body = {
            code: -1,
            msg: 'token不能为空'
        }
    } else {
        jwt.verify(token, jwtConfig.token.jwtSecretKey, async function (err) {
                if (err) {
                    let message;
                    if (err.name === 'TokenExpiredError') {
                        message = 'token已过期'
                    } else {
                        message = 'token无效'
                    }
                    ctx.body = {
                        code: -1,
                        msg: message
                    }
                } else {
                    return await next();
                }
            }
        )
    }
}

