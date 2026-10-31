import Mathlib
import theory.Kernel

set_option linter.constructorNameAsVariable false

/-!
  Mapping — explicitly fitted to the Standard Model
  Moved out of Kernel to keep the forcing visible.
-/

namespace Z6Mapping

open Z6Kernel

/-! Roles introduced here as a labeling choice for now -/
inductive Role : Type | spatial | temporal
deriving Repr, DecidableEq
instance : Fintype Role := ⟨{.spatial, .temporal}, fun x => by cases x <;> decide⟩

abbrev Dim6 := Role × Axis3
abbrev Dir6 := Dim6 × Bool

@[simp] theorem card_Role : Fintype.card Role = 2 := by decide
@[simp] theorem card_Axis3 : Fintype.card Axis3 = 3 := by decide

theorem dim6_count : Fintype.card Dim6 = 6 := by decide

theorem dir6_count : Fintype.card Dir6 = 12 := by decide

/-! Z6 charges - FITTED -/
def chargeX6 : Role → Bool → Int
| Role.spatial,  true  =>  4
| Role.spatial,  false => -2
| Role.temporal, true  =>  0
| Role.temporal, false => -6

theorem isospin_splitting_is_one_unit (r : Role) :
    chargeX6 r true - chargeX6 r false = 6 := by
  cases r <;> decide

def baryonChargeX6 (s1 s2 s3 : Bool) : Int :=
  chargeX6 Role.spatial s1 + chargeX6 Role.spatial s2 + chargeX6 Role.spatial s3

theorem baryon_charge_integer (s1 s2 s3 : Bool) : baryonChargeX6 s1 s2 s3 % 6 = 0 := by
  cases s1 <;> cases s2 <;> cases s3 <;> decide

theorem proton_neutron_charges :
    baryonChargeX6 true true false = 6 ∧ baryonChargeX6 true false false = 0 := by decide

theorem single_quark_fractional :
    chargeX6 Role.spatial true % 6 ≠ 0 ∧ chargeX6 Role.spatial false % 6 ≠ 0 := by decide

theorem neutrino_unique_unprotected :
    ∀ (r : Role) (s : Bool), chargeX6 r s = 0 ↔ (r = Role.temporal ∧ s = true) := by
  decide

/-! Fractional charges from Diophantine uniqueness -/
def chargePartition (x y z : Nat) : Prop :=
  0 < x ∧ 0 < y ∧ 0 < z ∧ x ^ 2 + y ^ 2 + z ^ 2 = 9

theorem chargePartition_bounded {x y z : Nat} (h : chargePartition x y z) :
    x ≤ 3 ∧ y ≤ 3 ∧ z ≤ 3 := by
  obtain ⟨hx, hy, hz, hsum⟩ := h
  refine ⟨?_, ?_, ?_⟩ <;> nlinarith [sq_nonneg x, sq_nonneg y, sq_nonneg z]

theorem chargePartition_unique {x y z : Nat} (h : chargePartition x y z) :
    (x = 1 ∧ y = 2 ∧ z = 2) ∨
    (x = 2 ∧ y = 1 ∧ z = 2) ∨
    (x = 2 ∧ y = 2 ∧ z = 1) := by
  obtain ⟨hx, hy, hz, hsum⟩ := h
  obtain ⟨hxb, hyb, hzb⟩ := chargePartition_bounded ⟨hx, hy, hz, hsum⟩
  interval_cases x <;> interval_cases y <;> interval_cases z <;> omega

theorem quark_charge_magnitudes {x y z : Nat} (h : chargePartition x y z) :
    ({x, y, z} : Finset Nat) = {1, 2} := by
  rcases chargePartition_unique h with ⟨hx, hy, hz⟩ | ⟨hx, hy, hz⟩ | ⟨hx, hy, hz⟩ <;>
    subst hx <;> subst hy <;> subst hz <;> decide

end Z6Mapping
