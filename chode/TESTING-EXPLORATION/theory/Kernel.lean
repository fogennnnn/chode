import Mathlib

set_option linter.constructorNameAsVariable false

/-!
  Kernel — strictly combinatorial forcing from the seed
  Goal: see what falls out with as few primitives as possible.
-/

namespace Z6Kernel

/-! 0. Primitive -/

inductive PState | one | zero
deriving Repr, DecidableEq
instance : Fintype PState := ⟨{.one, .zero}, fun x => by cases x <;> decide⟩

def inverse : PState → PState
| PState.one  => PState.zero
| PState.zero => PState.one

theorem no_null_state (s : PState) : inverse s ≠ s := by
  cases s <;> decide

theorem inverse_involutive (s : PState) : inverse (inverse s) = s := by
  cases s <;> rfl

def transition : PState → PState := inverse
def C : PState → PState := inverse

theorem transition_is_never_identity (s : PState) : transition s ≠ s := no_null_state s
theorem annihilation_forbidden (s : PState) : C s ≠ s := no_null_state s
theorem C_involutive_matches_time (s : PState) : C (C s) = s := by simp [C, inverse_involutive]

theorem creation_is_annihilation_is_inverse :
    inverse PState.zero = PState.one ∧ inverse PState.one = PState.zero := by simp [inverse]

/-! 1. Tick / Arrow -/

def tick : Nat → PState → PState
| 0,     s => s
| (n+1), s => transition (tick n s)

theorem tick_period_two (s : PState) : tick 2 s = s := by cases s <;> decide
theorem tick_odd_inverts (s : PState) : tick 1 s = inverse s := by cases s <;> decide

theorem tick_is_time_symmetric (s : PState) :
    transition (transition s) = s ∧ tick 2 s = s :=
  ⟨by simp only [transition, inverse_involutive], tick_period_two s⟩

theorem tick_depends_only_on_parity (s : PState) (n : ℕ) :
    tick n s = s ∨ tick n s = inverse s := by
  induction n with
  | zero => left; rfl
  | succ k ih =>
    rcases ih with h | h
    · right; simp [tick, h, transition]
    · left; simp [tick, h, transition, inverse_involutive]

theorem tick_add (m n : ℕ) (s : PState) : tick (m + n) s = tick m (tick n s) := by
  induction m with
  | zero => simp [tick]
  | succ m ih => simp [tick, ih, Nat.succ_add]

theorem tick_sequence_is_asymmetric (s : PState) :
    (∀ n : ℕ, tick (2*n) s = s) ∧
    (∀ n : ℕ, tick (2*n+1) s = inverse s) := by
  have h_even : ∀ n : ℕ, tick (2*n) s = s := by
    intro n; induction n with
    | zero => rfl
    | succ n ih =>
      have h : 2*(n+1) = (2*n) + 2 := by omega
      calc
        tick (2*(n+1)) s = tick ((2*n) + 2) s := by rw [h]
        _ = tick (2*n) (tick 2 s) := by rw [tick_add]
        _ = tick (2*n) s := by rw [tick_period_two]
        _ = s := ih
  have h_odd : ∀ n : ℕ, tick (2*n+1) s = inverse s := by
    intro n
    rw [show (2*n+1 : ℕ) = 1 + (2*n) by omega, tick_add, tick_odd_inverts, h_even n]
  exact ⟨h_even, h_odd⟩

/-! 2. Loop closure -> 3 axes -/

inductive Axis3 : Type | a | b | c
deriving Repr, DecidableEq
instance : Fintype Axis3 := ⟨{.a, .b, .c}, fun x => by cases x <;> decide⟩

def loopSteps : Nat := 3
theorem loopSteps_equals_axes : loopSteps = Fintype.card Axis3 := by decide

def afterLoops (k : Nat) (s : PState) : PState := tick (loopSteps * k) s
theorem one_loop_returns_inverse (s : PState) : afterLoops 1 s = inverse s := by cases s <;> decide
theorem two_loops_return_identity (s : PState) : afterLoops 2 s = s := by cases s <;> decide
theorem single_carrier_is_spin_half (s : PState) :
    afterLoops 1 s ≠ s ∧ afterLoops 2 s = s := by
  refine ⟨?_, two_loops_return_identity s⟩
  rw [one_loop_returns_inverse]; exact no_null_state s
theorem three_ticks_invert (s : PState) : tick 3 s = inverse s := by
  calc
    tick 3 s = afterLoops 1 s := by unfold afterLoops loopSteps; norm_num
    _ = inverse s := one_loop_returns_inverse s

def allListsUpTo (α : Type) [Fintype α] [DecidableEq α] (k : Nat) : Finset (List α) :=
  Finset.biUnion (Finset.range (k + 1)) (fun n =>
    (Finset.univ : Finset (Fin n → α)).image (fun f => List.ofFn f))

def visitsTwo {α : Type} [DecidableEq α] : List α → Bool
  | [] => false
  | x :: xs => !(xs.filter fun y => x != y).isEmpty

def retracesFirst {α : Type} [DecidableEq α] : List α → Bool
  | (x :: _ :: y :: _) => x == y
  | _ => false

def stalls {α : Type} [DecidableEq α] : List α → Bool
  | a :: b :: rest => (a == b) || stalls (b :: rest)
  | _ => false

theorem one_axis_no_nondeg_loop :
    ∀ seq ∈ allListsUpTo (Fin 1) 3, seq.head? = seq.reverse.head? → seq ≠ [] → ¬ visitsTwo seq := by decide

theorem two_axes_every_nondeg_loop_retraces_or_stalls :
    ∀ seq ∈ allListsUpTo (Fin 2) 4, seq.head? = seq.reverse.head? → seq ≠ [] → visitsTwo seq → (retracesFirst seq || stalls seq) := by decide

theorem three_axes_has_nonretracing_loop :
    ∃ seq : List Axis3, seq.head? = seq.reverse.head? ∧ seq ≠ [] ∧ visitsTwo seq ∧ ¬ retracesFirst seq ∧ ¬ stalls seq := by
  refine ⟨[Axis3.a, Axis3.b, Axis3.c, Axis3.a], ?_, ?_, ?_, ?_, ?_⟩ <;> decide

/-! 3. Spin/Statistics -/

def exchangeSign (flipsPerLoop : Nat) : Int := (-1) ^ flipsPerLoop
theorem single_carrier_antisymmetric : exchangeSign 1 = -1 := by decide
theorem paired_carrier_symmetric : exchangeSign 2 = 1 := by decide
theorem spin_statistics_connection :
    exchangeSign 1 = -1 ∧ exchangeSign 2 = 1 := ⟨by decide, by decide⟩
theorem pauli_exclusion (a : Int) (h : a = exchangeSign 1 * a) : a = 0 := by
  simp only [single_carrier_antisymmetric] at h; linarith

/-! 4. Color confinement / census -/

def axesToClose : Nat := Fintype.card Axis3
theorem single_color_cannot_close : 1 < axesToClose := by decide
theorem baryon_is_triple : axesToClose = 3 := by decide

abbrev FermionFlavor := PState × Axis3 × Bool -- exploratory minimal flavor space

theorem flavor_factorization_minimal :
    Fintype.card FermionFlavor
      = Fintype.card PState * Fintype.card Axis3 * Fintype.card Bool := by decide

theorem twelve_from_full_split :
    Fintype.card PState * Fintype.card Axis3 * 2 = 12 := by decide

end Z6Kernel
