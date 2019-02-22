/*
 * Custom App component for next.js
 */

import React from 'react';
import App, { Container } from 'next/app';
import { ApolloProvider } from "react-apollo";
import withData from '../lib/withData';

import Page from '../components/Page';

class MyApp extends App {
  /*
   * getInitialProps is special next.js life cycle method that runs before render
   * Anything that is returned from this method is exposed via props
   */
  static async getInitialprops({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    // Expose the query to the user
    pageProps.query = ctx.query;

    return { pageProps };
  }

  render() {
    const { Component, apollo, pageProps } = this.props;

    return (
      <Container>
        <ApolloProvider client={apollo}>
          <Page>
            <Component {...pageProps} />
          </Page>
        </ApolloProvider>
      </Container>
    );
  }
}

export default withData(MyApp);
