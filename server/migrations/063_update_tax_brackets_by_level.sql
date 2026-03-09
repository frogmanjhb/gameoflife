-- Migration: Update tax brackets to align with job levels
-- L1: 2%, L2: 4%, L3: 8%, L4: 16%, L5-7: 20%, L8-10: 25%
-- Bracket boundaries set at midpoints between level salaries (base R2,000)

DELETE FROM tax_brackets;

INSERT INTO tax_brackets (min_salary, max_salary, tax_rate) VALUES
    (0, 2700, 2),              -- L1 salary R2,000
    (2700.01, 4150, 4),        -- L2 salary R3,444
    (4150.01, 5600, 8),        -- L3 salary R4,889
    (5600.01, 7050, 16),       -- L4 salary R6,333
    (7050.01, 11400, 20),      -- L5-L7 salary R7,778 – R10,667
    (11400.01, NULL, 25);      -- L8-L10 salary R12,111 – R15,000
