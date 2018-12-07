import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import wait from "waait";
import PleaseSignIn from "../components/PleaseSignIn";
import { CURRENT_USER_QUERY } from "../components/User";
import { MockedProvider } from "react-apollo/test-utils";
import { fakeUser } from "../lib/testUtils";

const notSignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: null } }
  }
];
const signInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: fakeUser() } }
  }
];
describe("<PleaseSignIn />", () => {
  it("renders please sign in dialog to logged out users", async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.text()).toContain("Please Sign In Before Continuing");
    const SignIn = wrapper.find("SignIn");
    expect(SignIn.exists()).toBe(true);
  });

  it("renders the child component when the user is signed in", async () => {
    const ChildC = () => <p>Hey</p>;
    const wrapper = mount(
      <MockedProvider mocks={signInMocks}>
        <PleaseSignIn>
          <ChildC />>
        </PleaseSignIn>
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // console.log(wrapper.debug());
    expect(wrapper.find("ChildC").exists()).toBe(true);
  });
});
