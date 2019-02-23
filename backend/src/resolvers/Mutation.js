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
  },

  updateItem(parent, args, ctx, info) {
    // First take a copy of the updates
    const updates = { ...args };

    // Remove the id from the updates
    delete updates.id;

    // Run the update method
    return ctx.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id,
      },
    }, info);
  }
};

module.exports = Mutations;
