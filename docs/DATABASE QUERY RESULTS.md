Quesry 1

| table_name           | column_name                    | data_type                | character_maximum_length | is_nullable | column_default         | ordinal_position |
| -------------------- | ------------------------------ | ------------------------ | ------------------------ | ----------- | ---------------------- | ---------------- |
| referral_inquiries   | id                             | uuid                     | null                     | NO          | gen_random_uuid()      | 1                |
| referral_inquiries   | inquiry_type                   | text                     | null                     | NO          | null                   | 2                |
| referral_inquiries   | referral_source_name           | text                     | null                     | NO          | null                   | 3                |
| referral_inquiries   | referral_source_phone          | text                     | null                     | YES         | null                   | 4                |
| referral_inquiries   | referral_source_email          | text                     | null                     | NO          | null                   | 5                |
| referral_inquiries   | referral_source_relationship   | text                     | null                     | YES         | null                   | 6                |
| referral_inquiries   | referral_source_organization   | text                     | null                     | YES         | null                   | 7                |
| referral_inquiries   | referral_source_title          | text                     | null                     | YES         | null                   | 8                |
| referral_inquiries   | client_first_name              | text                     | null                     | YES         | null                   | 9                |
| referral_inquiries   | client_last_initial            | text                     | null                     | YES         | null                   | 10               |
| referral_inquiries   | client_approximate_age         | text                     | null                     | YES         | null                   | 11               |
| referral_inquiries   | client_current_location        | text                     | null                     | YES         | null                   | 12               |
| referral_inquiries   | situation_notes                | text                     | null                     | YES         | null                   | 13               |
| referral_inquiries   | how_heard_about_us             | text                     | null                     | YES         | null                   | 14               |
| referral_inquiries   | status                         | text                     | null                     | NO          | 'pending_review'::text | 15               |
| referral_inquiries   | created_at                     | timestamp with time zone | null                     | YES         | now()                  | 16               |
| referral_inquiries   | updated_at                     | timestamp with time zone | null                     | YES         | now()                  | 17               |
| referral_submissions | id                             | uuid                     | null                     | NO          | gen_random_uuid()      | 1                |
| referral_submissions | referral_source_type           | text                     | null                     | NO          | null                   | 2                |
| referral_submissions | is_priority_referral           | boolean                  | null                     | NO          | false                  | 3                |
| referral_submissions | referral_source_name           | text                     | null                     | NO          | null                   | 4                |
| referral_submissions | referral_source_email          | text                     | null                     | NO          | null                   | 5                |
| referral_submissions | referral_source_phone          | text                     | null                     | YES         | null                   | 6                |
| referral_submissions | referral_source_organization   | text                     | null                     | YES         | null                   | 7                |
| referral_submissions | referral_source_title          | text                     | null                     | YES         | null                   | 8                |
| referral_submissions | urgent_placement               | boolean                  | null                     | YES         | false                  | 9                |
| referral_submissions | client_first_name              | text                     | null                     | YES         | null                   | 10               |
| referral_submissions | client_middle_name             | text                     | null                     | YES         | null                   | 11               |
| referral_submissions | client_last_name               | text                     | null                     | YES         | null                   | 12               |
| referral_submissions | client_dob                     | date                     | null                     | YES         | null                   | 13               |
| referral_submissions | client_ssn                     | text                     | null                     | YES         | null                   | 14               |
| referral_submissions | client_gender                  | text                     | null                     | YES         | null                   | 15               |
| referral_submissions | case_number                    | text                     | null                     | YES         | null                   | 16               |
| referral_submissions | court_jurisdiction             | text                     | null                     | YES         | null                   | 17               |
| referral_submissions | judge_name                     | text                     | null                     | YES         | null                   | 18               |
| referral_submissions | attorney_name                  | text                     | null                     | YES         | null                   | 19               |
| referral_submissions | charges                        | text                     | null                     | YES         | null                   | 20               |
| referral_submissions | competency_eval_date           | date                     | null                     | YES         | null                   | 21               |
| referral_submissions | next_court_date                | date                     | null                     | YES         | null                   | 22               |
| referral_submissions | current_location_type          | text                     | null                     | YES         | null                   | 23               |
| referral_submissions | facility_name                  | text                     | null                     | YES         | null                   | 24               |
| referral_submissions | inmate_id                      | text                     | null                     | YES         | null                   | 25               |
| referral_submissions | facility_contact_person        | text                     | null                     | YES         | null                   | 26               |
| referral_submissions | facility_contact_phone         | text                     | null                     | YES         | null                   | 27               |
| referral_submissions | emergency_contact_name         | text                     | null                     | YES         | null                   | 28               |
| referral_submissions | emergency_contact_relationship | text                     | null                     | YES         | null                   | 29               |
| referral_submissions | emergency_contact_phone        | text                     | null                     | YES         | null                   | 30               |
| referral_submissions | current_diagnoses              | text                     | null                     | YES         | null                   | 31               |
| referral_submissions | current_medications            | jsonb                    | null                     | YES         | null                   | 32               |
| referral_submissions | psychiatric_history            | text                     | null                     | YES         | null                   | 33               |
| referral_submissions | substance_use_history          | text                     | null                     | YES         | null                   | 34               |
| referral_submissions | medical_conditions             | text                     | null                     | YES         | null                   | 35               |
| referral_submissions | medicaid_status                | text                     | null                     | YES         | null                   | 36               |
| referral_submissions | medicaid_id                    | text                     | null                     | YES         | null                   | 37               |
| referral_submissions | medicaid_mco                   | text                     | null                     | YES         | null                   | 38               |
| referral_submissions | expected_payer                 | text                     | null                     | YES         | null                   | 39               |
| referral_submissions | violence_risk                  | boolean                  | null                     | YES         | false                  | 40               |
| referral_submissions | suicide_risk                   | boolean                  | null                     | YES         | false                  | 41               |
| referral_submissions | elopement_risk                 | boolean                  | null                     | YES         | false                  | 42               |
| referral_submissions | medical_needs                  | boolean                  | null                     | YES         | false                  | 43               |
| referral_submissions | safety_notes                   | text                     | null                     | YES         | null                   | 44               |
| referral_submissions | uploaded_documents             | jsonb                    | null                     | YES         | null                   | 45               |
| referral_submissions | status                         | text                     | null                     | NO          | 'pending_review'::text | 46               |
| referral_submissions | reviewed_by                    | uuid                     | null                     | YES         | null                   | 47               |
| referral_submissions | reviewed_at                    | timestamp with time zone | null                     | YES         | null                   | 48               |
| referral_submissions | review_notes                   | text                     | null                     | YES         | null                   | 49               |
| referral_submissions | created_at                     | timestamp with time zone | null                     | NO          | now()                  | 50               |
| referral_submissions | updated_at                     | timestamp with time zone | null                     | NO          | now()                  | 51               |
| referral_submissions | ip_address                     | inet                     | null                     | YES         | null                   | 52               |
| referral_submissions | user_agent                     | text                     | null                     | YES         | null                   | 53               |
| referral_submissions | form_completion_percentage     | integer                  | null                     | YES         | 0                      | 54               |
| referral_submissions | time_spent_seconds             | integer                  | null                     | YES         | null                   | 55               |
| referral_submissions | session_id                     | uuid                     | null                     | YES         | null                   | 56               |
| referral_submissions | last_auto_save                 | timestamp with time zone | null                     | YES         | null                   | 57               |
| referral_submissions | client_preferred_name          | text                     | null                     | YES         | null                   | 58               |
| referral_submissions | client_primary_language        | text                     | null                     | YES         | null                   | 59               |
| referral_submissions | interpreter_needed             | boolean                  | null                     | YES         | false                  | 60               |
| referral_submissions | additional_notes               | text                     | null                     | YES         | null                   | 61               |

