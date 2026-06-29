

# Analysis of `Monarch Sober Living - Resident Application.html`

The provided HTML file is the front-end code for a comprehensive, multi-step (or rather, multi-section) digital intake application for **Monarch Sober Living Homes**. It is built as a modern, single-page web application (SPA), likely using a framework like React (based on the script tags like `/assets/index-D_Xem5RV.js` and references to `react-CsbwFch5.js`).

## Purpose & Functionality

The primary purpose of this form is to collect a wide range of personal, medical, financial, and legal information from prospective residents. This is a standard but very detailed intake process for a sober living facility, designed to assess an applicant's suitability, needs, and potential risks.

**Key functional aspects:**

1.  **Client-Side Rendering (CSR):** The actual application logic, field validation, and data submission are handled by the linked JavaScript files. The HTML is largely a skeleton containing `<div id="app">` where the React application is injected.
2.  **Conditional Logic:** While not explicit in the static HTML, the structure of the `select` dropdowns and `checkbox` groups strongly suggests the presence of conditional logic in the underlying JavaScript (e.g., showing alternate name fields only if "Yes" is selected).
3.  **Data Handling:** It integrates with **Stripe** for payment processing, **PostHog** for product analytics, and likely a backend API (via the Behave Health EHR system) to save and submit application data.
4.  **Responsive Design:** CSS classes like `mq900:max-w-[1200px]` indicate a mobile-first, responsive layout that works across different screen sizes.
5.  **User Experience Features:**
    - **Table of Contents:** A sidebar on desktop (or a dropdown on mobile) allows users to navigate between the many sections of the long form.
    - **Auto-Save:** A prominent popup overlay asks for contact details first to enable "automatic saving of your application form," allowing users to leave and return.
    - **Required Fields:** The UI includes a "Highlight Required Fields" button, indicating client-side validation.
6.  **Third-Party Integrations:** The code loads scripts for Stripe (payments) and PostHog (analytics/feature tracking), indicating these are essential parts of the business and product workflow.

## Target Audience

The form is designed for **individuals seeking entry into a structured sober living program**. The questions imply that the applicant is likely transitioning from a less stable living situation, may have involvement with the criminal justice system, has a history of substance use, and could be facing financial or employment challenges.

## Overall Assessment

This is not a simple static form but a well-engineered, security-conscious (evident from `noindex,nofollow` meta tags and interactions with payment APIs), and user-focused digital tool for a critical business process. The breadth of questions—from demographics and substance use to legal restrictions and financial aid—shows a thorough risk assessment and care-planning process.

---

# Monarch Sober Living Homes - Resident Application Form

This document details all the fields and sections of the resident application form. Required fields are noted with an asterisk (*).

## 1. Personal Details

- **First Name*** [Text Input]
- **Middle Name** [Text Input]
- **Last Name*** [Text Input]
- **Have you ever been known by an alternate name?** [Radio: Yes | No]
- **Date of Birth*** [Date Picker]

## 2. Contact Details

- **Please provide at least one of the following Contact Details:*** [Checkbox]
    - Cell Phone Number
    - Landline Phone Number
    - Email Address

- **Consent to contact** [Checkbox]
    - I consent to be contacted by Monarch Sober Living Homes via SMS, email, or phone using the information I provided for the purposes of reviewing my application.

- **email address*** [Textarea] *(Note: This seems like a duplicate/legacy field for entering an email address, possibly for confirmation)*

## 3. Emergency Contact Details

- **First Name*** [Text Input]
- **Last Name*** [Text Input]
- **Name Suffix** [Text Input] `e.g. Jr., Sr., etc.`
- **Phone Number** [Tel Input]
- **Email Address** [Email Input]
- **Relationship** [Dropdown: Friend, Mother, Father, Brother, Sister, Child, Spouse, Grandfather, Grandmother, Aunt, Uncle, Niece, Nephew, Cousin, Relative, Sponsor, Case Manager, Recovery Coach, Medical Doctor (PCP), Medication-Assisted-Treatment Doctor (MAT), Psychiatrist, Psychologist, Therapist, Nutritionist, Employer, Employee-Assistance-Program Contact, Union Representative, Financial Inquiry Contact, Probation Officer, Parole Officer, House Arrest Contact, Drug Court Contact, Correctional Contact, Social Services Case Worker, Domestic Violence Case Worker, Attorney, Legal Contact, Other]
- **Can we release information to this person?*** [Radio: Yes | No]
- **Is this person an emergency contact?** [Radio: Yes | No] *(Note: Defaults to "Yes")*
- **Notes** [Textarea]

