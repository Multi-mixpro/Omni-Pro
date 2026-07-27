-- Product Launch OS V2 seeds its required business units, roles, permissions,
-- and Auth-derived profiles inside the reset migration so cutover is atomic.
-- Keep this file intentionally empty until non-production demo fixtures are approved.
select true as product_launch_os_seed_ready;
