import ResetPage from "../components/ResetPage";

const Reset = props => (
  <div>
    <ResetPage resetToken={props.query.resetToken} />
  </div>
);
export default Reset;
