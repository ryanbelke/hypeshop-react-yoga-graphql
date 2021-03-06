
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils')
const stripe = require('../stripe');

const Mutations = { 
    async createItem(parent, args, ctx, info) {
      // TODO: Check if they are logged in
      if(!ctx.request.userId) {
        throw new Error("You must be logged in")
      }
      const item = await ctx.db.mutation.createItem(
        {
          data: {
            user: {
              //this is how you create a relationship between item and user
              connect: {
                id: ctx.request.userId,
              },
            },
            ...args,
          },
        },
        info
      );
  
      console.log(item);
  
      return item;
    },
    
    updateItem(parent, args, ctx, info) {
      // first take a copy of the updates
      const updates = { ...args };
      // remove the ID from the updates
      delete updates.id;
      // run the update method
      return ctx.db.mutation.updateItem(
        {
          data: updates,
          where: {
            id: args.id,
          },
        },
        info
      );
    },

      async deleteItem(parent, args, ctx, info) {

        const where = { id: args.id };
        // 1. find the item
        const item = await ctx.db.query.item({ where }, `{ id title user { id } }`);
        // 2. Check if they own that item, or have the permissions
        // TODO
        const ownsItem = item.user.id === ctx.request.userId;
        const hasPermisssions = ctx.request.user.permissions.some(
          permission => ['ADMIN', 'ITEMDELETE'].includes(permission)
        )
        if(!ownsItem || !hasPermission ) {
          throw new Erorr("insufficient permission")
        }

        // 3. Delete it!
        return ctx.db.mutation.deleteItem({ where }, info);
      },

      async signup(parent, args, ctx, info) {
        //lowercase email
        args.email.toLowerCase();
        //hash the password
        const password = await bcrypt.hash(args.password, 10);
        //create user in database
        const user = await ctx.db.mutation.createUser({
          data: {
            ...args,
            password,
            permissions: { set: ['USER'] }
          }
        }, info);
        const token = jwt.sign({ userId: user.id}, process.env.APP_SECRET);
        //set the jwt as a cookie on response
        ctx.response.cookie('token', token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 365, //1 year

        });
        //finally return user to the browser
        return user
      },

      async signin(parent, { email, password }, ctx, info) {
        //check if there is a user with that email
        const user = await ctx.db.query.user({ where: { email: email }})
        if(!user) {
          throw new Error(`No such user found for email ${email}`)
        }
        //check if their password is correct
        const valid = await bcrypt.compare(password, user.password)
        if(!valid) {
          throw new Error('Invalid Password');
        }
        const token = jwt.sign({ userId: user.id}, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 365, //1 year

        });
        return user;
      },

      signout(parent, args, ctx, info) {
        ctx.response.clearCookie('token')
        return { message: 'Goodybye' };
      },

      async requestReset(parent, args, ctx, info) {
        //check for real user
        const user = await ctx.db.query.user({ where: { email: args.email }})
        if(!user) {
          throw new Error(`No such user found for email ${args.email}`)
        }
        //set reste token and expiry
        const resetToken = (await promisify(randomBytes)(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000
        const res = await ctx.db.mutation.updateUser({
          where: { email: args.email },
          data: { resetToken, resetTokenExpiry }
        })
        const mailRes = await transport.sendMail({
          from: 'Ryan Belke',
          to: user.email,
          subject: 'Your Password Reset',
          html: makeANiceEmail(
            `Your Password reset Token \n\n 
            <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
            Reset </a>
            `)
        })
        //email reset token
        return { message: "Password reset successful" }
      },

      async resetPassword(parent, args, ctx, info) {
        //check if passwords matc
        if(args.password !== args.confirmPassword) {
          throw new Error('Password does not match')
        }

        //check if a legit reset token

        //check if its expired
        const [user] = await ctx.db.query.users({
          where: {
            resetToken: args.resetToken,
            resetTokenExpiry_gte: Date.now() - 3600000
          }
        });
        if(!user) {
          throw new Error('This token is either invalid or expired')
        }
        //hash new password
        const password = await bcrypt.hash(args.password, 10);
        //save new password and remove old reset token
        const updatedUser = await ctx.db.mutation.updateUser({
          where: { email: user.email },
          data: { 
            password,
            resetToken: null,
            resetTokenExpiry: null,
          }
        })
        const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
        //set jwt in cookie
        ctx.response.cookie('token', token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 365
        });
        return updatedUser;
      },

      async updatePermissions(parent, args, ctx, info) {
        //check if they are logged in 
        if(!ctx.request.userId) {
          throw new Error("Must be logged in")
        }
        //query current user
        const currentUser = await ctx.db.query.user({
          where: {
            id: ctx.request.userId,
          },
        },
          info
       );

        //check 
        hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
        return ctx.db.mutation.updateUser({ 
          data: {
            permissions: { 
              set: args.permissions,
            }
          },
          where: {
            id: args.userId,
          },

        }, info)
      },

      async addToCart(parent, args, ctx, info) {
        //make sure signed in
        const { userId } = ctx.request;
        if(!userId) {
          throw new Error("sign in")
        }
        //query users current cart
        const [existingCartItem] = await ctx.db.query.cartItems({
          where: {
            user: { id: userId },
            item: { id: args.id },
          }
        });
        //check if the item is already in their cart and + 1 if so
        if(existingCartItem) {
          console.log("item already in cart")
          return ctx.db.mutation.updateCartItem({
            where: { id: existingCartItem.id },
            data: { quantity: existingCartItem.quantity + 1 }
          }, info)
        }
        //if its first time create new cart item
        return ctx.db.mutation.createCartItem({
          data: {
            user: { connect: { id: userId } },
            item: { connect: { id: args.id } },
          }
        }, info
       )},
       
       async removeFromCart(parent, args, ctx, info) {
        //find cart item
        const cartItem = await ctx.db.query.cartItem({
          where: {
            id: args.id,
          },
        }, `{ id, user { id } }`
        );
        //make sure found item
        if(!cartItem) {
          throw new Error("No Cart item Found")
        }
        //make sure own cart item
        if(cartItem.user.id !== ctx.request.userId) {
          throw new Error("Error Removing")
        }
        //delete cart item
        return ctx.db.mutation.deleteCartItem({
          where: {
            id: args.id
          },
        }, info)
       },
       async createOrder(parent, args, ctx, info) {
         //query current user and make sure they are signed in
        const { userId } = ctx.request;
        if(!userId) throw new Error('You must be signed in to complete this order')
        const user = await ctx.db.query.user({
          where: {
            id: userId
          }
        }, `{ 
          id name email cart 
            { id quantity item 
              { title price id description image largeImage }
           }}`)
         //recalculate total for the price
         const amount = user.cart.reduce((tally, cartItem) => tally + cartItem.item.price * cartItem.quantity, 0)
         //create the stripe charge
         console.log("going to charge for total of " + amount)
         const charge = await stripe.charges.create({
            amount,
            currency: 'USD',
            source: args.token
         });
         //convert cartItems to orderItems
         const orderItems = user.cart.map(cartItem => {
          const orderItem = {
            ...cartItem.item,
            user: { connect: { id: userId } },
          }
          delete orderItem.id;
          return orderItem;
         });
         //create the order 
         const order = await ctx.db.mutation.createOrder({
           data: {
             total: charge.amount,
             charge: charge.id,
             items: { create: orderItems },
             user: { connect: { id: userId } },
           }
         });
         //clear the users cart
         const cartItemIds = user.cart.map(cartItem => cartItem.id);
         await ctx.db.mutation.deleteManyCartItems({
           where: {
             id_in: cartItemIds,
           }
         })
         //return the order to client
         return order;
       }
    };
  
  module.exports = Mutations;