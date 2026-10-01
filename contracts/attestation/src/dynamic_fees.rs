use soroban_sdk::{contracttype, Env, Vec};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Business {
    pub id: u64,
    pub name_hash: u64,
    pub owner: u64,
}

#[contracttype]
pub enum DynamicFeesError {
    BusinessNotFound,
    Unauthorized,
}

pub struct DynamicFees {
    env: Env,
    businesses: Vec<Business>,
}

impl DynamicFees {
    pub fn init(env: Env) -> Self {
        Self {
            env: env.clone(),
            businesses: Vec::new(&env),
        }
    }

    pub fn add_business(&mut self, id: u64, name: String, owner: u64) {
        self.businesses.push_back(Business {
            id,
            name_hash: name.as_bytes().iter().fold(0u64, |acc, &b| acc.wrapping_mul(31) + (b as u64)),
            owner,
        });
    }

    pub fn get_business_count(&self) -> u32 {
        self.businesses.len() as u32
    }

    pub fn get_business(&self, id: &u64) -> Option<Business> {
        for business in self.businesses.iter() {
            if business.id == *id {
                return Some(business.clone());
            }
        }
        None
    }

    pub fn remove_business(&mut self, id: &u64) -> Result<(), DynamicFeesError> {
        let index = self
            .businesses
            .iter()
            .position(|b| b.id == *id)
            .ok_or(DynamicFeesError::BusinessNotFound)?;

        self.businesses.remove(index.try_into().unwrap());
        Ok(())
    }
}