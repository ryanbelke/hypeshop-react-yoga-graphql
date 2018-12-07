import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import wait from "waait";
import { MockedProvider } from "react-apollo/test-utils";
import Router from "next/router";
import CreateItem, { CREATE_ITEM_MUTATION } from "../components/CreateItem";
import { fakeItem } from "../lib/testUtils";

const image = "https://image.com/image.jpg";

//mock the global fetch API
global.fetch = jest.fn().mockResolvedValue({
  json: () => ({ secure_url: image, eager: [{ secure_url: image }] })
});
describe("<CreateItem />", () => {
  it("renders and matches snapshot", async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });
  it("uploads file when changed", async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const input = wrapper.find('input[type="file"]');
    input.simulate("change", { target: { files: ["fakefilejpg"] } });
    await wait();
    const component = wrapper.find("CreateItem").instance();
    expect(component.state.image).toEqual(image);
    expect(global.fetch).toHaveBeenCalled();
    global.fetch.mockReset();
  });

  it("handles state updating", async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    wrapper
      .find("#title")
      .simulate("change", { target: { value: "Testing", name: "title" } });
    wrapper.find("#price").simulate("change", {
      target: { value: 5000, name: "price", type: "number" }
    });
    wrapper.find("#description").simulate("change", {
      target: { value: "Nice Item", name: "description" }
    });
    expect(wrapper.find("CreateItem").instance().state).toMatchObject({
      title: "Testing",
      price: 5000,
      description: "Nice Item"
    });
  });

  it("creates an item when the form is submitted", async () => {
    const item = fakeItem();
    const mocks = [
      {
        request: {
          query: CREATE_ITEM_MUTATION,
          variables: {
            title: item.title,
            description: item.description,
            image: "",
            largeImage: "",
            price: item.price
          }
        },
        result: {
          data: {
            createItem: {
              ...item,
              typeName: "Item"
            }
          }
        }
      }
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );
    wrapper
      .find("#title")
      .simulate("change", { target: { value: item.title, name: "title" } });
    wrapper.find("#price").simulate("change", {
      target: { value: item.price, name: "price", type: "number" }
    });
    wrapper.find("#description").simulate("change", {
      target: { value: item.description, name: "description" }
    });
    //mock the router
    Router.router = { push: jest.fn() };
    wrapper.find("form").simulate("submit");
    await wait(50);
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: "/item",
      query: { id: "abc123" }
    });
  });
});
