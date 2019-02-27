import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import RemoveFromCart from './RemoveFromCart';

import formatMoney from '../lib/formatMoney';

const CartItemStyles = styled.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightgrey};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  
  img {
    margin-right: 10px;
  }
  
  h3 {
    margin: 0;
  }
`;

const CartItem = props => {
  const { cartItem } = props;

  // Check if that item exists
  if (!cartItem.item) {
    return (
      <CartItemStyles>
        This item has been removed

        <div className="cart-item-details"/>

        <RemoveFromCart id={cartItem.id}/>
      </CartItemStyles>
    );
  }

  const { item, quantity } = cartItem;

  return (
    <CartItemStyles>
      <img src={item.image} alt={item.title} width="100"/>

      <div className="cart-item-details">
        <h3>{item.title}</h3>

        <p>
          {formatMoney(item.price * quantity)}
          {' - '}
          <em>
            {quantity} &times; {formatMoney(item.price)} each
          </em>
        </p>
      </div>

      <RemoveFromCart id={cartItem.id}/>
    </CartItemStyles>
  );
};

CartItem.propTypes = {
  cartItem: PropTypes.object.isRequired,
};

export default CartItem;
