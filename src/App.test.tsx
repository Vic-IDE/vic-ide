import { render } from "@testing-library/react";

import App from "./App";
import { DummyExtensionBridge } from "./System/ExtensionBridge";

// eslint-disable-next-line jest/expect-expect
test("renders app", () => {
  // See: <https://github.com/jsdom/jsdom/issues/1695>
  Element.prototype.scrollIntoView = jest.fn();

  render(<App extensionBridge={new DummyExtensionBridge()} />);
});
