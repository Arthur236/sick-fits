import React, { Component } from 'react';
import { Mutation } from "react-apollo";
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

import Form from './styles/Form';
import Error from './ErrorMessage';

import { CURRENT_USER_QUERY } from "./User";

const RESET_MUTATION = gql`
  mutation RESET_MUTATION($resetToken: String!, $password: String!, $confirmPassword: String!) {
    resetPassword(resetToken: $resetToken, password: $password, confirmPassword: $confirmPassword) {
      id
      name
      email
    }
  }
`;

class Reset extends Component {
  state = {
    password: '',
    confirmPassword: '',
  };

  saveToState = e => {
    const { name, value } = e.target;

    this.setState({
      [name]: value,
    })
  };

  render() {
    const { password, confirmPassword } = this.state;
    const { resetToken } = this.props;

    return (
      <Mutation
        mutation={RESET_MUTATION}
        variables={{
          resetToken,
          password,
          confirmPassword
        }}
        refetchQueries={[
          { query: CURRENT_USER_QUERY }
        ]}
      >
        {
          (resetPassword, payload) => {
            const { error, loading, called } = payload;

            return (
              <Form method="post" onSubmit={async e => {
                e.preventDefault();

                const res = await resetPassword();
                this.setState({
                  password: '',
                  confirmPassword: '',
                });
              }}>
                <fieldset disabled={loading} aria-busy={loading}>
                  <h2>Reset Your Password</h2>

                  <Error error={error}/>

                  <label htmlFor="password">
                    Password
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={password}
                      onChange={this.saveToState}
                    />
                  </label>

                  <label htmlFor="confirmPassword">
                    Confirm Your Password
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={this.saveToState}
                    />
                  </label>

                  <button type="submit">Reset Your Password!</button>
                </fieldset>
              </Form>
            );
          }
        }
      </Mutation>
    );
  }
}

Reset.propTypes = {
  resetToken: PropTypes.string.isRequired,
};

export default Reset;
export { RESET_MUTATION };
