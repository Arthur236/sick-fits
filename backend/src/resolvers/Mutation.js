const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { makeANiceEmail, transport } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Check if user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that');
    }

    // Access the db
    const item = await ctx.db.mutation.createItem({
      data: {
        ...args,
        // Create a relationship between the item and the user
        user: {
          connect: {
            id: ctx.request.userId,
          }
        },
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
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };

    // Find the item
    const item = await ctx.db.query.item({ where }, `{ id title user { id } }`);

    // Check if they own that item or have permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    );

    if (!ownsItem || !hasPermissions) {
      throw new Error("You don't have permission to do that!");
    }

    // Delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    args.email = args.email.toLocaleLowerCase();

    const password = await bcrypt.hash(args.password, 10);

    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] }
      }
    }, info);

    // Permissions are set in that way because they are stored in an external enum

    // Create a jwt token for the user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // Set the jwt as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day cookie
    });

    // Finally, return the user to the browser
    return user;
  },

  async signin(parent, args, ctx, info) {
    // Check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email: args.email } });

    if (!user) {
      throw new Error(`No such user found with email ${args.email}`);
    }

    // Check if their password is correct
    const valid = await bcrypt.compare(args.password, user.password);

    if (!valid) {
      throw new Error('Invalid password');
    }

    // Generate jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day cookie
    });

    // Return the user
    return user;
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');

    return { message: 'See you later' };
  },

  async requestReset(parent, args, ctx, info) {
    // Check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });

    if (!user) {
      throw new Error(`No such user found with email ${args.email}`);
    }

    // Set a reset token and expiry on that user
    const promisifiedRandomBytes = promisify(randomBytes);
    const resetToken = (await promisifiedRandomBytes(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Email them the reset token
    const mailRes = await transport.sendMail({
      from: 'info@sickfits.com',
      to: user.email,
      subject: 'Password Reset Link',
      html: makeANiceEmail(`
      Your password reset token is here! \n\n 
      <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
      Click here to reset your password
      </a>
      `)
    });

    // Return the message
    return { message: 'Password reset link will be sent.' };
  },

  async resetPassword(parent, args, ctx, info) {
    // Check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if its a legit reset token and that its not expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });

    if (!user) {
      throw new Error('That token is either invalid or expired');
    }

    // Hash the new password
    const password = await bcrypt.hash(args.password, 10);

    // Save th new password to the user and remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      }
    });

    // Generate jwt
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);

    // Set jwt cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day cookie
    });

    // Return the new user
    return updatedUser;
  },

  async updatePermissions(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }

    // Query the current user
    const currentUser = await ctx.db.query.user({
      where: {
        id: ctx.request.userId
      },
    }, info);

    // Check if they have permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);

    // Update the permissions
    return ctx.db.mutation.updateUser({
      where: {
        id: args.userId
      },
      data: {
        permissions: {
          set: args.permissions
        }
      },
    }, info);
  },

  async addToCart(parent, args, ctx, info) {
    // Make sure they are signed in
    const { userId } = ctx.request;

    if (!userId) {
      throw new Error('You must be logged in!');
    }

    // Query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      },
    });

    // Check if the item is already in their cart and increment by 1 if it is
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 },
      }, info);
    }

    // If its not, create a fresh CartItem for that user
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId },
        },
        item: {
          connect: { id: args.id },
        },
      }
    }, info);
  },

  async removeFromCart(parent, args, ctx, info) {
    // Find cart item
    const cartItem = await ctx.db.query.cartItem({
      where: {
        id: args.id,
      },
    }, `{id, user { id } }`);

    // Make sure we found an item
    if (!cartItem) {
      throw new Error('No cart item found');
    }

    // Make sure they own the cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('Cheatin ey?');
    }

    // Delete the cart item
    return ctx.db.mutation.deleteCartItem({
      where: {
        id: args.id,
      },
    }, info);
  },

  async createOrder(parent, args, ctx, info) {
    // Query the current user and make sure they are signed in
    const { userId } = ctx.request;

    if (!userId) {
      if (!userId) throw new Error('You must be signed in to complete this order.');
    }

    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
        id
        name
        email
        cart {
          id
          quantity
          item {
            title price id description image largeImage
          }
        }
      }`
    );

    // Re-calculate total for the price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity * 100,
      0
    );

    console.log('Charging...', amount);

    // Create the stripe charge (turn token into money)
    const charge = await stripe.charges.create({
      amount,
      currency: 'KES',
      source: args.token,
    });

    // Convert cart items to order items
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      };
      
      delete orderItem.id;
      return orderItem;
    });

    // Create the order

    // Clear the user's cart; delete cart items

    // Return the order to the client

  },
};

module.exports = Mutations;