Query 2

| table_name           | total_rows | earliest_record               | latest_record                 |
| -------------------- | ---------- | ----------------------------- | ----------------------------- |
| referral_inquiries   | 3          | 2026-01-31 22:34:22.097656+00 | 2026-02-01 07:00:58.326858+00 |
| referral_submissions | 35         | 2026-01-30 07:03:33.479044+00 | 2026-02-03 01:23:41.14821+00  |

Query 3

| table_name           | constraint_name                       | constraint_type | column_name |
| -------------------- | ------------------------------------- | --------------- | ----------- |
| referral_inquiries   | referral_inquiries_pkey               | PRIMARY KEY     | id          |
| referral_submissions | referral_submissions_reviewed_by_fkey | FOREIGN KEY     | reviewed_by |
| referral_submissions | referral_submissions_pkey             | PRIMARY KEY     | id          |

Query 4

| schemaname | tablename            | policyname                       | permissive | roles           | cmd    | qual | with_check |
| ---------- | -------------------- | -------------------------------- | ---------- | --------------- | ------ | ---- | ---------- |
| public     | referral_submissions | authenticated_select_policy      | PERMISSIVE | {authenticated} | SELECT | true | null       |
| public     | referral_submissions | authenticated_update_policy      | PERMISSIVE | {authenticated} | UPDATE | true | true       |
| public     | referral_inquiries   | public_insert_inquiries          | PERMISSIVE | {public}        | INSERT | null | true       |
| public     | referral_inquiries   | authenticated_select_inquiries   | PERMISSIVE | {authenticated} | SELECT | true | null       |
| public     | referral_inquiries   | authenticated_update_inquiries   | PERMISSIVE | {authenticated} | UPDATE | true | true       |
| public     | referral_submissions | authenticated_insert_submissions | PERMISSIVE | {authenticated} | INSERT | null | true       |

