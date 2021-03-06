import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';

import Form from './styles/Form';
import Error from './ErrorMessage';

const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      price
    }
  }
`;

const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
  $id: ID!
  $title: String
  $description: String
  $price: Int
  ) {
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
    ) {
      id
      title
      description
      price
    }
  }
`;

class UpdateItem extends Component {
  state = {};

  handleChange = e => {
    const { name, type, value } = e.target;

    const val = type === 'number' ? parseFloat(value) : value;

    this.setState({
      [name]: val,
    });
  };

  updateItem = async (e, updateItemMutation) => {
    e.preventDefault();

    // Call the mutation
    const res = await updateItemMutation({
      variables: {
        id: this.props.id,
        ...this.state,
      }
    });

    // Redirect to the single item page
    Router.push({
      pathname: '/item',
      query: { id: res.data.updateItem.id }
    });
  };

  render() {
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id }}>
        {
          payload => {
            const { data, loading } = payload;

            if (loading) return <p>Loading...</p>;

            if (!data.item) {
              return <p>No data found for id {this.props.id}</p>
            }

            return (
              <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
                {
                  (updateItem, payload) => {
                    const { error, loading } = payload;

                    return (
                      <Form onSubmit={e => this.updateItem(e, updateItem)}>
                        <Error error={error}/>

                        <fieldset disabled={loading} aria-busy={loading}>
                          <label htmlFor="title">
                            Title
                            <input
                              type="text"
                              id="title"
                              name="title"
                              placeholder="Title"
                              required
                              defaultValue={data.item.title}
                              onChange={this.handleChange}
                            />
                          </label>

                          <label htmlFor="price">
                            Price
                            <input
                              type="number"
                              id="price"
                              name="price"
                              placeholder="Price"
                              required
                              defaultValue={data.item.price}
                              onChange={this.handleChange}
                            />
                          </label>

                          <label htmlFor="description">
                            Description
                            <textarea
                              id="description"
                              name="description"
                              placeholder="Enter a description"
                              required
                              defaultValue={data.item.description}
                              onChange={this.handleChange}
                            />
                          </label>

                          <button type="submit">Sav{loading ? 'ing' : 'e'} Changes</button>
                        </fieldset>
                      </Form>
                    );
                  }
                }
              </Mutation>
            );
          }
        }
      </Query>
    );
  }
}

export default UpdateItem;
export { SINGLE_ITEM_QUERY };
export { UPDATE_ITEM_MUTATION };
