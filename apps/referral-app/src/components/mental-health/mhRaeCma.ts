/** Colorado RAE → Case Management Agency directory for MH LOC / Coverage. */

export type RaeId = "rae_1" | "rae_2" | "rae_3" | "rae_4"

export type CmaOption = {
    id: string
    name: string
    counties: string
}

export const RAE_REGION_OPTIONS: { value: RaeId; label: string }[] = [
    {
        value: "rae_1",
        label: "Region 1 – Rocky Mountain Health Plans (RMHP) and RMHP PRIME",
    },
    {
        value: "rae_2",
        label: "Region 2 – Northeast Health Partners (NHP)",
    },
    {
        value: "rae_3",
        label: "Region 3 – Colorado Community Health Alliance (CCHA)",
    },
    {
        value: "rae_4",
        label: "Region 4 – Colorado Access (COA) / Denver Health Medicaid Choice (DHMC)",
    },
]

export const CMA_BY_RAE: Record<RaeId, CmaOption[]> = {
    rae_1: [
        {
            id: "community_connections",
            name: "Community Connections",
            counties: "Archuleta, Dolores, La Plata, Montezuma, San Juan",
        },
        {
            id: "garfield_county_hs",
            name: "Garfield County Human Services",
            counties: "Garfield, Eagle, Pitkin, Summit",
        },
        {
            id: "las_animas_dhs",
            name: "Las Animas County Dept. of Human Services",
            counties: "Huerfano, Las Animas",
        },
        {
            id: "montrose_county_hs",
            name: "Montrose County Human Services",
            counties: "Montrose, Ouray, San Miguel",
        },
        {
            id: "rmhp_cma",
            name: "Rocky Mountain Health Plans",
            counties:
                "Alamosa, Chaffee, Conejos, Costilla, Custer, Delta, Fremont, Gunnison, Hinsdale, Grand, Jackson, Lake, Mesa, Mineral, Moffat, Rio Blanco, Rio Grande, Routt, Saguache",
        },
    ],
    rae_2: [
        {
            id: "foothills_gateway",
            name: "Foothills Gateway",
            counties: "Larimer",
        },
        {
            id: "northeastern_cog",
            name: "Northeastern Colorado Association of Local Governments",
            counties: "Cheyenne, Kit Carson, Lincoln, Logan, Morgan, Phillips, Sedgwick, Washington, Yuma",
        },
        {
            id: "otero_dhs",
            name: "Otero County Dept. of Human Services",
            counties: "Bent, Crowley, Otero",
        },
        {
            id: "prowers_phe",
            name: "Prowers County Public Health and Environment",
            counties: "Baca, Kiowa, Prowers",
        },
        {
            id: "weld_cma",
            name: "Weld County Case Management Agency",
            counties: "Weld",
        },
    ],
    rae_3: [
        {
            id: "ai_avenues",
            name: "A&I Avenues",
            counties: "Boulder, Broomfield, Gilpin",
        },
        {
            id: "resource_exchange",
            name: "The Resource Exchange",
            counties: "El Paso, Park, Pueblo, Teller",
        },
        {
            id: "jefferson_dhs",
            name: "Jefferson County Dept. of Human Services",
            counties: "Clear Creek, Jefferson",
        },
    ],
    rae_4: [
        {
            id: "rmhs",
            name: "Rocky Mountain Human Services",
            counties: "Adams, Denver",
        },
        {
            id: "developmental_pathways",
            name: "Developmental Pathways",
            counties: "Elbert, Arapahoe, Douglas (Region 2 RAE counties covered under a Region 4 CMA)",
        },
    ],
}

export function cmaLabel(cma: CmaOption): string {
    return `${cma.name} — counties: ${cma.counties}`
}

export function findCma(rae: string, cmaId: string): CmaOption | null {
    if (!rae || !(rae in CMA_BY_RAE)) return null
    return CMA_BY_RAE[rae as RaeId].find((c) => c.id === cmaId) ?? null
}
