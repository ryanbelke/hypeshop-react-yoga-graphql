import React, { Component } from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import { CURRENT_USER_QUERY } from "./User";

const REMOVE_FROM_CART_MUTATION = gql`
  mutation removeFromCart($id: ID!) {
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
  state = {
    cart: 0
  };
  static propTypes = {
    id: PropTypes.string.isRequired
  };
  update = (cache, payload) => {
    //called as soon as a response comes back from the server
    //read cache
    const data = cache.readQuery({
      query: CURRENT_USER_QUERY
    });
    console.log({ data });
    //remove item from cart
    const cartItemId = payload.data.removeFromCart.id;
    const filteredCart = data.me.cart.filter(
      cartItem => cartItem.id !== cartItemId
    );
    const newData = Object.assign({}, data);
    newData.me.cart = filteredCart;

    cache.writeQuery(
      {
        query: CURRENT_USER_QUERY,
        data: newData
      },
      console.log(cache.readQuery({ query: CURRENT_USER_QUERY }))
    );
  };
  render() {
    return (
      <Mutation
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{ id: this.props.id }}
        update={this.update}
        optimisticResponse={{
          __typename: "Mutation",
          removeFromCart: {
            __typename: "CartItem",
            id: this.props.id
          }
        }}
      >
        {(removeFromCart, { loading, error }) => (
          <BigButton
            disabled={loading}
            onClick={() => {
              removeFromCart().catch(err => alert(err.message));
            }}
            title="Delete Item"
          >
            &times;
          </BigButton>
        )}
      </Mutation>
    );
  }
}

export default RemoveFromCart;
