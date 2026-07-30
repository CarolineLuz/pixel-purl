import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { HelpStar } from "./HelpStar";

const openHelp = () =>
  fireEvent.click(screen.getByRole("button", { name: /how does this work/i }));

describe("HelpStar", () => {
  it("renders the trigger with the modal closed", () => {
    render(<HelpStar />);
    expect(screen.getByRole("button", { name: /how does this work/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the help modal when the star is clicked", () => {
    render(<HelpStar />);
    openHelp();
    expect(screen.getByRole("dialog", { name: /how the pattern maker works/i })).toBeInTheDocument();
  });

  it("closes on the × button", () => {
    render(<HelpStar />);
    openHelp();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the backdrop is clicked", () => {
    render(<HelpStar />);
    openHelp();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<HelpStar />);
    openHelp();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays open when the content card is clicked", () => {
    render(<HelpStar />);
    openHelp();
    fireEvent.click(screen.getByRole("heading", { name: /how the pattern maker works/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
