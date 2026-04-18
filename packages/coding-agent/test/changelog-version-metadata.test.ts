import { describe, expect, test } from "vitest";
import { type ChangelogEntry, getNewEntries } from "../src/utils/changelog.js";

const entry = (major: number, minor: number, patch: number): ChangelogEntry => ({
	major,
	minor,
	patch,
	content: `## [${major}.${minor}.${patch}]`,
});

describe("getNewEntries", () => {
	const entries: ChangelogEntry[] = [entry(0, 67, 67), entry(0, 67, 68), entry(0, 68, 0)];

	test("returns only entries newer than lastVersion", () => {
		const result = getNewEntries(entries, "0.67.67");
		expect(result.map((e) => `${e.major}.${e.minor}.${e.patch}`)).toEqual(["0.67.68", "0.68.0"]);
	});

	test("returns nothing when lastVersion matches the newest entry", () => {
		expect(getNewEntries(entries, "0.68.0")).toEqual([]);
	});

	test("strips semver build metadata before comparing (fork builds)", () => {
		// Regression: "0.67.68+gswangg.1" previously parsed to patch=NaN -> 0,
		// making every entry newer than 0.67.0 look "new" on every startup.
		expect(getNewEntries(entries, "0.67.68+gswangg.1")).toEqual([entry(0, 68, 0)]);
		expect(getNewEntries(entries, "0.68.0+gswangg.1")).toEqual([]);
		expect(getNewEntries(entries, "0.67.67+gswangg.3")).toEqual([entry(0, 67, 68), entry(0, 68, 0)]);
	});
});
