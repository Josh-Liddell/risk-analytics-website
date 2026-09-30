"""Build src/data/federal-funds.json from the Federalism Commission workbook.

The workbook stays in the gitignored data/ folder; only the aggregated JSON is committed.
Every published figure is recomputed from the raw SEFA and COBI tabs (not from Excel's
cached formula results) and checked against the values the team signed off on.

Usage:
    python3 scripts/build_federal_funds.py [path/to/workbook.xlsx]

Requires openpyxl (pip3 install openpyxl).
"""

import json
import re
import sys
import warnings
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "data" / "Federalism Commission Brendan Dataset.xlsx"
OUTPUT = ROOT / "src" / "data" / "federal-funds.json"

CUT_SCENARIOS = [0.10, 0.25, 0.50]
HIGH_EXPOSURE = 0.50
MODERATE_EXPOSURE = 0.25
TOP_AREAS = 5

# Public-facing labels for SEFA federal granting agencies. Anything not listed keeps its SEFA name.
AREA_LABELS = {
    "Department of Health and Human Services": "Health & Human Services",
    "Department of Education": "Education",
    "Department of Agriculture": "Food Assistance & Agriculture",
    "Department of Transportation": "Transportation",
    "Department of Labor": "Labor & Workforce",
}

# Grouping by granting agency alone would mislead for these clusters.
AREA_OVERRIDES = {
    "Child Nutrition Cluster": {
        "area": "Education",
        "note": "Includes USDA-funded school meal programs (Child Nutrition Cluster).",
    },
}

# Values approved in the 2026-09-29 data source decision. A mismatch means the workbook changed.
EXPECTED = {
    "sefa_line_items": 2008,
    "sefa_total": 10_480_498_629,
    "sefa_ex_covid": 9_687_495_358,
    "sefa_negative_lines": 89,
    "sefa_negative_net": -19_844_137,
    "cobi_all_funds": 32_486_384_400,
    "cobi_federal": 9_115_438_500,
    "cobi_own_source": 23_370_945_900,
    "top10_total": 6_225_717_250,
    "top10_hhi": 3692.92,
    "agencies": 19,
}


def fail(message):
    sys.exit(f"ERROR: {message}")


def check(label, actual, expected, tolerance=0):
    if abs(actual - expected) > tolerance:
        fail(f"{label} is {actual:,}, expected {expected:,}")


def money(value):
    """COBI money cells mix numbers, blanks and '-' (zero)."""
    if value is None or (isinstance(value, str) and value.strip() in {"", "-"}):
        return 0
    if isinstance(value, str):
        fail(f"unexpected text in a money column: {value!r}")
    return value


