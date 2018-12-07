import React, { Component } from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { format, formatDistance } from "date-fns";
import styled from "styled-components";
import Link from "next/link";

import OrderItemStyles from "../components/styles/OrderItemStyles";
import { CURRENT_USER_QUERY } from "./User";
import Error from "./ErrorMessage";

import formatMoney from "../lib/formatMoney";

const ALL_ORDER_QUERY = gql`
  query ALL_ORDER_QUERY {
    orders(orderBy: createdAt_DESC) {
      id
      charge
      total
      createdAt
      items {
        id
        title
        image
        description
        quantity
      }
    }
  }
`;

const orderUl = styled.div`
  display: grid;
  grid-gap: 4rem;
  grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
`;

class OrderList extends Component {
  render() {
    return (
      <OrderItemStyles>
        <h1>Orders</h1>
        <Query query={CURRENT_USER_QUERY} variables={{ id: this.props.id }}>
          {user => {
            if (!user) return null;
            const me = user.data.me;
            const id = me.id;
            return (
              <Query query={ALL_ORDER_QUERY}>
                {({ data: { orders }, loading, error }) => {
                  if (loading) return <p>Loading.. </p>;
                  if (!orders) return <p>No Orders Found</p>;
                  return (
                    <div>
                      <orderUl>
                        {orders.map(order => (
                          <OrderItemStyles key={order.id}>
                            <Link
                              href={{
                                pathname: "/order",
                                query: { id: order.id }
                              }}
                            >
                              <a>
                                <div className="order-meta">
                                  <p>
                                    {order.items.reduce(
                                      (a, b) => a + b.quantity,
                                      0
                                    )}{" "}
                                    Items
                                  </p>
                                  <p>{order.items.length} Products</p>
                                  <p>
                                    {formatDistance(
                                      order.createdAt,
                                      new Date()
                                    )}{" "}
                                    ago
                                  </p>
                                  <p>{formatMoney(order.total)}</p>
                                </div>
                                <div className="images">
                                  {order.items.map(item => (
                                    <img
                                      key={item.id}
                                      src={item.image}
                                      alt={item.title}
                                    />
                                  ))}
                                </div>
                              </a>
                            </Link>
                          </OrderItemStyles>
                        ))}
                      </orderUl>
                    </div>
                  );
                }}
              </Query>
            );
          }}
        </Query>
      </OrderItemStyles>
    );
  }
}

export default OrderList;
