import type { Model, Netlist, NetlistElement, Params } from "../../../packages/core/types";

// A DC resistive network: one ideal voltage source (node A is +, node B is −),
// linear resistors and ideal wires between numbered nodes. The solver is a pure
// function of the netlist; the netlist itself is a parameter, never model state.
//
// Method: nodal analysis (resistive MNA). Wires are merged into one electrical
// node each (union–find), node 0 is the reference (ground) unless it carries no
// element at all, in which case the source's − terminal grounds the network.
// One KCL equation is written per non-reference node, and the single ideal
// source contributes its current as one extra unknown with the constraint
// V(A) − V(B) = E. Gaussian elimination with partial pivoting solves the small
// dense system (≤ maxNodes unknowns).
//
// Sign conventions used everywhere below:
//   * resistor: U = V(a) − V(b), I = U/R, positive from a to b.
//   * source:   U = V(a) − V(b) = E, I is the current from a to b INSIDE the
//               source, so a delivering source has I < 0.
//   * power:    P = U·I is the power ABSORBED by the element, so the source
//               delivers with P < 0 and Σ P = 0 over all elements (power
//               balance, a consequence of KCL and KVL).
//
// Degenerate topologies return a typed failure instead of NaN or an exception:
//   * "not-one-source"  – the protocol requires exactly one source; the solver
//                         re-checks it defensively.
//   * "shorted-source"  – a wire path joins the source's + and − terminals.
//   * "floating-node"   – a sub-network (with elements, but no source) is cut
//                         off from the reference node; its voltages are not
//                         determined by the rest of the circuit.
//   * "no-loop"         – the source itself is not connected to the reference
//                         node's network, so no closed loop exists.
//   * "singular"        – the matrix is singular for any other reason.

export type SolveErrorCode =
  | "not-one-source"
  | "shorted-source"
  | "floating-node"
  | "no-loop"
  | "singular";

export interface ElementSolution {
  id: string;
  kind: NetlistElement["kind"];
  a: number;
  b: number;
  value: number;
  /** Terminal voltage U = V(a) − V(b), V. */
  voltage: number;
  /** Current from a to b through the element, A. */
  current: number;
  /** Absorbed power P = U·I, W (negative while delivering). */
  power: number;
}

export interface CircuitSolution {
  status: "ok";
  /** Voltage of each node, V. Nodes without any element read 0 (unused). */
  nodeVoltages: number[];
  elements: ElementSolution[];
  /** Σ P over all elements; ≈ 0 by power balance. */
  totalPower: number;
}

export interface CircuitFailure {
  status: "error";
  code: SolveErrorCode;
  /** The node the message should name, when the code carries one. */
  node?: number;
}

export type SolveResult = CircuitSolution | CircuitFailure;

/**
 * Wire-only union–find: the representative of every node after all wires are
 * merged. Exposed so the view can refuse a wire between two nodes that are
 * already joined by a wire path (a redundant or cyclic wire).
 */
export function wireRoots(elements: NetlistElement[], nodeCount: number): number[] {
  const parent = Array.from({ length: nodeCount }, (_, i) => i);
  const find = (n: number): number => {
    let root = n;
    while (parent[root] !== root) root = parent[root];
    while (parent[n] !== root) {
      const next = parent[n];
      parent[n] = root;
      n = next;
    }
    return root;
  };
  for (const element of elements)
    if (element.kind === "wire") {
      const ra = find(element.a),
        rb = find(element.b);
      if (ra !== rb) parent[ra] = rb;
    }
  return parent.map(find);
}

/** Dense solve A·x = b with partial pivoting; null when singular. */
function solveLinear(matrix: number[][], rhs: number[]): number[] | null {
  const n = rhs.length;
  const a = matrix.map((row) => [...row]);
  const b = [...rhs];
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    if (pivot !== col) {
      [a[pivot], a[col]] = [a[col], a[pivot]];
      [b[pivot], b[col]] = [b[col], b[pivot]];
    }
    for (let row = col + 1; row < n; row++) {
      const factor = a[row][col] / a[col][col];
      if (factor === 0) continue;
      a[row][col] = 0;
      for (let c = col + 1; c < n; c++) a[row][c] -= factor * a[col][c];
      b[row] -= factor * b[col];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = b[row];
    for (let c = row + 1; c < n; c++) sum -= a[row][c] * x[c];
    x[row] = sum / a[row][row];
  }
  return x.every(Number.isFinite) ? x : null;
}

