-- Plot I6: class auction / secret community building (highest value, not direct purchase)

UPDATE land_parcels
SET value = 500000,
    risk_level = 'medium',
    pros = ARRAY[
      'Site of the secret community building',
      'Most valuable plot in your town',
      'Awarded through class auction only'
    ],
    cons = ARRAY[
      'Not available for direct purchase',
      'Winning bid required at class auction'
    ],
    updated_at = CURRENT_TIMESTAMP
WHERE grid_code = 'I6';