## 4. Demographics

- **Ethnicity*** [Checkbox]
    - Hispanic / Latino
    - Non-Hispanic
    - Middle Eastern / North African
    - Jewish
    - Arab
    - Caribbean
    - Eastern European
    - Southeast Asian
    - Native / Indigenous
    - Prefer Not to Answer
    - Other

- **Race*** [Checkbox]
    - American Indian / Alaska Native
    - Asian
    - Black / African American
    - Native Hawaiian / Pacific Islander
    - White
    - Prefer Not to Answer
    - Other

- **Sex Assigned at Birth*** [Dropdown: Male, Female, Intersex, Decline to respond, Other]
- **Sexual Orientation*** [Checkbox]
    - Heterosexual
    - Homosexual
    - Bisexual
    - Pansexual
    - Asexual
    - Queer
    - Demisexual
    - Polysexual
    - Other

- **Gender Identity*** [Dropdown: Male, Female, Transgender Male / Transman / FTM, Transgender Female / Transwoman / MTF, Gender Queer, Non-binary, Decline to respond, Other]
- **Are you currently enrolled in school?*** [Radio: Yes, I am enrolled in school | No, I am not]
- **What is the highest level of education you completed?*** [Dropdown: Elementary or High school, no diploma; Elementary or High school; 7th Grade; ... up to Doctorate degree]
- **What is your primary language?** [Dropdown: English, Spanish or Spanish Creole, French, etc.]

## 5. Questions

- **Do you have insurance? If yes, please select the option below insurance will pay and fill out the requested information.** [Textarea]

## 6. Medical Insurance

- **Do you have medical insurance?** [Radio: Yes | No]

## 7. Program Cost

- **How will you pay for the program?*** [Checkbox]
    - I will pay myself
    - Someone else will pay
    - Insurance will pay
    - I need financial assistance
    - Vouchers - Federal
    - Vouchers - State
    - Vouchers - County
    - Vouchers - Other
    - Scholarship
    - Other
    - *(Note: You can select one or multiple options)*

## 8. Program Details

- **Have you previously been part of this program?** [Radio: Yes | No] *(Note: Likely required)*
- **Do you have any concerns with sharing a room?** [Radio: Yes | No] *(Note: Likely required)*
- **Are you able to perform household chores?** [Radio: Yes | No] *(Note: Likely required)*

## 9. Current Living Situation

- **What best describes your current living situation?** [Radio Options]
    - I am living by myself
    - I am living with my family/relatives
    - I am living with my roommate(s)
    - I am renting a room or apartment
    - I am living in a home I own
    - I am living in a hotel/motel
    - I am living in a shelter
    - I am living in a temporary/transitional housing (including recovery housing)
    - I am living at a program, facility, or institution
    - I am living in a vehicle
    - I have no permanent place to live and I am currently experiencing homelessness
    - Other

- **Have you ever been in another housing program within the last 90 days?** [Radio: Yes | No]

## 10. Personal Contacts (Family)

- **Personal Contacts** (Please add at least two personal contacts) [Button: "Add New Personal Contact"]
- **What is your marital status?** [Dropdown: Single, Married, Engaged, Divorced, Separated, Domestic Partnered, Widowed] *(Note: Likely required)*
- **Are you fleeing a domestic violence situation?** [Radio: Yes | No] *(Note: Likely required)*
- **Do you have children?** [Radio: Yes | No] *(Note: Likely required)*

## 11. Referrals

- **Have you been referred to us by anyone?** [Radio: Yes | No]

## 12. Substance Use History

- **Drug(s) of Choice*** [Multi-Select Button]
- **What were the last drugs used and when?** [Textarea]
- **For how many years have you been using alcohol and/or drugs?** [Number Input] `years`
- **Do you use tobacco?** [Radio: Yes | No]

## 13. Medical

- **Do you have any allergies?** [Radio: Yes | No]
- **Are you currently under the care of any of the following provider types:** [Checkbox]
    - None Applicable
    - Medical Doctor (PCP)
    - Psychiatrist
    - Psychologist
    - Therapist
    - Nutritionist

