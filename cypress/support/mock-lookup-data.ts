export const mockLoincLookupData: Record<string, [number, string[], null, string[][]]> = {

  heart: [
    3960,
    [
      "80276-9",
      "8867-4",
      "97711-6",
      "58302-1",
      "46021-2",
      "18708-8",
      "54533-5"
    ],
    null,
    [
      ["Heart sounds"],
      ["Heart rate"],
      ["Heart failure OP Note"],
      ["Rheumatic heart or heart valve problems"],
      ["Heart/Circulation"],
      ["Heart rate"],
      ["Heart/Circulation"]
    ]
  ],
  weight: [
    464,
    [
      '29463-7',
      '8337-8',
      '106738-8',
      '8341-0',
      '8340-2',
      '50064-5',
      '8338-6'
    ],
    null,
    [
      ['Weight', '29463-7'],
      ['Bdy weight special circumstances', '8337-8'],
      ['Brain weight/liver weight Fetus', '106738-8'],
      ['Dry weight Measured', '8341-0'],
      ['Dry weight Est', '8340-2'],
      ['Ideal bdy weight', '50064-5'],
      ['Weight ante partum Measured', '8338-6']
    ]
  ]
};

export const mockSnomedLookupData = {
  intersex: {
    "resourceType": "ValueSet",
    "id": "107f7531-880f-4d47-961e-f586c95c85e3",
    "url": "http://snomed.info/sct?fhir_vs",
    "status": "active",
    "copyright": "This value set includes content from SNOMED CT, which is copyright © 2002+ International Health Terminology Standards Development Organisation (SNOMED International), and distributed by agreement between SNOMED International and HL7. Implementer use of SNOMED CT is not covered by this agreement.",
    "expansion": {
      "id": "32b5180d-ba0b-4b54-a6a1-7cd9211dfd97",
      "timestamp": "2026-02-11T17:20:09+00:00",
      "total": 5,
      "offset": 0,
      "parameter": [
        {
          "name": "version",
          "valueUri": "http://snomed.info/sct|http://snomed.info/sct/900000000000207008/version/20260201"
        },
        {
          "name": "displayLanguage",
          "valueString": "en-US,en;q=0.9"
        }
      ],
      "contains": [
        { "system": "http://snomed.info/sct", "code": "32570691000036108", "display": "Intersex" },
        { "system": "http://snomed.info/sct", "code": "24878005", "display": "Intersex surgery" },
        { "system": "http://snomed.info/sct", "code": "428405009", "display": "History of intersex surgery" },
        { "system": "http://snomed.info/sct", "code": "51427007", "display": "Intersex surgery, male to female" },
        { "system": "http://snomed.info/sct", "code": "42775008", "display": "Intersex surgery, female to male" }
      ]
    }
  }

};

