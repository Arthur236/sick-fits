import React, { Component } from 'react';
import { Mutation } from "react-apollo";
import gql from 'graphql-tag';

import Form from './styles/Form';
import Error from './ErrorMessage';

const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION($email: String!, $name: String!, $password: String!) {
    signup(email: $email, name: $name, password: $password) {
      id
      name
      email
    }
  }
`;

class Signup extends Component {
  state = {
    name: '',
    email: '',
    password: '',
  };

  saveToState = e => {
    const { name, value } = e.target;

    this.setState({
      [name]: value,
    })
  };

  render() {
    const { email, name, password } = this.state;

    return (
      <Mutation mutation={SIGNUP_MUTATION} variables={this.state}>
        {
          (signup, payload) => {
            const { error, loading } = payload;

            return (
              <Form method="post" onSubmit={async e => {
                e.preventDefault();

                const res = await signup();
                this.setState({
                  name: '',
                  email: '',
                  password: '',
                });
              }}>
                <fieldset disabled={loading} aria-busy={loading}>
                  <h2>Sig Up For An Account</h2>

                  <Error error={error}/>

                  <label htmlFor="name">
                    Name
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={name}
                      onChange={this.saveToState}
                    />
                  </label>

                  <label htmlFor="email">
                    Email
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={email}
                      onChange={this.saveToState}
                    />
                  </label>

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

                  <button type="submit">Sign Up!</button>
                </fieldset>
              </Form>
            );
          }
        }
      </Mutation>
    );
  }
}

export default Signup;
