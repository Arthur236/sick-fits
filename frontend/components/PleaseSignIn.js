import React from 'react';
import { Query } from "react-apollo";

import Signin from './Signin';

import { CURRENT_USER_QUERY } from "./User";

const PleaseSignIn = props => {
  return (
    <Query query={CURRENT_USER_QUERY}>
      {
        payload => {
          const { data, loading } = payload;

          if (loading) {
            return <p>Loading...</p>
          }

          if (!data.me) {
            return (
              <div>
                <p>Please Sign In Before Continuing</p>
                <Signin/>
              </div>
            );
          }

          return props.children;
        }
      }
    </Query>
  );
};

export default PleaseSignIn;
