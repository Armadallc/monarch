/** Ritten-aligned substance options for MH substance-use history. */

export type SubstanceOpt = { value: string; label: string; group: string }

export const SUBSTANCE_OPTIONS: SubstanceOpt[] = [
    // Opioids
    { group: "Opioids", value: "opioids_general", label: "Opioids – General" },
    { group: "Opioids", value: "buprenorphine_suboxone", label: "Buprenorphine (Suboxone)" },
    { group: "Opioids", value: "codeine", label: "Codeine" },
    { group: "Opioids", value: "fentanyl", label: "Fentanyl" },
    { group: "Opioids", value: "heroin", label: "Heroin" },
    { group: "Opioids", value: "hydrocodone", label: "Hydrocodone (Vicodin, Lortab)" },
    { group: "Opioids", value: "hydromorphone", label: "Hydromorphone (Dilaudid)" },
    { group: "Opioids", value: "meperidine", label: "Meperidine (Demerol)" },
    { group: "Opioids", value: "methadone", label: "Methadone" },
    { group: "Opioids", value: "morphine", label: "Morphine (MS Contin)" },
    { group: "Opioids", value: "opium", label: "Opium" },
    { group: "Opioids", value: "oxycodone", label: "Oxycodone (Percocet, Oxycontin)" },
    { group: "Opioids", value: "oxymorphone", label: "Oxymorphone (Opana)" },
    { group: "Opioids", value: "tapentadol", label: "Tapentadol (Nucynta)" },
    { group: "Opioids", value: "tramadol", label: "Tramadol (Ultram)" },

    // Benzodiazepines & agents for insomnia
    { group: "Benzodiazepines & Agents for Insomnia", value: "benzo_insomnia_general", label: "Benzodiazepines & Agents for Insomnia – General" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "alprazolam", label: "Alprazolam (Xanax)" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "chlordiazepoxide", label: "Chlordiazepoxide (Librium)" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "clonazepam", label: "Clonazepam (Klonopin)" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "diazepam", label: "Diazepam" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "eszopiclone", label: "Eszopiclone (Lunesta)" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "lorazepam", label: "Lorazepam (Ativan)" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "temazepam", label: "Temazepam (Restoril)" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "zaleplon", label: "Zaleplon (Sonata)" },
    { group: "Benzodiazepines & Agents for Insomnia", value: "zolpidem", label: "Zolpidem (Ambien)" },

    // Stimulants
    { group: "Stimulants", value: "stimulants_general", label: "Stimulants – General" },
    { group: "Stimulants", value: "amphetamine_salts", label: "Amphetamine Salts (Adderall)" },
    { group: "Stimulants", value: "armodafinil", label: "Armodafinil (Nuvigil)" },
    { group: "Stimulants", value: "cocaine", label: "Cocaine" },
    { group: "Stimulants", value: "dexmethylphenidate", label: "Dexmethylphenidate (Focalin)" },
    { group: "Stimulants", value: "dextroamphetamine", label: "Dextroamphetamine (Dexedrine)" },
    { group: "Stimulants", value: "lisdexamfetamine", label: "Lisdexamfetamine (Vyvanse)" },
    { group: "Stimulants", value: "mdma", label: "MDMA (Ecstasy)" },
    { group: "Stimulants", value: "methamphetamine", label: "Methamphetamine" },
    { group: "Stimulants", value: "methylphenidate", label: "Methylphenidate (Ritalin)" },
    { group: "Stimulants", value: "modafinil", label: "Modafinil (Provigil)" },
    { group: "Stimulants", value: "phentermine", label: "Phentermine" },
    { group: "Stimulants", value: "solriamfetol", label: "Solriamfetol (Sunosi)" },

    // THC
    { group: "THC", value: "thc_general", label: "THC – General" },
    { group: "THC", value: "dabbing", label: "Dabbing" },
    { group: "THC", value: "dronabinol", label: "Dronabinol (Marinol)" },
    { group: "THC", value: "ingesting_edibles", label: "Ingesting (Edibles)" },
    { group: "THC", value: "nabilone", label: "Nabilone (Cesamet)" },
    { group: "THC", value: "smoking_cannabis", label: "Smoking Cannabis" },
    { group: "THC", value: "vaping_thc", label: "Vaping THC" },

    // Synthetic
    { group: "Synthetic Drugs", value: "synthetic_general", label: "Synthetic Drugs – General" },
    { group: "Synthetic Drugs", value: "synthetic_marijuana", label: "Synthetic Marijuana (K2/Spice)" },
    { group: "Synthetic Drugs", value: "bath_salts", label: "Bath Salts" },

    // Inhalants
    { group: "Inhalants", value: "inhalants_general", label: "Inhalants – General" },

    // Other
    { group: "Other", value: "other_general", label: "Other – General" },
    { group: "Other", value: "anabolic_steroids", label: "Anabolic Steroids" },
    { group: "Other", value: "baclofen", label: "Baclofen" },
    { group: "Other", value: "dextromethorphan", label: "Dextromethorphan" },
    { group: "Other", value: "gabapentin", label: "Gabapentin" },
    { group: "Other", value: "sodium_oxybate_ghb", label: "Sodium Oxybate / GHB" },
    { group: "Other", value: "tianeptine", label: "Tianeptine" },
    { group: "Other", value: "alcohol", label: "Alcohol" },
    { group: "Other", value: "nicotine", label: "Nicotine" },
    { group: "Other", value: "inhalants", label: "Inhalants" },
    { group: "Other", value: "ketamine", label: "Ketamine" },
    { group: "Other", value: "lsd", label: "LSD" },
    { group: "Other", value: "mitragynine_kratom", label: "Mitragynine (Kratom)" },
    { group: "Other", value: "psilocybin", label: "Psilocybin" },
    { group: "Other", value: "salvia", label: "Salvia" },

    // Unknown
    { group: "Unknown", value: "unknown_general", label: "Unknown – General" },
]

export const SUBSTANCE_GROUPS = [
    "Opioids",
    "Benzodiazepines & Agents for Insomnia",
    "Stimulants",
    "THC",
    "Synthetic Drugs",
    "Inhalants",
    "Other",
    "Unknown",
] as const
