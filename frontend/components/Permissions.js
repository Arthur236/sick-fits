import React, { Component } from 'react';
import { Mutation, Query } from "react-apollo";
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

import Error from './ErrorMessage';
import Table from './styles/Table';
import SickButton from './styles/SickButton';

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE',
];

const ALL_USERS_QUERY = gql`
  query ALL_USERS_QUERY {
    users {
      id
      name
      email
      permissions
    }
  }
`;

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation UPDATE_PERMISSIONS_MUTATION($permissions: [Permission], $userId: ID!) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      name
      email
      permissions
    }
  }
`;

const Permissions = props => {
  return (
    <Query query={ALL_USERS_QUERY}>
      {
        payload => {
          const { data, loading, error } = payload;

          if (loading) {
            return <p>Loading...</p>
          }

          return (
            <div>
              <Error error={error}/>

              <h2>Manage Permissions</h2>

              <Table>
                <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {
                    possiblePermissions.map(permission => (
                      <th key={permission}>{permission}</th>
                    ))
                  }
                  <th><i className="fas fa-user-edit"/></th>
                </tr>
                </thead>

                <tbody>
                {
                  data.users.map(user => (
                    <UserPermissions key={user.id} user={user}/>
                  ))
                }
                </tbody>
              </Table>
            </div>
          );
        }
      }
    </Query>
  );
};

class UserPermissions extends Component {
  state = {
    permissions: this.props.user.permissions,
  };

  handlePermissionChange = e => {
    const { checked, value } = e.target;

    // Take a copy of the current permissions
    let updatedPermissions = [...this.state.permissions];

    // Figure out if we need to add or remove this permission
    if (checked) {
      updatedPermissions.push(value);
    } else {
      updatedPermissions = updatedPermissions.filter(permission => permission !== value);
    }

    this.setState({
      permissions: updatedPermissions,
    });


  };

  render() {
    const { user } = this.props;

    return (
      <Mutation mutation={UPDATE_PERMISSIONS_MUTATION} variables={{
        permissions: this.state.permissions,
        userId: this.props.user.id,
      }}>
        {
          (updatePermissions, payload) => {
            const { error, loading } = payload;

            return (
              <>
                {
                  error && <tr><td colSpan="9"><Error error={error}/></td></tr>
                }

                <tr>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  {
                    possiblePermissions.map(permission => (
                      <td key={permission}>
                        <label htmlFor={`${user.id}-permission-${permission}`}>
                          <input
                            id={`${user.id}-permission-${permission}`}
                            type="checkbox"
                            checked={this.state.permissions.includes(permission)}
                            value={permission}
                            onChange={this.handlePermissionChange}
                          />
                        </label>
                      </td>
                    ))
                  }
                  <td>
                    <SickButton
                      type="button"
                      disabled={loading}
                      onClick={updatePermissions}
                    >
                      Updat{loading ? 'ing' : 'e'}
                    </SickButton>
                  </td>
                </tr>
              </>
            );
          }
        }
      </Mutation>
    );
  }
}

UserPermissions.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    permissions: PropTypes.array,
  }).isRequired,
};

export default Permissions;
export { ALL_USERS_QUERY };