export function solveCircuit(netlist: Netlist): SolveResult {
  const elements = netlist.elements;
  const sources = elements.filter((e) => e.kind === "source");
  if (sources.length !== 1) return { status: "error", code: "not-one-source" };
  const source = sources[0];

  const nodeCount =
    elements.reduce((max, e) => Math.max(max, e.a, e.b), 0) + 1;
  const touched = new Set<number>();
  for (const e of elements) {
    touched.add(e.a);
    touched.add(e.b);
  }
  const roots = wireRoots(elements, nodeCount);

  // A wire path across the source's terminals is an inconsistent circuit.
  if (roots[source.a] === roots[source.b])
    return { status: "error", code: "shorted-source" };

  // The reference is node 0's set; if node 0 carries no element, the source's
  // − terminal grounds the network instead.
  const reference = touched.has(0) ? roots[0] : roots[source.b];

  // Components over the non-wire elements, computed on merged sets.
  const setParent = new Map<number, number>();
  const setFind = (s: number): number => {
    let root = s;
    while (setParent.get(root) !== root) root = setParent.get(root)!;
    while (setParent.get(s) !== root) {
      const next = setParent.get(s)!;
      setParent.set(s, root);
      s = next;
    }
    return root;
  };
  for (const n of touched) setParent.set(roots[n], roots[n]);
  const setUnion = (x: number, y: number) => {
    const rx = setFind(x),
      ry = setFind(y);
    if (rx !== ry) setParent.set(rx, ry);
  };
  for (const e of elements)
    if (e.kind !== "wire") setUnion(roots[e.a], roots[e.b]);
  const sourceSet = roots[source.a];
  const sourceComponent = setFind(sourceSet);
  if (sourceComponent !== setFind(reference)) {
    const named = [...touched]
      .sort((x, y) => x - y)
      .find((n) => setFind(roots[n]) === sourceComponent);
    return { status: "error", code: "no-loop", node: named };
  }
  for (const n of [...touched].sort((x, y) => x - y))
    if (setFind(roots[n]) !== setFind(reference))
      return { status: "error", code: "floating-node", node: n };

  // Nodal analysis: one voltage unknown per non-reference set plus the source
  // current as the last unknown.
  const index = new Map<number, number>();
  for (const s of setParent.keys()) if (s !== reference) index.set(s, index.size);
  const size = index.size + 1,
    sourceCol = index.size;
  const matrix = Array.from({ length: size }, () =>
    new Array<number>(size).fill(0),
  );
  const rhs = new Array<number>(size).fill(0);
  const addConductance = (p: number, q: number, g: number) => {
    if (p !== reference) matrix[index.get(p)!][index.get(p)!] += g;
    if (q !== reference) matrix[index.get(q)!][index.get(q)!] += g;
    if (p !== reference && q !== reference) {
      matrix[index.get(p)!][index.get(q)!] -= g;
      matrix[index.get(q)!][index.get(p)!] -= g;
    }
  };
  for (const e of elements)
    if (e.kind === "resistor")
      addConductance(roots[e.a], roots[e.b], 1 / e.value);
  const pa = roots[source.a],
    pb = roots[source.b];
  // KCL rows gain the source current; the constraint row fixes V(a) − V(b) = E.
  if (pa !== reference) matrix[index.get(pa)!][sourceCol] += 1;
  if (pb !== reference) matrix[index.get(pb)!][sourceCol] -= 1;
  if (pa !== reference) matrix[sourceCol][index.get(pa)!] += 1;
  if (pb !== reference) matrix[sourceCol][index.get(pb)!] -= 1;
  rhs[sourceCol] = source.value;

  const solution = solveLinear(matrix, rhs);
  if (!solution) return { status: "error", code: "singular" };

  const setVoltage = (s: number) => (s === reference ? 0 : solution[index.get(s)!]);
  const sourceCurrent = solution[sourceCol];
  const nodeVoltages = new Array<number>(nodeCount).fill(0);
  for (let n = 0; n < nodeCount; n++) nodeVoltages[n] = setVoltage(roots[n]);

  // Branch quantities. Wire currents are fixed by KCL at each original node;
  // within one merged set the wire subgraph is a forest, so the split is unique.
  const leaving = new Array<number>(nodeCount).fill(0);
  const results: ElementSolution[] = [];
  for (const e of elements) {
    if (e.kind === "resistor") {
      const u = nodeVoltages[e.a] - nodeVoltages[e.b];
      const i = u / e.value;
      leaving[e.a] += i;
      leaving[e.b] -= i;
      results.push({
        id: e.id,
        kind: e.kind,
        a: e.a,
        b: e.b,
        value: e.value,
        voltage: u,
        current: i,
        power: u * i,
      });
    } else if (e.kind === "source") {
      const u = nodeVoltages[e.a] - nodeVoltages[e.b];
      leaving[e.a] += sourceCurrent;
      leaving[e.b] -= sourceCurrent;
      results.push({
        id: e.id,
        kind: e.kind,
        a: e.a,
        b: e.b,
        value: e.value,
        voltage: u,
        current: sourceCurrent,
        power: u * sourceCurrent,
      });
    }
  }
  // Injection each node still needs from its wires: c_n = −(current already
  // leaving through non-wire elements).
  const injection = leaving.map((v) => -v);

  const wires = elements.filter((e) => e.kind === "wire");
  const wireCurrent = new Map<string, number>();
  const bySet = new Map<number, NetlistElement[]>();
  for (const w of wires) {
    const key = roots[w.a];
    const list = bySet.get(key);
    if (list) list.push(w);
    else bySet.set(key, [w]);
  }
  for (const list of bySet.values()) {
    const nodes = [...new Set(list.flatMap((w) => [w.a, w.b]))].sort(
      (x, y) => x - y,
    );
    const adjacency = new Map<number, NetlistElement[]>();
    for (const n of nodes) adjacency.set(n, []);
    for (const w of list) {
      adjacency.get(w.a)!.push(w);
      if (w.b !== w.a) adjacency.get(w.b)!.push(w);
    }
    // Spanning forest; tree edge currents are exact, the remaining balance is
    // distributed over any extra wires (the workbench never creates them).
    const parent = new Map<number, { from: number; wire: NetlistElement }>();
    const order: number[] = [];
    const queue = [nodes[0]];
    const seen = new Set<number>([nodes[0]]);
    while (queue.length) {
      const n = queue.shift()!;
      order.push(n);
      for (const w of adjacency.get(n)!) {
        const other = w.a === n ? w.b : w.a;
        if (other === n || seen.has(other)) continue;
        seen.add(other);
        parent.set(other, { from: n, wire: w });
        queue.push(other);
      }
    }
    const subtree = new Map<number, number>();
    const children = new Map<number, number[]>();
    for (const n of nodes) children.set(n, []);
    for (const [child, edge] of parent) children.get(edge.from)!.push(child);
    for (let i = order.length - 1; i >= 0; i--) {
      const n = order[i];
      let t = injection[n];
      for (const child of children.get(n)!) t += subtree.get(child)!;
      subtree.set(n, t);
    }
    const remaining = new Map<number, number>();
    for (const n of nodes) remaining.set(n, injection[n]);
    for (const [child, edge] of parent) {
      const i = subtree.get(child)!; // current from child to edge.from
      const wire = edge.wire;
      const current = wire.a === edge.from ? -i : i;
      wireCurrent.set(wire.id, current);
      remaining.set(wire.a, remaining.get(wire.a)! - current);
      remaining.set(wire.b, remaining.get(wire.b)! + current);
    }
    for (const w of list) {
      if (wireCurrent.has(w.id)) continue;
      const i = remaining.get(w.a)!;
      wireCurrent.set(w.id, i);
      remaining.set(w.a, remaining.get(w.a)! - i);
      remaining.set(w.b, remaining.get(w.b)! + i);
    }
  }

  // Assemble the results in element order.
  let totalPower = 0;
  const ordered: ElementSolution[] = elements.map((e) => {
    if (e.kind === "wire") {
      const i = wireCurrent.get(e.id) ?? 0;
      return {
        id: e.id,
        kind: e.kind,
        a: e.a,
        b: e.b,
        value: 0,
        voltage: 0,
        current: i,
        power: 0,
      };
    }
    const found = results.find((r) => r.id === e.id)!;
    return found;
  });
  for (const r of ordered) totalPower += r.power;

  return { status: "ok", nodeVoltages, elements: ordered, totalPower };
}

// A DC network does not evolve: the internal state is a single bounded number
// that never changes, and the solution is recomputed from the netlist.
export const model: Model = {
  initial: () => ({ value: 0 }),
  step: (state: Params) => ({ value: state.value }),
};