Query 5 - referral_inquiries uses status not priority

Error: Failed to run sql query: ERROR: 42703: column "priority" does not exist LINE 13: priority, ^

Query 6

| table_name           | column_count |
| -------------------- | ------------ |
| corporate_clients    | 4            |
| programs             | 5            |
| referral_inquiries   | 17           |
| referral_submissions | 61           |
| role_permissions     | 8            |
| tenant_roles         | 8            |
| users                | 9            |

Query 7

| id                                   | referral_source_type | is_priority_referral | referral_source_name | referral_source_email | referral_source_phone | referral_source_organization | referral_source_title | urgent_placement | client_first_name | client_middle_name | client_last_name | client_dob | client_ssn | client_gender      | case_number | court_jurisdiction | judge_name | attorney_name | charges   | competency_eval_date | next_court_date | current_location_type | facility_name | inmate_id | facility_contact_person | facility_contact_phone | emergency_contact_name | emergency_contact_relationship | emergency_contact_phone | current_diagnoses | current_medications | psychiatric_history | substance_use_history | medical_conditions | medicaid_status | medicaid_id | medicaid_mco   | expected_payer | violence_risk | suicide_risk | elopement_risk | medical_needs | safety_notes | uploaded_documents | status         | reviewed_by | reviewed_at | review_notes | created_at                   | updated_at                   | ip_address | user_agent | form_completion_percentage | time_spent_seconds | session_id | last_auto_save | client_preferred_name | client_primary_language | interpreter_needed | additional_notes |
| ------------------------------------ | -------------------- | -------------------- | -------------------- | --------------------- | --------------------- | ---------------------------- | --------------------- | ---------------- | ----------------- | ------------------ | ---------------- | ---------- | ---------- | ------------------ | ----------- | ------------------ | ---------- | ------------- | --------- | -------------------- | --------------- | --------------------- | ------------- | --------- | ----------------------- | ---------------------- | ---------------------- | ------------------------------ | ----------------------- | ----------------- | ------------------- | ------------------- | --------------------- | ------------------ | --------------- | ----------- | -------------- | -------------- | ------------- | ------------ | -------------- | ------------- | ------------ | ------------------ | -------------- | ----------- | ----------- | ------------ | ---------------------------- | ---------------------------- | ---------- | ---------- | -------------------------- | ------------------ | ---------- | -------------- | --------------------- | ----------------------- | ------------------ | ---------------- |
| 27d26f15-0857-4837-a833-82f98f44d8da | probation_parole     | true                 | Cali Peterson        | newkey@test.com       | 3039554531            |                              |                       | true             | ROLLERBLADER      |                    | ROLLERBLADER     | 1950-02-02 |            | transgender_female | 6662626     | Adams              | Cleave     | Steve         | the beave | 2026-04-14           | 2026-05-19      | treatment_facility    | ASSpongRidge  | 446655    | Lil Willy               | 7209753696             | Burt                   | Stepdaddy                      | 8005555555              | asdf              | asf                 | asdf                | asdf                  | asdf               | active          | 565656      | rocky_mountain | medicaid       | true          | true         | false          | true          | sadf         | null               | pending_review | null        | null        | null         | 2026-02-03 01:23:41.14821+00 | 2026-02-03 01:23:41.14821+00 | null       | null       | 0                          | null               | null       | null           |                       |                         | false              | asdf             |

