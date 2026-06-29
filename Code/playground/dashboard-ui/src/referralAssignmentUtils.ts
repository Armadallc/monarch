import type { MockReferral, StaffMember } from "./types"

/** Short desk label — e.g. Christina Fleishman → Christina F. */
export function assigneeShortName(displayName: string): string {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return ""
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

export function assigneeFieldsFromStaff(
    staff: StaffMember | null | undefined
): Pick<MockReferral, "assigned_to_user_id" | "assignee_name"> {
    if (!staff) {
        return { assigned_to_user_id: null, assignee_name: undefined }
    }
    return {
        assigned_to_user_id: staff.id,
        assignee_name: assigneeShortName(staff.display_name),
    }
}

export function staffForProgram(staffDirectory: StaffMember[], program: MockReferral["program"]): StaffMember[] {
    return staffDirectory.filter((s) => s.program_ids.includes(program))
}

export function staffMemberById(staffDirectory: StaffMember[], id: string | null | undefined): StaffMember | undefined {
    if (!id) return undefined
    return staffDirectory.find((s) => s.id === id)
}
