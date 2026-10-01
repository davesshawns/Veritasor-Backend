import { describe, it, expect } from "vitest";
import {
  hash,
  buildTree,
  getRoot,
  MERKLE_MAX_LEAVES,
  MERKLE_WARN_LEAVES,
} from "./index.js";
import {
  generateProof,
  verifyProof,
  normalizeHashHex,
  isHashHex,
  isProofStep,
  isProof,
  MERKLE_PROOF_MAX_STEPS,
} from "./index.js";
import type { ProofStep, Proof } from "./index.js";

describe("merkle index exports", () => {
  it("exports hash from buildTree", () => {
    const result = hash("test");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("exports buildTree from buildTree", () => {
    const tree = buildTree(["a", "b"]);
    expect(tree).toHaveLength(3);
    expect(tree[tree.length - 1]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("exports getRoot from buildTree", () => {
    const tree = buildTree(["x", "y"]);
    expect(getRoot(tree)).toBe(tree[tree.length - 1]);
    expect(getRoot([])).toBe("");
  });

  it("exports MERKLE_MAX_LEAVES", () => {
    expect(MERKLE_MAX_LEAVES).toBeGreaterThan(0);
  });

  it("exports MERKLE_WARN_LEAVES", () => {
    expect(MERKLE_WARN_LEAVES).toBeGreaterThan(0);
  });
});

describe("merkle proof exports", () => {
  const leaves = ["a", "b", "c", "d"];

  it("exports generateProof", () => {
    const tree = buildTree(leaves);
    const root = getRoot(tree, leaves.length);
    const proof = generateProof(leaves, 0);
    expect(verifyProof(leaves[0], proof, root)).toBe(true);
  });

  it("exports verifyProof with valid proof", () => {
    const tree = buildTree(leaves);
    const root = getRoot(tree, leaves.length);
    const proof = generateProof(leaves, 0);
    expect(verifyProof(leaves[0], proof, root)).toBe(true);
  });

  it("exports normalizeHashHex", () => {
    expect(normalizeHashHex("0x" + "a".repeat(64))).toBe("a".repeat(64));
    expect(normalizeHashHex("A".repeat(64))).toBe("a".repeat(64));
    expect(normalizeHashHex("invalid")).toBeNull();
    expect(normalizeHashHex("")).toBeNull();
  });

  it("exports isHashHex", () => {
    expect(isHashHex("a".repeat(64))).toBe(true);
    expect(isHashHex("0x" + "a".repeat(64))).toBe(true);
    expect(isHashHex("invalid")).toBe(false);
    expect(isHashHex(123)).toBe(false);
  });

  it("exports isProofStep", () => {
    const validStep: ProofStep = { sibling: "a".repeat(64), position: "left" };
    expect(isProofStep(validStep)).toBe(true);
    expect(isProofStep({} as any)).toBe(false);
    expect(isProofStep({ position: "left" } as any)).toBe(false);
  });

  it("exports isProof", () => {
    const validProof: Proof = [{ sibling: "a".repeat(64), position: "left" }];
    expect(isProof(validProof)).toBe(true);
    expect(isProof([{ position: "left" } as any])).toBe(false);
    expect(isProof(["not-a-proof"] as any)).toBe(false);
  });

  it("exports MERKLE_PROOF_MAX_STEPS", () => {
    expect(MERKLE_PROOF_MAX_STEPS).toBe(256);
  });
});

describe("merkle types", () => {
  it("ProofStep has correct shape", () => {
    const step: ProofStep = { sibling: "a".repeat(64), position: "left" };
    expect(step).toHaveProperty("sibling");
    expect(step).toHaveProperty("position");
    expect(typeof step.position).toBe("string");
  });

  it("Proof is an array of ProofStep", () => {
    const proof: Proof = [{ sibling: "a".repeat(64), position: "left" }];
    expect(Array.isArray(proof)).toBe(true);
    expect(isProof(proof)).toBe(true);
  });
});

describe("merkle failure cases", () => {
  it("hash throws on non-string input", () => {
    // @ts-expect-error intentional invalid input
    expect(() => hash(123)).toThrow();
  });

  it("buildTree throws RangeError for empty array", () => {
    expect(() => buildTree([])).toThrow(RangeError);
  });

  it("buildTree throws TypeError for empty string leaf", () => {
    expect(() => buildTree(["a", ""])).toThrow(TypeError);
  });

  it("buildTree throws TypeError for number leaf", () => {
    expect(() => buildTree([42])).toThrow(TypeError);
  });

  it("generateProof throws on empty leaves", () => {
    expect(() => generateProof([], 0)).toThrow();
  });

  it("generateProof throws on out-of-range leafIndex", () => {
    expect(() => generateProof(["a"], 5)).toThrow();
  });

  it("generateProof throws on non-integer leafIndex", () => {
    expect(() => generateProof(["a"], 1.5)).toThrow();
  });

  it("verifyProof returns false for invalid leaf type", () => {
    expect(verifyProof(123 as any, [{ sibling: "a".repeat(64), position: "left" }] as any, "root")).toBe(
      false
    );
  });

  it("verifyProof returns false for invalid proof", () => {
    expect(verifyProof("leaf" as any, [{} as any] as any, "root")).toBe(false);
  });

  it("normalizeHashHex returns null for non-string", () => {
    expect(normalizeHashHex(123 as any)).toBeNull();
  });

  it("isProofStep returns false for missing sibling", () => {
    expect(isProofStep({ position: "left" } as any)).toBe(false);
  });

  it("isProofStep returns false for missing position", () => {
    expect(isProofStep({ sibling: "a".repeat(64) } as any)).toBe(false);
  });
});