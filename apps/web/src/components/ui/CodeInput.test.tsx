import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeInput } from "./CodeInput";

describe("CodeInput", () => {
  it("숫자만 남기고 6자리로 자른다", () => {
    const onChange = vi.fn();
    render(<CodeInput label="인증코드" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("인증코드"), { target: { value: "12a-34 5678" } });

    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("오류를 aria-describedby로 연결한다", () => {
    render(<CodeInput label="인증코드" value="" onChange={() => {}} error="코드가 올바르지 않아요" />);
    const input = screen.getByLabelText("인증코드");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("코드가 올바르지 않아요");
  });
});
