import React, { Component } from 'react';
import { Mutation } from "react-apollo";
import gql from 'graphql-tag';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const REMOVE_FROM_CART_MUTATION = gql`
  mutation REMOVE_FROM_CART_MUTATION($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`;

const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  
  &:hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`;

class RemoveFromCart extends Component {
  render() {
    return (
      <Mutation
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{ id: this.props.id }}
        refetchQueries={[
          { query: CURRENT_USER_QUERY }
        ]}
      >
        {
          (removeFromCart, payload) => {
            const { error, loading } = payload;

            return (
              <BigButton
                title="Delete Item"
                disabled={loading}
                onClick={() => {
                  removeFromCart().catch(err => alert(err.message));
                }}
              >
                &times;
              </BigButton>
            );
          }
        }
      </Mutation>
    );
  }
}

RemoveFromCart.propTypes = {
  id: PropTypes.string.isRequired,
};

export default RemoveFromCart;
export { REMOVE_FROM_CART_MUTATION };
