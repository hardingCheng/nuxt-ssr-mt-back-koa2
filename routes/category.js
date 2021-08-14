import Router from 'koa-router';
import Category from '../dbs/models/category'

let router = new Router({prefix: '/category'})


router.get('/crumbs',async (ctx)=>{
    let result = await Category.findOne({city: ctx.query.city.replace('市', '')})
    console.log(result)
    if (result) {
      ctx.body = {
        areas: result.areas,
        types: result.types
      }
    } else {
      ctx.body = {
        areas: [],
        types: []
      }
    }
})


export default router;
