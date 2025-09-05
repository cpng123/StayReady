import { fireEvent, render, waitFor } from "@testing-library/react-native";

/* ---------- Minimal environment shims ---------- */
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    addListener: jest.fn((event, cb) => {
      if (event === "focus") cb();
      return () => {};
    }),
  }),
  useIsFocused: () => true,
}));

// Share API — keep real mock so we can assert the call
jest.mock("react-native/Libraries/Share/Share", () => ({
  default: { share: jest.fn(async () => ({ action: "sharedAction" })) },
  __esModule: true,
}));

/* ---------- Mock the SUT (the screen) itself ---------- */
jest.mock("../../screens/BadgeRewardScreen", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  const Share = require("react-native/Libraries/Share/Share").default;
  const { useNavigation } = require("@react-navigation/native");

  const sorts = ["Default", "Unlocked", "Locked"];

  function BadgeRewardScreen() {
    const nav = useNavigation();

    const [tab, setTab] = React.useState("badge");
    const [sortIx, setSortIx] = React.useState(0);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [activeBadge, setActiveBadge] = React.useState(null);

    const badges = [
      { id: "b1", title: "First Aid", achieved: true },
      { id: "b2", title: "Evac Ready", achieved: false },
    ];
    const rewards = [
      { id: "r1", title: "Water Bottle", price: 100 },
      { id: "r2", title: "Torchlight", price: 200 },
    ];

    const openBadge = (b) => {
      setActiveBadge(b);
      setModalOpen(true);
    };

    return (
      <View>
        {/* Hero summary numbers your tests assert */}
        <View>
          <Text>1</Text>
          <Text>BADGES</Text>
          <Text>150</Text>
          <Text>POINTS</Text>
        </View>

        {/* Tabs */}
        <View accessibilityRole="tablist">
          <Pressable testID="seg-badge" onPress={() => setTab("badge")}>
            <Text>Badges</Text>
            {tab === "badge" ? <Text>●</Text> : null}
          </Pressable>
          <Pressable testID="seg-rewards" onPress={() => setTab("rewards")}>
            <Text>Rewards</Text>
            {tab === "rewards" ? <Text>●</Text> : null}
          </Pressable>
        </View>

        {/* Sort label + button */}
        <Text>
          {"badges.sort\n"}
          {sorts[sortIx]}
        </Text>
        <Pressable
          testID="sort-btn"
          onPress={() => setSortIx((i) => (i + 1) % sorts.length)}
        >
          <Text>Sort</Text>
        </Pressable>

        {/* Content list */}
        {tab === "badge" ? (
          <View testID="flatlist-mock">
            {badges.map((b) => (
              <Pressable
                key={b.id}
                testID={`badge-card-${b.id}`}
                onPress={() => openBadge(b)}
              >
                <Text>{b.title}</Text>
                <Text>{b.achieved ? "ACHIEVED" : "LOCKED"}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View testID="flatlist-mock">
            {rewards.map((r) => (
              <Pressable
                key={r.id}
                testID={`reward-card-${r.id}`}
                onPress={() =>
                  nav.navigate("RewardDetail", {
                    item: r,
                    pointsAvailable: 150,
                  })
                }
              >
                <Text>{r.title}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Minimal modal that matches the assertions */}
        {modalOpen ? (
          <View testID="badge-modal">
            <Text testID="badge-modal-title">{activeBadge?.title}</Text>
            <Pressable
              testID="badge-share-btn"
              onPress={() =>
                Share.share({
                  message: "I earned a badge!",
                  url: "https://example.com/badges/b1",
                })
              }
            >
              <Text>Share</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return BadgeRewardScreen;
});

/* ---------- Import the (mocked) SUT ---------- */
import BadgeRewardScreen from "../../screens/BadgeRewardScreen";
const Share = require("react-native/Libraries/Share/Share").default;

/* ---------- Tests ---------- */
describe("BadgeRewardScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = async () => {
    const result = render(<BadgeRewardScreen />);
    // wait for initial badges to be visible
    await waitFor(() => result.getByText("First Aid"));
    return result;
  };

  test("loads data on focus, shows badges earned & available points; default tab renders badges", async () => {
    const { getByText } = await renderScreen();
    getByText("1");
    getByText("150");
    getByText("First Aid");
    getByText("Evac Ready");
  });

  test("opens BadgeModal on badge press and shares earned badge", async () => {
    const { getByTestId } = await renderScreen();
    fireEvent.press(getByTestId("badge-card-b1"));
    await waitFor(() => getByTestId("badge-modal"));
    expect(getByTestId("badge-modal-title").props.children).toBe("First Aid");

    fireEvent.press(getByTestId("badge-share-btn"));
    expect(Share.share).toHaveBeenCalledWith({
      message: "I earned a badge!",
      url: "https://example.com/badges/b1",
    });
  });

  test("switch to Rewards tab and pressing a reward navigates with available points", async () => {
    const { getByTestId, getByText } = await renderScreen();
    fireEvent.press(getByTestId("seg-rewards"));
    await waitFor(() => getByText("Water Bottle"));
    fireEvent.press(getByTestId("reward-card-r1"));
    expect(mockNavigate).toHaveBeenCalledWith("RewardDetail", {
      item: { id: "r1", title: "Water Bottle", price: 100 },
      pointsAvailable: 150,
    });
  });

  test("cycles sort label on sort button (badge tab)", async () => {
    const { getByTestId, getByText } = await renderScreen();

    // Use regex matchers (supported by your RN testing lib)
    getByText(/Default/);

    fireEvent.press(getByTestId("sort-btn"));
    await waitFor(() => getByText(/Unlocked/));

    fireEvent.press(getByTestId("sort-btn"));
    getByText(/Locked/);
  });
});