export const mockUcumLookupData: Record<string, [number, string[], null, string[][]]> = {
  a: [
    116,
    [
      "A",
      "a",
      "a_t",
      "a_g",
      "a_j",
      "A/m",
      "Ao"
    ],
    null,
    [
      [
        "A",
        "Ampere",
        "unit of electric current equal to flow rate of electrons equal to 6.2415×10^18 elementary charges moving past a boundary in one second or 1 Coulomb/second"
      ],
      [
        "a",
        "year",
        ""
      ],
      [
        "a_t",
        "tropical year",
        "has an average of 365.242181 days but is constantly changing."
      ],
      [
        "a_g",
        "mean Gregorian year",
        "has an average of 365.2425 days and is the most internationally used civil calendar."
      ],
      [
        "a_j",
        "mean Julian year",
        "has an average of 365.25 days, and in everyday use, has been replaced by the Gregorian year. However, this unit is used in astronomy to calculate light year. "
      ],
      [
        "A/m",
        "ampere per meter",
        "unit of magnetic field strength"
      ],
      [
        "Ao",
        "Ångström",
        "equal to 10^-10 meters; used to express wave lengths and atom scaled differences "
      ]
    ]
  ],
  a_g: [
    1,
    [
      "a_g"
    ],
    null,
    [
      [
        "a_g",
        "mean Gregorian year",
        "has an average of 365.2425 days and is the most internationally used civil calendar."
      ]
    ]
  ],
  f: [
    83,
    [
      "F",
      "fg",
      "fL",
      "fm",
      "fmol",
      "fmol/g",
      "fmol/L"
    ],
    null,
    [
      [
        "F",
        "farad",
        "CGS unit of electric capacitance with base units C/V (Coulomb per Volt)"
      ],
      [
        "fg",
        "femtogram",
        "equal to 10^-15 grams"
      ],
      [
        "fL",
        "femtoliter",
        "equal to 10^-15 liters"
      ],
      [
        "fm",
        "femtometer",
        "equal to 10^-15 meters"
      ],
      [
        "fmol",
        "femtomole",
        "equal to 10^-15 moles"
      ],
      [
        "fmol/g",
        "femtomole per gram",
        ""
      ],
      [
        "fmol/L",
        "femtomole per liter",
        ""
      ]
    ]
  ],
  inch: [
    10,
    [
      "[in_i]",
      "mL/[sin_i]",
      "[cin_i]",
      "[sin_i]",
      "[in_us]",
      "[in_i'H2O]",
      "[in_br]"
    ],
    null,
    [
      [
        "[in_i]",
        "inch",
        "standard unit for inch in the US and internationally"
      ],
      [
        "mL/[sin_i]",
        "milliliter per square inch (international)",
        ""
      ],
      [
        "[cin_i]",
        "cubic inch",
        "standard unit used in the US and internationally"
      ],
      [
        "[sin_i]",
        "square inch",
        "standard unit used in the US and internationally"
      ],
      [
        "[in_us]",
        "inch - US",
        "Better to use [in_i] which refers to the length used worldwide, including in the US"
      ],
      [
        "[in_i'H2O]",
        "inch of water column",
        "unit of pressure, especially in respiratory and ventilation care"
      ],
      [
        "[in_br]",
        "inch - British",
        ""
      ]
    ]
  ],
  j: [
    5,
    [
      "J",
      "J/L",
      "a_j",
      "mo_j",
      "erg"
    ],
    null,
    [
      [
        "J",
        "joule",
        "unit of energy defined as the work required to move an object 1 m with a force of 1 N (N.m) or an electric charge of 1 C through 1 V (C.V), or to produce 1 W for 1 s (W.s) "
      ],
      [
        "J/L",
        "joule per liter",
        ""
      ],
      [
        "a_j",
        "mean Julian year",
        "has an average of 365.25 days, and in everyday use, has been replaced by the Gregorian year. However, this unit is used in astronomy to calculate light year. "
      ],
      [
        "mo_j",
        "mean Julian month",
        "has an average of 30.435 days per month"
      ],
      [
        "erg",
        "erg",
        "unit of energy = 1 dyne centimeter = 10^-7 Joules"
      ]
    ]
  ],
  k: [
    87,
    [
      "K",
      "K/W",
      "k[IU]/L",
      "k[IU]/mL",
      "kat",
      "kat/kg",
      "kat/L"
    ],
    null,
    [
      [
        "K",
        "degree Kelvin",
        "absolute, thermodynamic temperature scale "
      ],
      [
        "K/W",
        "degree Kelvin per Watt",
        "unit for absolute thermal resistance equal to the reciprocal of thermal conductance. Unit used for tests to measure work of breathing"
      ],
      [
        "k[IU]/L",
        "kilo international unit per liter",
        "IgE has an WHO reference standard so IgE allergen testing can be reported as k[IU]/L"
      ],
      [
        "k[IU]/mL",
        "kilo international unit per milliliter",
        "IgE has an WHO reference standard so IgE allergen testing can be reported as k[IU]/mL"
      ],
      [
        "kat",
        "katal",
        "kat is a unit of catalytic activity with base units = mol/s. Rarely used because its units are too large to practically express catalytic activity. See enzyme unit [U] which is the standard unit for catalytic activity."
      ],
      [
        "kat/kg",
        "katal per kilogram",
        "kat is a unit of catalytic activity with base units = mol/s. Rarely used because its units are too large to practically express catalytic activity. See enzyme unit [U] which is the standard unit for catalytic activity."
      ],
      [
        "kat/L",
        "katal per liter",
        "kat is a unit of catalytic activity with base units = mol/s. Rarely used because its units are too large to practically express catalytic activity. See enzyme unit [U] which is the standard unit for catalytic activity."
      ]
    ]
  ],
  kat: [
    3,
    [
      "kat",
      "kat/kg",
      "kat/L"
    ],
    null,
    [
      [
        "kat",
        "katal",
        "kat is a unit of catalytic activity with base units = mol/s. Rarely used because its units are too large to practically express catalytic activity. See enzyme unit [U] which is the standard unit for catalytic activity."
      ],
      [
        "kat/kg",
        "katal per kilogram",
        "kat is a unit of catalytic activity with base units = mol/s. Rarely used because its units are too large to practically express catalytic activity. See enzyme unit [U] which is the standard unit for catalytic activity."
      ],
      [
        "kat/L",
        "katal per liter",
        "kat is a unit of catalytic activity with base units = mol/s. Rarely used because its units are too large to practically express catalytic activity. See enzyme unit [U] which is the standard unit for catalytic activity."
      ]
    ]
  ],
  "katal per kilogram": [
    1,
    [
      "kat/kg"
    ],
    null,
    [
      [
        "kat/kg",
        "katal per kilogram",
        "kat is a unit of catalytic activity with base units = mol/s. Rarely used because its units are too large to practically express catalytic activity. See enzyme unit [U] which is the standard unit for catalytic activity."
      ]
    ]
  ],
  kg: [
    56,
    [
      "kg",
      "kg/L",
      "kg/h",
      "kg/min",
      "kg/mol",
      "kg/s",
      "kg/m3"
    ],
    null,
    [
      [
        "kg",
        "kilogram",
        ""
      ],
      [
        "kg/L",
        "kilogram per liter",
        ""
      ],
      [
        "kg/h",
        "kilogram per hour",
        ""
      ],
      [
        "kg/min",
        "kilogram per minute",
        ""
      ],
      [
        "kg/mol",
        "kilogram per mole",
        ""
      ],
      [
        "kg/s",
        "kilogram per second",
        ""
      ],
      [
        "kg/m3",
        "kilogram per cubic meter",
        ""
      ]
    ]
  ],
  l: [
    95,
    [
      "l",
      "L",
      "L/L",
      "L/kg",
      "L/s",
      "L/h",
      "L/d"
    ],
    null,
    [
      [
        "l",
        "Liters",
        "Because lower case \"l\" can be read as the number \"1\", though this is a valid UCUM units. UCUM strongly reccomends using  \"L\""
      ],
      [
        "L",
        "Liters",
        "Because lower case \"l\" can be read as the number \"1\", though this is a valid UCUM units. UCUM strongly reccomends using  \"L\""
      ],
      [
        "L/L",
        "Liters per liter",
        ""
      ],
      [
        "L/kg",
        "Liters per kilogram",
        ""
      ],
      [
        "L/s",
        "Liters per second",
        "unit used often to measure gas flow and peak expiratory flow"
      ],
      [
        "L/h",
        "Liters per hour",
        ""
      ],
      [
        "L/d",
        "Liters per day",
        ""
      ]
    ]
  ],

  m: [
    373,
    [
      "m",
      "m[IU]/L",
      "m2",
      "m[H2O]",
      "m[Hg]",
      "m/s",
      "meq/m2"
    ],
    null,
    [
      [
        "m",
        "meter",
        "unit of length = 1.09361 yards"
      ],
      [
        "m[IU]/L",
        "milli international unit per liter",
        "International units (IU) are analyte and reference specimen  specific arbitrary units (held at WHO)"
      ],
      [
        "m2",
        "square meter",
        "unit often used to represent body surface area"
      ],
      [
        "m[H2O]",
        "meter of water column",
        ""
      ],
      [
        "m[Hg]",
        "meter of mercury column",
        ""
      ],
      [
        "m/s",
        "meter per second",
        "unit of velocity"
      ],
      [
        "meq/m2",
        "milliequivalent per square meter",
        "equivalence equals moles per valence; note that the use of m2 in clinical units ofter refers to body surface area"
      ]
    ]
  ],
  "mean gregorian year": [
    1,
    [
      "a_g"
    ],
    null,
    [
      [
        "a_g",
        "mean Gregorian year",
        "has an average of 365.2425 days and is the most internationally used civil calendar."
      ]
    ]
  ],
  s: [
    122,
    [
      "S",
      "s",
      "sb",
      "sph",
      "sr",
      "St",
      "st"
    ],
    null,
    [
      [
        "S",
        "siemens",
        "unit of electric conductance (the inverse of electrical resistance) equal to ohm^-1"
      ],
      [
        "s",
        "second - time",
        ""
      ],
      [
        "sb",
        "stilb",
        "unit of luminance; equal to and replaced by unit candela per square centimeter (cd/cm2)"
      ],
      [
        "sph",
        "spere - solid angle",
        "equal to the solid angle of an entire sphere = 4πsr (sr = steradian) "
      ],
      [
        "sr",
        "steradian - solid angle",
        "unit of solid angle in three-dimensional geometry analagous to radian; used in photometry which measures the perceived brightness of object by human eye (e.g. radiant intensity = watt/steradian)"
      ],
      [
        "St",
        "Stokes",
        "unit of kimematic viscosity with units cm2/s"
      ],
      [
        "st",
        "stere",
        "equal to one cubic meter, usually used for measuring firewood"
      ]
    ]
  ],
  st: [
    14,
    [
      "St",
      "st",
      "[g]",
      "[mi_br]",
      "[mi_i]",
      "[mi_us]",
      "[stone_av]"
    ],
    null,
    [
      [
        "St",
        "Stokes",
        "unit of kimematic viscosity with units cm2/s"
      ],
      [
        "st",
        "stere",
        "equal to one cubic meter, usually used for measuring firewood"
      ],
      [
        "[g]",
        "standard acceleration of free fall",
        "defined by standard = 9.80665 m/s2"
      ],
      [
        "[mi_br]",
        "mile - British",
        ""
      ],
      [
        "[mi_i]",
        "mile",
        "standard unit used in the US and internationally"
      ],
      [
        "[mi_us]",
        "mile - US",
        "Better to use [mi_i] which refers to the length used worldwide, including in the US"
      ],
      [
        "[stone_av]",
        "stone - British",
        "Used primarily in the UK and Ireland to measure body weight"
      ]
    ]
  ],
  oz: [
    8,
    [
      "[oz_ap]",
      "[oz_av]",
      "[oz_m]",
      "[oz_tr]",
      "kcal/[oz_av]",
      "[foz_br]",
      "[foz_m]"
    ],
    null,
    [
      [
        "[oz_ap]",
        "ounce - apothecary",
        ""
      ],
      [
        "[oz_av]",
        "ounce",
        "standard unit used in the US and internationally"
      ],
      [
        "[oz_m]",
        "ounce - metric",
        "see [oz_av] (the avoirdupois ounce) for the standard ounce used internationally; [oz_m] is equal to 28 grams and is based on the apothecaries' system of mass units which is used in some US pharmacies. "
      ],
      [
        "[oz_tr]",
        "ounce - troy",
        "unit of mass for precious metals and gemstones only"
      ],
      [
        "kcal/[oz_av]",
        "kilocalorie per ounce",
        "used in nutrition to represent calorie of food"
      ],
      [
        "[foz_br]",
        "fluid ounce - British",
        "Used only in Great Britain and other Commonwealth countries"
      ],
      [
        "[foz_m]",
        "fluid ounce - metric",
        "unit used only in the US for nutritional labelling, as set by the FDA"
      ]
    ]
  ]
};
