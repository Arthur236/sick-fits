const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if user is logged in

    // Access the db
    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      }
    }, info);

    return item;
  }
};

module.exports = Mutations;
