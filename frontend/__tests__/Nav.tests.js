import { mount } from "enzyme";
import wait from "waait";
import toJSON from "enzyme-to-json";
import Nav from "../components/Nav";
import { CURRENT_USER_QUERY } from "../components/User";
import { MockedProvider } from "react-apollo/test-utils";
import { fakeUser, fakeCartItem } from "../lib/testUtils";

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
const signInMocksWithCartItems = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          ...fakeUser(),
          cart: [fakeCartItem(), fakeCartItem(), fakeCartItem()]
        }
      }
    }
  }
];
describe("<Nav />", () => {
  it("renders a minimal nav when signed out", async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const nav = wrapper.find('[data-test="nav"]');
    expect(toJSON(nav)).toMatchSnapshot();
  });
  it("renders full nav when signed in ", async () => {
    const wrapper = mount(
      <MockedProvider mocks={signInMocks}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const nav = wrapper.find('ul[data-test="nav"]');
    // expect(toJSON(nav)).toMatchSnapshot();
    expect(nav.children().length).toBe(6);
    expect(nav.text()).toContain("Sign Out");
    // console.log(nav.debug());
    expect(nav.find('a[href="/items"]').text()).toContain("Shop");
    expect(nav.find('a[href="/sell"]').text()).toContain("Sell");
    expect(nav.find('a[href="/orders"]').text()).toContain("Orders");
    expect(nav.find('button[data-test="cart-button"]').text()).toContain(
      "Cart"
    );
    expect(nav.find('a[href="/me"]').text()).toContain("Account");
  });

  it("renders the amount of items in the cart", async () => {
    const wrapper = mount(
      <MockedProvider mocks={signInMocks}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const nav = wrapper.find('ul[data-test="nav"]');
    const count = nav.find("div.count");
    expect(toJSON(count)).toMatchSnapshot();
    // expect(toJSON(nav)).toMatchSnapshot();
  });
});
