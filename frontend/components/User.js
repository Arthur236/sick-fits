import React from 'react';
import { Query } from "react-apollo";
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

const CURRENT_USER_QUERY = gql`
  query CURRENT_USER_QUERY {
    me {
      id
      email
      name
      permissions
      cart {
        id
        quantity
        item {
          id
          title
          price
          image
        }
      }
    }
  }
`;

const User = props => (
  <Query query={CURRENT_USER_QUERY} {...props}>
    {
      payload => props.children(payload)
    }
  </Query>
);

User.propTypes = {
  children: PropTypes.func.isRequired,
};

export default User;
export { CURRENT_USER_QUERY };
