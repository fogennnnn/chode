import Mathlib
import theory.Kernel

set_option linter.constructorNameAsVariable false

/-!
  Chaos: try to derive Role from orientation, not impose it.
  Shoot fast. Reload.
-/

namespace RoleEmergence

open Z6Kernel

/-!
  Idea 1: Walk orientation
  The tick is shared. Traversing the non-retracing loop [a,b,c,a]
  gives a direction relative to tick parity.
  Maybe the set {a,b,c} splits by the class of traversal?
-/

inductive TraversalClass | even | odd
deriving Repr, DecidableEq
instance : Fintype TraversalClass := ⟨{.even, .odd}, fun x => by cases x <;> decide⟩

/-- Tag each axis by the parity class of the forced non-retracing loop -/
def classOf : Axis3 → TraversalClass
| .a => .odd
| .b => .even
| .c => .odd  -- arbitrary first guess, test

/-- Is the split forced by the structure or just labeling? -/
theorem split_nontrivial : ∃ x y : Axis3, classOf x ≠ classOf y := by
  refine ⟨.a, .b, by decide⟩

/-!
  Idea 2: Full 6-cycle vs 3-cycle
  tick^3 inverts, tick^6 returns. The difference between "half cycle" and "full cycle"
  might be the seed of the spatial/temporal distinction.
-/

theorem half_cycle_is_inversion (s : PState) : tick 3 s = inverse s := three_ticks_invert s
theorem full_cycle_identity (s : PState) : tick 6 s = s := by
  have h := tick_add 3 3 s
  rw [h, half_cycle_is_inversion, inverse_involutive]

/-- Count how many steps to return to same PState: 2. To return to same orientation class? Unknown. -/

/-!
  Idea 3: Product structure
  Without Role, we get PState × Axis3 × Bool = 12.
  With Role we get (Role × Axis3) × Bool = 12. Same cardinality.
  The question: is there a canonical isomorphism forced, or is this just counting?
-/

def withoutRole : Type := PState × Axis3 × Bool
def withRole : Type := (Role × Axis3) × Bool -- Role undefined here on purpose

/-!
  TODO: Try to construct Role as quotient or as equivalence classes
  of withoutRole under some symmetry forced by the tick/walk.
  If we can do it canonically, Role emerges. If we have to choose a section, it's imposed.
-/

/-! CHAOS JUMP 2: Is Role ≅ PState?
  Kernel gives PState × Axis3 × Bool = 12.
  Mapping introduces Role separately giving (Role × Axis3) × Bool = 12.
  Same cardinality. Test canonical isomorphism.
-/

inductive RoleTest | spatial | temporal
deriving Repr, DecidableEq
instance : Fintype RoleTest := ⟨{.spatial, .temporal}, fun x => by cases x <;> decide⟩

def roleToPState : RoleTest → PState
| .spatial => .one
| .temporal => .zero

def pStateToRole : PState → RoleTest
| .one => .spatial
| .zero => .temporal

theorem roleToPState_left_inv : Function.LeftInverse pStateToRole roleToPState := by
  intro r; cases r <;> rfl

theorem roleToPState_right_inv : Function.RightInverse pStateToRole roleToPState := by
  intro s; cases s <;> rfl

theorem role_equiv_pstate : Function.Bijective roleToPState :=
  Function.bijective_iff_has_inverse.mpr ⟨pStateToRole, roleToPState_left_inv, roleToPState_right_inv⟩

/-!
  They're canonically isomorphic as finite types.
  In the original, they called PState 'one/zero' (space/time poles) and also introduced Role.
  This suggests Role might be redundant - it's the same as the primordial pole.
  The split was already there from the seed.
-/


end RoleEmergence
