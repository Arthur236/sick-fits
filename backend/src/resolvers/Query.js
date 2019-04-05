const { forwardTo } = require('prisma-binding');

const { hasPermission } = require('../utils');

const Query = {
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //
  //   return items;
  // },

  items: forwardTo('db'),

  item: forwardTo('db'),

  itemsConnection: forwardTo('db'),

  me(parent, args, ctx, info) {
    // Check if there is a current user id
    if (!ctx.request.userId) {
      return null;
    }

    return ctx.db.query.user({
      where: { id: ctx.request.userId }
    }, info);
  },

  async users(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }

    // Check if the user has the permission to query all the users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

    // Query all the users if they do
    return ctx.db.query.users({}, info);
  },

  async order(parent, args, ctx, info) {
    // Make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error('You aren\'t logged in!');
    }

    // Query the current order
    const order = await ctx.db.query.order(
      {
        where: { id: args.id },
      },
      info
    );

    // Check if the have the permissions to see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes('ADMIN');

    if (!ownsOrder && !hasPermissionToSeeOrder) {
      throw new Error('You cant see this buddd');
    }

    // Return the order
    return order;
  },
};

module.exports = Query;
