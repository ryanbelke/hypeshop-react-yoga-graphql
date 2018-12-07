import React, { Component } from "react";
import PropTypes from "prop-types";
import { Query } from "react-apollo";
import { format } from "date-fns";
import Head from "next/head";
import gql from "graphql-tag";
import formatMoney from "../lib/formatMoney";
import Error from "./ErrorMessage";
import OrderStyles from "./styles/OrderItemStyles";
import Order from "./Order";

const SINGLE_ORDER_QUERY = gql`
  query SINGLE_ORDER_QUERY($id: ID!) {
    order(id: $id) {
      id
      charge
      total
      createdAt
      user {
        id
      }
      items {
        id
        title
        description
        price
        image
        quantity
      }
    }
  }
`;

class OrderPage extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  };
  render() {
    return (
      <div>
        <Query query={SINGLE_ORDER_QUERY} variables={{ id: this.props.id }}>
          {({ data, error, loading }) => {
            if (error) return <Error error={error} />;
            if (loading) return <p>Loading ...</p>;
            const order = data.order;
            return (
              <OrderStyles>
                <Head>
                  <title>Hype Shop - Order {order.id}</title>
                </Head>
                <p>Order Id: {this.props.id}</p>
                <p>
                  <span>Charge:</span>
                  <span>&nbsp; {order.charge}</span>
                </p>
                <p>
                  <span>Date:</span>
                  <span>
                    &nbsp; {format(order.createdAt, "MMMM d, yyyy h:mm a")}
                  </span>
                </p>
                <p>
                  <span>Order Total:</span>
                  <span>&nbsp; {formatMoney(order.total)}</span>
                </p>
                <p>
                  <span>Item Count:</span>
                  <span>&nbsp; {order.items.length}</span>
                </p>
                <div className="items">
                  {order.items.map(item => (
                    <div key={item.id} className="order-item">
                      <img
                        width="150"
                        height="100"
                        src={item.image}
                        alt={item.title}
                      />
                      <p>Qty: {item.quantity}</p>
                      <p>Each: {formatMoney(item.price)}</p>
                      <p>Subtotal: {formatMoney(item.price * item.quantity)}</p>
                      <p>Description: &nbsp; {item.description}</p>
                    </div>
                  ))}
                </div>
              </OrderStyles>
            );
          }}
        </Query>
      </div>
    );
  }
}

export default OrderPage;
