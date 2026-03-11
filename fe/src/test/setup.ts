import "@testing-library/jest-dom/vitest";

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: TestResizeObserver,
    configurable: true,
    writable: true,
  });
}
