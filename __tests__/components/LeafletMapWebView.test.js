import { createRef } from "react";
import { render, act } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock react-native-webview with per-instance tracking ----
const instances = [];
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  const WebView = React.forwardRef((props, ref) => {
    const api = { injectJavaScript: jest.fn() };
    React.useImperativeHandle(ref, () => api);
    instances.push({ props, api });
    return <View testID="WebView" {...props} />;
  });

  return { WebView };
});

// SUT
import LeafletMapWebView from "../../components/LeafletMapWebView";

// Helpers
const lastInstance = () => instances[instances.length - 1];
const flattenStyle = (style) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};

describe("LeafletMapWebView", () => {
  beforeEach(() => {
    instances.length = 0;
    jest.clearAllMocks();
  });

  it("renders a WebView with html source and correct originWhitelist", () => {
    render(<LeafletMapWebView />);
    const inst = lastInstance();
    expect(inst).toBeTruthy();
    expect(inst.props.originWhitelist).toEqual(["*"]);
    expect(inst.props.source).toBeTruthy();
    expect(inst.props.source.html).toEqual(expect.any(String));
  });

  it("uses OneMap Original tiles by default and Night tiles in dark mode", () => {
    render(<LeafletMapWebView dark={false} />);
    let inst = lastInstance();
    expect(inst.props.source.html).toContain(
      "https://www.onemap.gov.sg/maps/tiles/Original/{z}/{x}/{y}.png"
    );

    render(<LeafletMapWebView dark />);
    inst = lastInstance();
    expect(inst.props.source.html).toContain(
      "https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png"
    );
  });

  it("initial onLoadEnd injects all dataset updates and selected overlay", () => {
    const props = {
      overlay: "wind",
      rainfallPoints: [{ lat: 1.3, lon: 103.8, value: 2 }],
      windPoints: [{ lat: 1.31, lon: 103.81, value: 8 }],
      tempPoints: [{ lat: 1.32, lon: 103.82, value: 29 }],
      humPoints: [{ lat: 1.33, lon: 103.83, value: 76 }],
      pmPoints: [{ lat: 1.34, lon: 103.84, value: 25 }],
      dengueGeoJSON: { type: "FeatureCollection", features: [] },
      clinicsGeoJSON: { type: "FeatureCollection", features: [] },
    };
    render(<LeafletMapWebView {...props} />);
    const inst = lastInstance();

    // Simulate page ready
    act(() => {
      inst.props.onLoadEnd && inst.props.onLoadEnd();
    });

    // Single big batch injection on load
    expect(inst.api.injectJavaScript).toHaveBeenCalled();
    const injected = inst.api.injectJavaScript.mock.calls[0][0];

    // Assert that initial script includes all update calls and overlay selection
    expect(injected).toContain("window.updateRainfall(");
    expect(injected).toContain("window.updateWind(");
    expect(injected).toContain("window.updateTemp(");
    expect(injected).toContain("window.updateHum(");
    expect(injected).toContain("window.updatePM(");
    expect(injected).toContain("window.updateDengue(");
    expect(injected).toContain("window.updateClinics(");
    expect(injected).toContain('window.showOverlay("wind")');
  });

  it("prop changes inject incremental updates (rainfallPoints example)", () => {
    const { rerender } = render(
      <LeafletMapWebView
        rainfallPoints={[{ lat: 1.3, lon: 103.8, value: 1 }]}
      />
    );
    let inst = lastInstance();
    // Make the page "ready" so effects will fire
    act(() => inst.props.onLoadEnd && inst.props.onLoadEnd());
    inst.api.injectJavaScript.mockClear();

    // Update rainfallPoints -> should call updateRainfall(...) incremental snippet
    rerender(
      <LeafletMapWebView
        rainfallPoints={[{ lat: 1.31, lon: 103.81, value: 3 }]}
      />
    );

    inst = lastInstance();
    expect(inst.api.injectJavaScript).toHaveBeenCalled();
    const injected = inst.api.injectJavaScript.mock.calls[0][0];
    expect(injected).toContain("window.updateRainfall(");
    expect(injected.replace(/\\/g, "")).toContain(
      '[{"lat":1.31,"lon":103.81,"value":3}]'
    );
  });

  it("overlay prop change injects showOverlay with the new kind", () => {
    const { rerender } = render(<LeafletMapWebView overlay="rain" />);
    let inst = lastInstance();
    act(() => inst.props.onLoadEnd && inst.props.onLoadEnd());
    inst.api.injectJavaScript.mockClear();

    rerender(<LeafletMapWebView overlay="pm" />);
    inst = lastInstance();
    act(() => inst.props.onLoadEnd && inst.props.onLoadEnd());
    expect(inst.api.injectJavaScript).toHaveBeenCalled();
    const injected = inst.api.injectJavaScript.mock.calls.at(-1)[0];
    expect(injected).toContain('window.showOverlay("pm")');
  });

  it("imperative API: recenter / set* methods emit expected JS", () => {
    const ref = createRef();
    render(<LeafletMapWebView ref={ref} zoom={11} />);
    const inst = lastInstance();
    act(() => inst.props.onLoadEnd && inst.props.onLoadEnd());
    inst.api.injectJavaScript.mockClear();

    // recenter
    ref.current.recenter(1.35, 103.9, 15);
    expect(inst.api.injectJavaScript).toHaveBeenCalledTimes(1);
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.map.setView([1.35, 103.9], 15)"
    );

    inst.api.injectJavaScript.mockClear();

    // setRainfall
    ref.current.setRainfall([{ lat: 1, lon: 2, value: 5 }]);
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.updateRainfall"
    );
    const inj = inst.api.injectJavaScript.mock.calls[0][0];
    expect(inj).toContain("window.updateRainfall"); // basic guard
    expect(inj.replace(/\\/g, "")).toContain('[{"lat":1,"lon":2,"value":5}]');
    inst.api.injectJavaScript.mockClear();

    // setWind
    ref.current.setWind([{ lat: 3, lon: 4, value: 6 }]);
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.updateWind"
    );

    inst.api.injectJavaScript.mockClear();

    // setTemp
    ref.current.setTemp([{ lat: 5, lon: 6, value: 30 }]);
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.updateTemp"
    );

    inst.api.injectJavaScript.mockClear();

    // setHum
    ref.current.setHum([{ lat: 7, lon: 8, value: 80 }]);
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.updateHum"
    );

    inst.api.injectJavaScript.mockClear();

    // setPM
    ref.current.setPM([{ lat: 9, lon: 10, value: 20 }]);
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.updatePM"
    );

    inst.api.injectJavaScript.mockClear();

    // setDengue
    ref.current.setDengue({ type: "FeatureCollection", features: [] });
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.updateDengue"
    );
    {
      const injected = inst.api.injectJavaScript.mock.calls[0][0];
      const unescaped = injected.replace(/\\/g, "");
      expect(unescaped).toContain('"type":"FeatureCollection"');
    }

    inst.api.injectJavaScript.mockClear();

    // setClinics
    ref.current.setClinics({ type: "FeatureCollection", features: [] });
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      "window.updateClinics"
    );

    inst.api.injectJavaScript.mockClear();

    // setOverlay
    ref.current.setOverlay("dengue");
    expect(inst.api.injectJavaScript.mock.calls[0][0]).toContain(
      'window.showOverlay("dengue")'
    );
  });

  it("passes style and androidLayerType through to WebView container", () => {
    render(<LeafletMapWebView height={240} />);
    const inst = lastInstance();
    expect(inst.props.androidLayerType).toBe("hardware");
    expect(flattenStyle(inst.props.style)).toMatchObject({
      flex: 1,
      backgroundColor: "transparent",
    });
  });
});
