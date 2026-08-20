"use client";

import { Joint } from "@kimono/ui";
import { useState } from "react";

/**
 * The run switch. A half-lap joint rather than a dovetail: turning an app off
 * again is expected, and the profile is a promise about how reversible the
 * setting is. The real value still posts as a checkbox so the server action is
 * unchanged.
 */
export function RunJoint({ defaultChecked, name = "enabled", label = "Run this application" }: {
  defaultChecked: boolean;
  name?: string;
  label?: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  return <>
    <input type="hidden" name={name} value={on ? "on" : ""} />
    <Joint checked={on} onChange={setOn} profile="aikaki" label={label} />
  </>;
}
