const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils')
const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  orders: forwardTo('db'),
  me(parent, args, ctx, info) {
    //check if there is a current userId
    if(!ctx.request.userId) {
      return null
    }
    return ctx.db.query.user({
      where: { id: ctx.request.userId }
    }, info );
  },
  async users(parent, args, ctx, info) {
    //check if user has permissions to query all users
    if(!ctx.request.userId) {
      throw new Error("Please login in")
    }
    hasPermission(ctx.request.user, ['ADMIN',
    'PERMISSIONUPDATE']);
    return ctx.db.query.users({}, info)
    //if they do query all the users
  },

  async order(parent, args, ctx, info) {
    //make sure logged in
    if(!ctx.request.userId) {
      throw new Error("Log in")
    }
    //query current order
    const order = await ctx.db.query.order({
      where: { id: args.id },
    }, info)
    //check if have permissions to see order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes('ADMIN');
    if(!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error("Not your order")
    }
    //return the order
    return order;

  },

  async orders(parent, args, ctx, info) {
    // if(!ctx.request.userId) {
    //   throw new Error("Please Log IN")
    // }
    const { userId } = args
    const orders = await ctx.db.query.orders({
      where: {
        user: { id: userId },
      },
    }, info)
    console.log("getting orders")
    console.log(args.user)
    return orders
  }

};

module.exports = Query;