- **How would you describe your current physical health?** [Radio: Good | Fair | Poor]
- **Do you have any physical health / medical conditions or disabilities?** [Radio: Yes | No]
- **Do any of the following apply to you?** [Checkbox]
    - None Apply
    - Hepatitis A
    - Hepatitis B
    - Hepatitis C
    - Immune System Disorder
    - Sexually Transmitted Diseases (STDs)
    - Tuberculosis (TB)
    - Pregnant

- **Do you have a history of seizures?** [Radio: Yes | No]
- **Do you have any upcoming appointments or ongoing physical needs?** [Radio: Yes | No]
- **Do you have any medical equipment?** [Checkbox]
    - None Applicable
    - Walker
    - Cane
    - Glucose Meter
    - C-Pap Machine
    - Specialized Pillow
    - Other

## 14. Mental Health

- **Do you have any mental health issues or diagnosis?** [Radio: Yes | No]
- **Do you have a history of self-harm?** [Radio: Yes | No]
- **Have you ever experienced any suicidal ideations, attempts, or received in-patient treatment for self-harming behaviors?** [Radio: Yes | No]
- **Do you have an Eating Disorder or Body Image Disorder?** [Radio: Yes | No]
- **Do you have a need for mental health services?** [Radio: Yes | No]
- **Have you ever been a victim of sex trafficking?** [Radio: Yes | No]
- **Have you ever been involved in prostitution?** [Radio: Yes | No]
- **Have you ever gotten in an altercation with a peer?** [Radio: Yes | No]
- **Do you currently have goals and hopes for your future?** [Radio: Yes | No]

## 15. Addictive Behaviors

- **Do you identify patterns in other areas of your life that may have some addictive qualities?** [Checkbox]
    - None
    - Internet
    - Food
    - Relationships
    - Money
    - Shopping
    - Sex
    - Other

- **Do you gamble?** [Radio: Yes | No]

## 16. Communicable Diseases

- **Are you at risk for exposure to any communicable diseases, or have you been in contact with someone who has?** [Radio: Yes | No]
- **Are you experiencing shortness of breath, coughing, fever, or other symptoms of Coronavirus and/or a flu?** [Radio: Yes | No]
- **Are you at risk for exposure to Coronavirus?** [Radio: Yes | No]
- **Have you traveled outside of the country in the last 30 days?** [Radio: Yes | No]

## 17. Medications

- **Are you currently using any prescription medications?** [Radio: Yes | No]
- **Are you currently using any over-the-counter medication?** [Radio: Yes | No]
- **Do you have enough prescriptions to last you for the next two weeks?** [Radio: Yes | No]
- **Are you participating in or about to enter MOUD or MAT services (drug replacement programs)?** [Radio: Yes | No]

## 18. Treatment History

- **Are you currently in a treatment program?** [Radio: Yes | No]
- **Have you ever been through any other treatment programs previously?** [Radio: Yes | No]
    - *(Description: Programs range from inpatient hospital detox or residential programs, to outpatient treatment centers and sober living homes)*

## 19. Recovery

- **Which 12 step meetings do you attend?** [Checkbox]
    - None
    - Alcoholics Anonymous (AA)
    - Narcotics Anonymous (NA)
    - Faith-Based
    - Community-Based
    - SMART Recovery
    - Celebrate Recovery
    - Other

- **What is your Sober or Clean date?** [Date Picker]
- **Do you have a Sponsor?** [Radio: Yes | No]
- **Do you have a Case Manager?** [Radio: Yes | No]
- **Do you have a Recovery Coach?** [Radio: Yes | No]

## 20. Assistance & Help

- **Do you have a learning disability or difficulty reading?** [Radio: Yes | No]
- **Do you have any immediate needs such as clothing or toiletries?** [Radio: Yes | No]
- **Do you need help to renew any forms of identification?** [Radio: Yes | No]
- **Do you need assistance with any food programs?** [Radio: Yes | No]

## 21. Courts & Criminal Justice

