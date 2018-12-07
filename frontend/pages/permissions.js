import PleaseSignIn from "../components/PleaseSignIn";
import PermissionsPage from "../components/Permissions";

const Permissions = props => (
  <div>
    <PleaseSignIn>
      <p>Permissions</p>
      <PermissionsPage />
    </PleaseSignIn>
  </div>
);

export default Permissions;
