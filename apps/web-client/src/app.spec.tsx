import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./app";

/**
 * TODO We need to configure Jest in case we want to run unit tests.
 * The pain point right now is dealing with the
 * > > > TypeError: clone is not a function
 * issue which traces back to the `graceful-fs` transient dependency.
 */
test.skip("renders learn react link", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  const linkElement = screen.getByText(/True Impact/i);

  expect(linkElement).toBeInTheDocument();
});