def normalize_aln(value):
    """ALNs are identifiers: 84.01 in the sheet means 84.010."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return str(int(value)) if float(value).is_integer() else f"{value:.3f}"
    return str(value).strip()


def clean_name(text):
    """PDF extraction sometimes repeats a name: 'University of Utah University of Utah'."""
    match = re.fullmatch(r"(.+?)(?: \1)+", text.strip())
    return match.group(1) if match else text.strip()


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def read_rows(ws, first_row, last_col):
    return [list(r) for r in ws.iter_rows(min_row=first_row, max_col=last_col, values_only=True)]


def load_sefa(wb, report):
    header = [c.value for c in wb["SEFA"][1]]
    expected_header = [
        "Division", "State Agency", "Federal Agency", "Cluster", "ALN", "Federal Program",
        "Award Number", "Pass-Through Entity", "Directly Expended", "Provided to Subrecipients",
        "Negative_Adjustment",
    ]
    if header[: len(expected_header)] != expected_header:
        fail(f"SEFA columns changed: {header}")

    lines = []
    skipped = []
    for row in read_rows(wb["SEFA"], 2, 11):
        division, agency, fed_agency, cluster, aln, program, _award, pass_through, direct, sub, _neg = row
        if program is None and fed_agency is None:
            if any(v is not None for v in row):
                skipped.append(row)
            continue
        lines.append({
            "division": division,
            "stateAgency": agency,
            "federalAgency": fed_agency,
            "cluster": cluster,
            "aln": normalize_aln(aln),
            "program": program,
            "passThrough": pass_through is not None,
            "direct": direct or 0,
            "sub": sub or 0,
        })

    report.append(f"SEFA: {len(lines):,} award lines; skipped {len(skipped)} non-award row(s): {skipped}")
    for field in ["division", "stateAgency", "federalAgency", "cluster", "aln", "program"]:
        blanks = sum(1 for line in lines if line[field] in (None, ""))
        report.append(f"  blank {field}: {blanks}")
    alns_as_text = sum(1 for r in read_rows(wb["SEFA"], 2, 5) if isinstance(r[4], str))
    report.append(f"  ALNs stored as text (e.g. '84.425U'): {alns_as_text}")
    return lines


def load_cobi(wb, report):
    rows = read_rows(wb["COBI_Budget_Data"], 2, 8)
    grand, body = rows[0], rows[1:]
    if grand[0] != "Grand Total":
        fail(f"COBI row 2 should be the Grand Total row, found {grand[0]!r}")

    dash_cells = sum(1 for r in body for v in r[4:8] if isinstance(v, str) and v.strip() == "-")
    garbled = sorted({r[0] for r in body if r[0] and re.search(r"(?:\b\w ){3,}", r[0])})
    truncated = sum(1 for r in body for v in r[1:3] if isinstance(v, str) and v.endswith(".."))
    duplicates = len(body) - len({tuple(r) for r in body})
    report.append(f"COBI: {len(body):,} budget lines; '-' used for zero in {dash_cells:,} money cells")
    report.append(f"  truncated labels ('..'): {truncated}; exact duplicate lines: {duplicates}")
    report.append(f"  garbled PDF agency names: {len(garbled)}")

    lines = [
        {
            "agency": r[0],
            "fund": r[3] or "",
            "oneTime2026": money(r[4]),
            "oneTime2027": money(r[5]),
            "ongoing": money(r[6]),
            "total": money(r[7]),
        }
        for r in body
    ]
    line_sum = sum(line["total"] for line in lines)
    report.append(f"  sum of lines {line_sum:,} vs Grand Total row {money(grand[7]):,}")
    return lines, money(grand[7])


def load_inputs(wb):
    ws = wb["Master_Data"]
    fiscal_year = ws["B3"].value
    keywords = [ws.cell(r, 16).value for r in range(7, 12) if ws.cell(r, 16).value]
    top10 = []
    for r in range(7, 17):
        group, cluster, aln = (ws.cell(r, c).value for c in (18, 19, 20))
        if group:
            top10.append({"group": group, "cluster": cluster, "aln": normalize_aln(aln)})
    if len(top10) != 10:
        fail(f"expected 10 Top-10 program mappings in Master_Data R7:T16, found {len(top10)}")
    return fiscal_year, keywords, top10


def load_crosswalk(wb):
    ws = wb["Overiview Sefa vs. Cobi"]
    header_row = next(
        (r for r in range(1, ws.max_row + 1) if ws.cell(r, 1).value == "SEFA Agency Name"), None
    )
    if header_row is None:
        fail("could not find the SEFA/COBI agency name table in the Overview tab")
    pairs = []
    for r in range(header_row + 1, ws.max_row + 1):
        sefa_name = ws.cell(r, 1).value
        if not sefa_name or str(sefa_name).startswith("Subtotal"):
            break
        cobi_names = [n for n in (ws.cell(r, 2).value, ws.cell(r, 3).value) if n]
        pairs.append((sefa_name, cobi_names))
    return pairs


def build_programs(sefa, keywords, top10):
    programs = defaultdict(lambda: {"direct": 0, "sub": 0, "records": 0})
    for line in sefa:
        key = (line["federalAgency"], line["cluster"], line["aln"], line["program"])
        p = programs[key]
        p["direct"] += line["direct"]
        p["sub"] += line["sub"]
        p["records"] += 1

    by_cluster = {m["cluster"]: m["group"] for m in top10 if m["cluster"]}
    by_aln = {m["aln"]: m["group"] for m in top10 if m["aln"]}
    lowered = [k.lower() for k in keywords]

    result = []
    for (fed_agency, cluster, aln, name), p in programs.items():
        searchable = f"{name} | {cluster or ''}".lower()
        result.append({
            "aln": aln,
            "name": name,
            "federalAgency": fed_agency,
            "cluster": cluster,
            "directlyExpended": p["direct"],
            "toSubrecipients": p["sub"],
            "total": p["direct"] + p["sub"],
            "covidEra": any(k in searchable for k in lowered),
            "top10Group": by_cluster.get(cluster) or by_aln.get(aln),
        })
    result.sort(key=lambda p: -p["total"])
    return result


def build_areas(programs, sefa_total):
    areas = defaultdict(lambda: {"total": 0, "federalAgencies": set(), "notes": set()})
    for p in programs:
        override = AREA_OVERRIDES.get(p["cluster"])
        label = override["area"] if override else AREA_LABELS.get(p["federalAgency"], p["federalAgency"])
        area = areas[label]
        area["total"] += p["total"]
        area["federalAgencies"].add(p["federalAgency"])
        if override:
            area["notes"].add(override["note"])

    ranked = sorted(areas.items(), key=lambda kv: -kv[1]["total"])
    top, rest = ranked[:TOP_AREAS], ranked[TOP_AREAS:]
    out = [
        {
            "id": slugify(label),
            "label": label,
            "total": a["total"],
            "share": round(a["total"] / sefa_total, 6),
            "federalAgencies": sorted(a["federalAgencies"]),
            "note": " ".join(sorted(a["notes"])) or None,
        }
        for label, a in top
    ]
    rest_total = sum(a["total"] for _, a in rest)
    out.append({
        "id": "other",
        "label": f"All other federal agencies ({len(rest)})",
        "total": rest_total,
        "share": round(rest_total / sefa_total, 6),
        "federalAgencies": sorted({f for _, a in rest for f in a["federalAgencies"]}),
        "note": None,
    })
    return out


def build_stress_tests(programs, sefa_total):
    groups = defaultdict(lambda: {"base": 0, "covid": 0})
    for p in programs:
        if p["top10Group"]:
            groups[p["top10Group"]]["base"] += p["total"]
            if p["covidEra"]:
                groups[p["top10Group"]]["covid"] += p["total"]

    top10_total = sum(g["base"] for g in groups.values())
    hhi = sum((g["base"] / top10_total) ** 2 for g in groups.values()) * 10_000
    tests = [
        {
            "group": name,
            "base": g["base"],
            "covidEra": g["covid"],
            "shareOfSefa": round(g["base"] / sefa_total, 6),
            "impacts": [{"cutPct": c, "loss": round(g["base"] * c)} for c in CUT_SCENARIOS],
        }
        for name, g in sorted(groups.items(), key=lambda kv: -kv[1]["base"])
    ]
    return tests, top10_total, hhi


def build_agencies(crosswalk, sefa, cobi):
    sefa_by_agency = defaultdict(int)
    division_by_agency = {}
    for line in sefa:
        sefa_by_agency[line["stateAgency"]] += line["direct"] + line["sub"]
        division_by_agency[line["stateAgency"]] = line["division"]

    cobi_total, cobi_fed = defaultdict(int), defaultdict(int)
    for line in cobi:
        cobi_total[line["agency"]] += line["total"]
        if line["fund"].lower().startswith("federal funds"):
            cobi_fed[line["agency"]] += line["total"]

    agencies = []
    for sefa_name, cobi_names in crosswalk:
        if sefa_name not in sefa_by_agency:
            fail(f"agency {sefa_name!r} from the Overview name table is not in SEFA")
        total = sum(cobi_total[n] for n in cobi_names)
        federal = sum(cobi_fed[n] for n in cobi_names)
        pct = federal / total if total > 0 else None
        tier = "High" if (pct or 0) >= HIGH_EXPOSURE else "Moderate" if (pct or 0) >= MODERATE_EXPOSURE else "Low"
        name = clean_name(cobi_names[0])
        agencies.append({
            "id": slugify(name),
            "name": name,
            "sefaName": sefa_name,
            "cobiName": cobi_names[0],
            "division": division_by_agency[sefa_name],
            "cobiTotalBudget": total,
            "cobiFederalFunds": federal,
            "cobiFederalPct": round(pct, 6) if pct is not None else None,
            "sefaFederalExpenditures": sefa_by_agency[sefa_name],
            "tier": tier,
        })
    agencies.sort(key=lambda a: -(a["cobiFederalPct"] or 0))
    return agencies


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not source.exists():
        fail(f"workbook not found at {source}")

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        wb = openpyxl.load_workbook(source, data_only=True)

    report = []
    sefa = load_sefa(wb, report)
    cobi, cobi_all_funds = load_cobi(wb, report)
    fiscal_year, keywords, top10 = load_inputs(wb)
    crosswalk = load_crosswalk(wb)

    check("SEFA award lines", len(sefa), EXPECTED["sefa_line_items"])
    sefa_total = sum(line["direct"] + line["sub"] for line in sefa)
    check("SEFA federal total", sefa_total, EXPECTED["sefa_total"])

    negatives = [line["direct"] + line["sub"] for line in sefa if line["direct"] + line["sub"] < 0]
    check("SEFA negative lines", len(negatives), EXPECTED["sefa_negative_lines"])
    check("SEFA negative net", sum(negatives), EXPECTED["sefa_negative_net"])

    programs = build_programs(sefa, keywords, top10)
    sefa_ex_covid = sum(p["total"] for p in programs if not p["covidEra"])
    check("SEFA ex-COVID total", sefa_ex_covid, EXPECTED["sefa_ex_covid"])

    check("COBI all funds", cobi_all_funds, EXPECTED["cobi_all_funds"])
    cobi_federal = sum(line["total"] for line in cobi if line["fund"].lower().startswith("federal funds"))
    check("COBI federal funds", cobi_federal, EXPECTED["cobi_federal"])
    cobi_own_source = cobi_all_funds - cobi_federal
    check("COBI own-source", cobi_own_source, EXPECTED["cobi_own_source"])

    stress_tests, top10_total, hhi = build_stress_tests(programs, sefa_total)
    check("Top 10 total", top10_total, EXPECTED["top10_total"])
    check("Top 10 HHI", round(hhi, 2), EXPECTED["top10_hhi"], tolerance=0.01)

    agencies = build_agencies(crosswalk, sefa, cobi)
    check("matched agencies", len(agencies), EXPECTED["agencies"])
    if agencies[0]["id"] != "veterans-and-military-affairs":
        fail(f"most exposed agency is {agencies[0]['name']!r}, expected Veterans and Military Affairs")
    check("Veterans and Military Affairs federal %", round(agencies[0]["cobiFederalPct"], 4), 0.8658)

    pass_through = sum(line["direct"] + line["sub"] for line in sefa if line["passThrough"])
    subrecipients = sum(line["sub"] for line in sefa)
    by_division = defaultdict(int)
    for line in sefa:
        by_division[line["division"]] += line["direct"] + line["sub"]

    dataset = {
        "meta": {
            "sefaFiscalYear": fiscal_year,
            "cobiBudgetPeriod": "FY2026–27",
            "sources": {
                "sefa": "Schedule of Expenditures of Federal Awards (audited actual federal spending)",
                "cobi": "Legislature's appropriations budget (all fund sources)",
            },
            "caveats": [
                "SEFA and COBI cover different periods and concepts (actual spending vs. appropriated "
                "budget authority); their federal totals differ by about 6–15% and that gap is expected.",
                "Only one year of data is available, so no year-over-year trends are shown.",
                "Stress tests are flat percentage cuts, not a probability model or forecast.",
                "Universities show little federal money in COBI because research and student aid are "
                "largely outside the appropriations process.",
            ],
            "cutScenarios": CUT_SCENARIOS,
            "exposureThresholds": {"high": HIGH_EXPOSURE, "moderate": MODERATE_EXPOSURE},
        },
        "headline": {
            "sefaFederalTotal": sefa_total,
            "sefaFederalExCovid": sefa_ex_covid,
            "sefaCovidEra": sefa_total - sefa_ex_covid,
            "cobiAllFunds": cobi_all_funds,
            "cobiFederalFunds": cobi_federal,
            "cobiOwnSource": cobi_own_source,
            "ownSourceDependency": round(sefa_total / cobi_own_source, 6),
            "ownSourceDependencyExCovid": round(sefa_ex_covid / cobi_own_source, 6),
            "allFundsFederalShare": round(cobi_federal / cobi_all_funds, 6),
            "top10Total": top10_total,
            "top10Share": round(top10_total / sefa_total, 6),
            "top10Hhi": round(hhi, 1),
            "toSubrecipients": subrecipients,
            "viaPassThrough": pass_through,
            "byDivision": dict(sorted(by_division.items())),
        },
        "areas": build_areas(programs, sefa_total),
        "agencies": agencies,
        "stressTests": stress_tests,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(dataset, indent=2, ensure_ascii=False) + "\n")

    print("\n".join(report))
    print(f"\nAll checks passed. Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