- **Are you now or have you ever been involved with the justice system (arrested or incarcerated)?** [Radio: Yes | No]
- **Do you have an attorney?** [Radio: Yes | No] *(Note: Likely required)*
- **Do you consent to a background check?** [Radio: Yes | No] *(Note: Likely required)*
- **Are you currently involved in any legal proceedings or criminal justice issues?** [Radio: Yes | No]
- **Do you have a requirement for Community Service?** [Radio: Yes | No]
- **Do have any court ordered treatment requirements?** [Radio: Yes | No]
- **Do you have any pending sentencing or possible jail time upcoming?** [Radio: Yes | No]
- **Do you have a Department of Corrections Number?** [Radio: Yes | No]
- **Have you ever been charged or convicted of Arson?** [Radio: Yes | No]
- **Have you ever been charged or convicted of any sexual or violent crimes in any jurisdiction?** [Radio: Yes | No]
- **Have you ever been charged or convicted of abuse or neglect of any person, including but not limited to disabled person, senior, or child?** [Radio: Yes | No]
- **Have you ever been charged or convicted of cruelty to animals?** [Radio: Yes | No]
- **Are you affiliated with any gang?** [Radio: Yes | No]

## 22. Restrictions

- **Select all legal requirements that apply** [Checkbox]
    - None Applicable
    - House Arrest
    - Probation
    - Parole
    - Drug Court
    - In Prison
    - Other

- **Are you required to register as a sex offender?** [Radio: Yes | No]
- **Are you required to register with any other authority for any other reason?** [Radio: Yes | No]
- **Are there any Restraining Orders against you or by you?** [Radio: Yes | No]

## 23. Admissions

- **When would you like to move in?** [Date & Time Picker]
- **Do you have a personal relationship with anyone that works for Monarch Sober Living Homes?** [Radio: Yes | No]
- **Have you previously applied to Monarch Sober Living Homes?** [Radio: Yes | No]
- **How long would you hope to stay at Monarch Sober Living Homes?** [Radio: 30 Days, 60 Days, 90 Days, 6 Months, 1 Year, 18 Months]
- **Are there any issues that could prevent you from completing the program?** [Radio: Yes | No]

## 24. Client Statement

- **Why do you want to live in a sober house?** [Textarea]
- **How did you hear about about our program?** [Textarea]
- **Were you referred to Monarch Sober Living Homes?** [Radio: Yes | No]
- **What other information should we consider when reviewing your application?** [Textarea]
- **Please describe what issues led you to seek housing with Monarch Sober Living Homes. Be specific as to details such as how, when, where and your personal responsibility.** [Textarea]
- **What are your goals and expectations?** [Textarea]
- **Why do you think you are a good fit for sober living?** [Textarea]
- **What do you want to accomplish while residing at Monarch Sober Living Homes?** [Textarea]

## 25. Employment

- **Are you able to work?** [Radio: Yes | No]
- **Are you currently employed?** [Radio: Yes | No]
- **What is your current occupation?** [Text Input]
- **Are you willing to work, volunteer, or go to school at least 20 hours a week?** [Textarea]

## 26. Personal Finance

- **Do you currently have an income?** [Radio: Yes | No]
- **If for some reason you cannot pay rent per week / month who can you call upon to help you?** [Textarea]
- **Do you receive any ongoing financial reimbursement for any reason?** [Radio: Yes | No]
- **Do you owe money to a former Sober Living House?** [Radio: Yes | No]
- **Weekly expenses (food, car payment, child support, etc)** [Textarea]
- **Additional Financial Information** [Textarea]

## 27. Transportation

- **Do you have a valid drivers license?** [Radio: Yes | No] *(Note: Likely required)*
- **What is your primary mode of transportation?** [Radio: Personal Vehicle, Family / Friend, Public Transit]

## 28. Sensitive Information

- **Drivers License Number** [Text Input] *(Note: Likely required)*
- **Social Security Number** [Text Input] *(Note: Likely required)*
- **State ID Number** [Text Input]
- **Limited License (Interlock Device)** [Text Input]

## 29. Additional Info

- **Please enter any other information about yourself or your situation that you feel we need to know** [Textarea]
- **Are you seeking housing in Denver, Lakewood, or Wheat Ridge? Please list all locations that apply, with your first preference listed first.** [Textarea]
- **Monarch Sober Living offers two programs** [Textarea]
- **Launch Program – A more structured living environment... Please type yes or no** [Textarea]
- **Standard Sober Living – A more independent environment... Please type yes or no** [Textarea]

---
*End of Application Form*

---

Notes: