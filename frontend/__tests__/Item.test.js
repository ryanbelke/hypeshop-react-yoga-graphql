import ItemComponent from "../components/Item";
import { shallow } from "enzyme";
import toJSON from "enzyme-to-json";

const fakeItem = {
  id: "ABC123",
  title: "A Cool Item",
  price: 5000,
  description: "nice desription",
  image: "dog.jpg",
  largeImage: "largedog.jpg"
};
describe("<Item />", () => {
  it("renders and displays properly", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const PriceTag = wrapper.find("PriceTag");
    const Title = wrapper.find("Title").find("Link");
    expect(Title.children().text()).toBe(fakeItem.title);
    expect(PriceTag.dive().text()).toBe("$50");
    const img = wrapper.find("img");
    expect(img.props().src).toBe(fakeItem.image);
    expect(img.props().alt).toBe(fakeItem.title);
  });
  it("renders and matches the snapshot", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it("renders out the button properly", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const buttonList = wrapper.find(".buttonList");
    expect(buttonList.children()).toHaveLength(3);
    expect(buttonList.find("Link")).toHaveLength(1);
    expect(buttonList.find("AddToCart").exists()).toBe(true);
    expect(buttonList.find("DeleteItem").exists()).toBe(true);
    // console.log(buttonList.debug());
  });
});
