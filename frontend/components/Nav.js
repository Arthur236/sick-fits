import React from 'react';
import Link from 'next/link';
import { Mutation } from 'react-apollo';

import NavStyles from './styles/NavStyles';
import User from './User';
import Signout from './Signout';
import CartCount from './CartCount';

import { TOGGLE_CART_MUTATION } from "./Cart";

const Nav = () => (

  <User>
    {
      payload => {
        const { data } = payload;

        return (
          <NavStyles>
            <Link href="/items">
              <a>Shop</a>
            </Link>

            {
              data.me && (
                <React.Fragment>
                  <Link href="/sell">
                    <a>Sell</a>
                  </Link>

                  <Link href="/orders">
                    <a>Orders</a>
                  </Link>

                  <Link href="/me">
                    <a>Account</a>
                  </Link>

                  <Mutation mutation={TOGGLE_CART_MUTATION}>
                    {
                      toggleCart => (
                        <button onClick={toggleCart}>
                          My Cart
                          <CartCount
                            count={data.me.cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0)}/>
                        </button>
                      )
                    }
                  </Mutation>

                  <Signout/>
                </React.Fragment>
              )
            }

            {
              !data.me && (
                <Link href="/signup">
                  <a>Sign In</a>
                </Link>
              )
            }
          </NavStyles>
        );
      }
    }
  </User>
);

export default Nav;
