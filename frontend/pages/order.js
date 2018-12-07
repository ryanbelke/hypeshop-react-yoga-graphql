import PleaseSignIn from "../components/PleaseSignIn";
import OrderPage from "../components/Order";

const Order = props => (
  <div>
    <PleaseSignIn>
      <p>Order Page:</p>
      <OrderPage id={props.query.id} />
    </PleaseSignIn>
  </div>
);
export default Order;
