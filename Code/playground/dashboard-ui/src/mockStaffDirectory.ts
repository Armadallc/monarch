import type { DashboardProgram, StaffMember } from "./types"

/** Logged-in admissions staff in the playground. */
export const CURRENT_STAFF_USERNAME = "cfleishman"

export const CURRENT_STAFF_ID = "staff-1"

export const MOCK_STAFF_DIRECTORY: StaffMember[] = [
    {
        id: "staff-1",
        username: "cfleishman",
        display_name: "Christina Fleishman",
        program_ids: ["Competency", "Mental Health"],
    },
    {
        id: "staff-2",
        username: "acorte",
        display_name: "Alex Corte",
        program_ids: ["Competency"],
    },
    {
        id: "staff-3",
        username: "jhurd",
        display_name: "Jordan Hurst",
        program_ids: ["Competency", "Mental Health"],
    },
    {
        id: "staff-4",
        username: "jkim",
        display_name: "Jordan Kim",
        program_ids: ["Mental Health", "Sober Living"],
    },
    {
        id: "staff-5",
        username: "mlee",
        display_name: "Morgan Lee",
        program_ids: ["Competency", "Launch"],
    },
]

export function staffByUsername(username: string): StaffMember | undefined {
    return MOCK_STAFF_DIRECTORY.find((s) => s.username.toLowerCase() === username.toLowerCase())
}

export function staffById(id: string): StaffMember | undefined {
    return MOCK_STAFF_DIRECTORY.find((s) => s.id === id)
}

export function staffDisplayName(username: string): string {
    return staffByUsername(username)?.display_name ?? username
}

export function currentStaffMember(): StaffMember {
    return staffById(CURRENT_STAFF_ID) ?? MOCK_STAFF_DIRECTORY[0]
}

export function staffProgramMemberships(staffId: string): DashboardProgram[] {
    return staffById(staffId)?.program_ids ?? []
}
