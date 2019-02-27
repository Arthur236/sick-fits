import React from 'react';
import { Mutation, Query } from "react-apollo";
import gql from 'graphql-tag';

import CartStyles from './styles/CartStyles';
import Supreme from './styles/Supreme';
import CloseButton from './styles/CloseButton';
import SickButton from './styles/SickButton';
import User from './User';
import CartItem from './CartItem';

import calcTotalPrice from '../lib/calcTotalPrice';
import formatMoney from "../lib/formatMoney";

const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client
  }
`;

const TOGGLE_CART_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;

const Cart = props => {
  return (
    <User>
      {
        payload => {
          const { data: { me } } = payload;

          if (!me) {
            return null;
          }

          return (
            <Mutation mutation={TOGGLE_CART_MUTATION}>
              {
                toggleCart => {
                  return (
                    <Query query={LOCAL_STATE_QUERY}>
                      {
                        payload => {
                          const { data } = payload;

                          return (
                            <CartStyles open={data.cartOpen}>
                              <header>
                                <CloseButton title="close" onClick={toggleCart}>
                                  &times;
                                </CloseButton>

                                <Supreme>{me.name}'s Cart</Supreme>

                                <p>
                                  You have {me.cart.length} item{me.cart.length === 1 ? '' : 's'} in
                                  your cart
                                </p>
                              </header>

                              <ul>
                                {
                                  me.cart.map(cartItem => (
                                    <CartItem key={cartItem.id} cartItem={cartItem}/>
                                  ))
                                }
                              </ul>

                              <footer>
                                <p>{formatMoney(calcTotalPrice(me.cart))}</p>

                                <SickButton>Checkout</SickButton>
                              </footer>
                            </CartStyles>
                          );
                        }
                      }
                    </Query>
                  );
                }
              }
            </Mutation>
          );
        }
      }
    </User>
  );
};

export default Cart;
export { LOCAL_STATE_QUERY, TOGGLE_CART_MUTATION };
