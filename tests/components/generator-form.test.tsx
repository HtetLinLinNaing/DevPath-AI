import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GeneratorForm } from "@/features/generator/GeneratorForm";
import { createInitialRequest, type RoadmapDraft } from "@/features/generator/generator-machine";

function Harness({ onSubmit = vi.fn(), submitting = false, onCancel = vi.fn() }) {
  const [input, setInput] = useState<RoadmapDraft>(createInitialRequest());
  return (
    <GeneratorForm
      input={input}
      submitting={submitting}
      onChange={setInput}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

describe("GeneratorForm", () => {
  it("renders the complete labeled profile workflow", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Job description")).toBeInTheDocument();
    expect(screen.getByLabelText("Target role")).toBeInTheDocument();
    expect(screen.getByLabelText("Current role or status")).toBeInTheDocument();
    expect(screen.getByLabelText("Years of relevant experience")).toBeInTheDocument();
    expect(screen.getByLabelText("Weekly study time")).toBeInTheDocument();
    expect(screen.getByLabelText("Target application date")).toBeInTheDocument();
    expect(screen.getByLabelText("Learning budget")).toBeInTheDocument();
    expect(screen.getByLabelText("Education (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Additional constraints (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText(/I consent to sending this information/i)).toBeInTheDocument();
  });

  it("adds and removes skill rows but keeps at least one", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getAllByLabelText(/Skill \d+ name/)).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Add skill" }));
    expect(screen.getAllByLabelText(/Skill \d+ name/)).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: /Remove skill/ })[0]!);
    expect(screen.getAllByLabelText(/Skill \d+ name/)).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Remove skill/ })).not.toBeInTheDocument();
  });

  it("shows accessible validation and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Generate my roadmap" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please correct the highlighted fields.");
    expect(screen.getByLabelText("Job description")).toHaveFocus();
  });

  it("rejects duplicate skills and missing consent", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Job description"), { target: { value: "Backend engineer role requiring Node.js, Docker, AWS, CI/CD, testing, observability, security, APIs, databases, and communication. ".repeat(3) } });
    await user.type(screen.getByLabelText("Target role"), "Backend Engineer");
    await user.type(screen.getByLabelText("Current role or status"), "Junior Developer");
    await user.type(screen.getByLabelText("Skill 1 name"), "Node.js");
    await user.click(screen.getByRole("button", { name: "Add skill" }));
    await user.type(screen.getByLabelText("Skill 2 name"), " node.JS ");
    await user.click(screen.getByRole("button", { name: "Generate my roadmap" }));
    expect(screen.getByText("Skill names must be unique")).toBeInTheDocument();
    expect(screen.getByText("You must consent before generating a roadmap.")).toBeInTheDocument();
  });

  it("disables duplicate submission and exposes cancellation", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<Harness submitting onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Generating roadmap" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel generation" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
