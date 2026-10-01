use soroban_sdk::Env;
use fees_contract::DynamicFees;
use fees_contract::DynamicFeesError;

#[test]
fn test_get_business_count_returns_zero_for_new_contract() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    let count = contract.get_business_count();
    assert_eq!(count, 0);
}

#[test]
fn test_get_business_count_increments_when_business_added() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    contract.add_business(1, "Acme Corp".to_string(), 100);
    let count = contract.get_business_count();
    assert_eq!(count, 1);
}

#[test]
fn test_get_business_count_multiple_additions() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    contract.add_business(1, "Acme Corp".to_string(), 100);
    contract.add_business(2, "Beta Inc".to_string(), 200);
    contract.add_business(3, "Gamma LLC".to_string(), 300);
    let count = contract.get_business_count();
    assert_eq!(count, 3);
}

#[test]
fn test_get_business_count_after_removal() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    contract.add_business(1, "Acme Corp".to_string(), 100);
    contract.add_business(2, "Beta Inc".to_string(), 200);
    assert_eq!(contract.get_business_count(), 2);

    contract.remove_business(&1);
    let count = contract.get_business_count();
    assert_eq!(count, 1);
}

#[test]
fn test_get_business_count_removes_nonexistent_returns_error() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    contract.add_business(1, "Acme Corp".to_string(), 100);

    let result = contract.remove_business(&999);
    assert!(matches!(result, Err(DynamicFeesError::BusinessNotFound)));
    // Count should be preserved after failed removal
    assert_eq!(contract.get_business_count(), 1);
}

#[test]
fn test_get_business_count_boundary_zero() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    // Already zero, test that it stays zero
    assert_eq!(contract.get_business_count(), 0);
}

#[test]
fn test_get_business_count_large_number() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    // Add many businesses to test boundary
    for i in 0..100 {
        contract.add_business(i as u64, format!("Business {}", i), i as u64);
    }
    let count = contract.get_business_count();
    assert_eq!(count, 100);
}

#[test]
fn test_get_business_count_preserves_state_on_failure() {
    let env = Env::default();
    let mut contract = DynamicFees::init(env);
    contract.add_business(1, "Acme Corp".to_string(), 100);
    contract.add_business(2, "Beta Inc".to_string(), 200);

    // Attempt to remove non-existent business
    let result = contract.remove_business(&999);
    assert!(matches!(result, Err(DynamicFeesError::BusinessNotFound)));

    // State should be preserved - still 2 businesses
    assert_eq!(contract.get_business_count(), 2);

    // Remove existing business
    contract.remove_business(&1);
    assert_eq!(contract.get_business_count(), 1);
}