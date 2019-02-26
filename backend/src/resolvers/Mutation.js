const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { makeANiceEmail, transport } = require('../mail');
const { hasPermission } = require('../utils');

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
};

module.exports = Mutations;
