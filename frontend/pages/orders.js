import OrderList from "../components/OrderList";
import PleaseSignIn from "../components/PleaseSignIn";

const Orders = props => (
  <PleaseSignIn>
    <OrderList />;
  </PleaseSignIn>
);
export default Orders;
