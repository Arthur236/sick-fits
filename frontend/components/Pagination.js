import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import Head from 'next/head';
import Link from 'next/link';

import PaginationStyles from './styles/PaginationStyles';

import { perPage } from "../config";

const PAGINATION_QUERY = gql`
  query PAGINATION_QUERY {
    itemsConnection {
      aggregate {
        count
      }
    }
  }
`;

const Pagination = props => {
  return (

    <Query query={PAGINATION_QUERY}>
      {
        payload => {
          const { data, error, loading } = payload;
          const { page } = props;

          if (loading) {
            return <p>Loading...</p>
          }

          const count = data.itemsConnection.aggregate.count;
          const pages = Math.ceil(count / perPage);

          return (
            <PaginationStyles>
              <Head>
                <title>Sick fits | Page {page} of {pages}</title>
              </Head>

              <Link
                prefetch
                href={{
                  pathname: 'items',
                  query: { page: page - 1 }
                }}>
                <a className="prev" aria-disabled={page <= 1}>← Prev</a>
              </Link>

              <p>Page {page} of {pages}</p>
              <p>{count} Items Total</p>

              <Link
                prefetch
                href={{
                  pathname: 'items',
                  query: { page: page + 1 }
                }}>
                <a className="next" aria-disabled={page >= pages}>Next →</a>
              </Link>
            </PaginationStyles>
          )
        }
      }
    </Query>
  );
};

export default Pagination;
