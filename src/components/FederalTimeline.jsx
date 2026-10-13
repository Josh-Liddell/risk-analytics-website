import { useMemo, useState } from 'react';
import { EChart } from './EChart';
import { timelineMeta, timelineYears } from '../config/sefaTimeline';

const MODES = [
  { id: 'nominal', label: 'Nominal' },
  { id: 'real', label: `Inflation-adjusted (${timelineMeta.realDollarsYear} $)` },
];

const toBillions = (millions) => millions / 1000;
const shortYear = (year) => `FY${String(year).slice(-2)}`;
const formatBillions = (billions, digits) => `$${billions.toFixed(digits)}B`;

function token(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function yearOverYear(values, index) {
  const previous = values[index - 1];
  if (index === 0 || previous <= 0) return '';
  const change = (values[index] / previous - 1) * 100;
  return ` (${change > 0 ? '+' : ''}${change.toFixed(1)}% vs. prior year)`;
}

function annotations(totals) {
  const loanJumps = timelineYears.map((y, i) => (i === 0 ? 0 : y.loanPrograms - timelineYears[i - 1].loanPrograms));
  const loanYear = loanJumps.indexOf(Math.max(...loanJumps));
  const covidYear = timelineYears.findIndex((y) => y.covidRelief > 0);
  const peakYear = totals.indexOf(Math.max(...totals));
  return [
    {
      index: loanYear,
      text: `Loan balances added to SEFA (~${formatBillions(toBillions(timelineYears[loanYear].loanPrograms), 1)})`,
      position: 'top',
    },
    { index: covidYear, text: 'COVID relief begins', position: 'right' },
    { index: peakYear, text: `Peak: ${formatBillions(totals[peakYear], 1)}`, position: 'top' },
  ];
}

function buildOption(mode) {
  const colors = {
    total: token('--primary-color'),
    totalDark: token('--primary-color-dark'),
    medicaid: token('--secondary-color'),
    covid: token('--accent-color'),
    loans: token('--gray-color'),
    grid: token('--gray-3-1-contrast'),
  };
  const isReal = mode === 'real';
  const totals = timelineYears.map((y) => toBillions(isReal ? y.totalReal2025 : y.totalNominal));

  const series = [
    {
      name: 'Total federal spending',
      values: totals,
      type: 'line',
      symbol: 'circle',
      symbolSize: 7,
      z: 4,
      lineStyle: { width: 3, color: colors.total },
      itemStyle: { color: colors.total },
      markPoint: {
        symbol: 'circle',
        symbolSize: 11,
        itemStyle: { color: colors.totalDark },
        label: { fontSize: 11, color: colors.totalDark, fontWeight: 600 },
        data: annotations(totals).map(({ index, text, position }) => ({
          coord: [index, totals[index]],
          value: text,
          label: { formatter: text, position },
        })),
      },
    },
  ];

  if (!isReal) {
    series.push(
      {
        name: 'Medicaid',
        values: timelineYears.map((y) => toBillions(y.medicaid)),
        type: 'line',
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: { width: 2.5, type: 'dashed', color: colors.medicaid },
        itemStyle: { color: colors.medicaid },
      },
      {
        name: 'COVID relief',
        values: timelineYears.map((y) => toBillions(y.covidRelief)),
        type: 'line',
        symbol: 'none',
        lineStyle: { width: 1.5, color: colors.covid },
        itemStyle: { color: colors.covid },
        areaStyle: { color: colors.covid, opacity: 0.35 },
      },
      {
        name: 'Loan balances',
        values: timelineYears.map((y) => toBillions(y.loanPrograms)),
        type: 'line',
        symbol: 'triangle',
        symbolSize: 7,
        lineStyle: { width: 2, type: 'dotted', color: colors.loans },
        itemStyle: { color: colors.loans },
      },
    );
  }

  return {
    aria: { enabled: true },
    animation: false,
    grid: { left: 8, right: 24, top: isReal ? 40 : 56, bottom: 8, containLabel: true },
    legend: {
      show: !isReal,
      top: 0,
      left: 0,
      icon: 'roundRect',
      selected: { Medicaid: true, 'COVID relief': false, 'Loan balances': false },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const index = params[0].dataIndex;
        const rows = params.map((p) => {
          const { values } = series[p.seriesIndex];
          return `${p.marker}${p.seriesName}: <strong>${formatBillions(values[index], 2)}</strong>`
            + yearOverYear(values, index);
        });
        return [`<strong>FY${timelineYears[index].fiscalYear}</strong>`, ...rows].join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timelineYears.map((y) => shortYear(y.fiscalYear)),
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: { formatter: (value) => formatBillions(value, 1) },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    series: series.map(({ values, ...rest }) => ({ ...rest, data: values })),
  };
}

export function FederalTimeline() {
  const [mode, setMode] = useState('nominal');
  const option = useMemo(() => buildOption(mode), [mode]);

  return (
    <section className="card dashboard__timeline" aria-labelledby="federal-timeline-title">
      <div className="dashboard__section-head">
        <div>
          <h2 id="federal-timeline-title">{timelineMeta.title}</h2>
          <p className="dashboard__subtitle">
            {mode === 'real'
              ? `In ${timelineMeta.realDollarsYear} dollars. Only the total is inflation-adjusted, so the other lines are hidden.`
              : 'Click a legend item to show or hide a line.'}
          </p>
        </div>
        <div role="group" aria-label="Dollar type" className="dashboard__cuts">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`button button--primary-color${mode === id ? ' button--solid' : ''}`}
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard__timeline-chart">
        <EChart option={option} />
      </div>
      <p className="dashboard__footnote">{timelineMeta.footnote}</p>

      <table className="visually-hidden">
        <caption>{timelineMeta.title}, in billions of dollars</caption>
        <thead>
          <tr>
            <th scope="col">Fiscal year</th>
            <th scope="col">Total</th>
            <th scope="col">Total in {timelineMeta.realDollarsYear} dollars</th>
            <th scope="col">Medicaid</th>
            <th scope="col">COVID relief</th>
            <th scope="col">Loan balances</th>
          </tr>
        </thead>
        <tbody>
          {timelineYears.map((y) => (
            <tr key={y.fiscalYear}>
              <th scope="row">FY{y.fiscalYear}</th>
              {[y.totalNominal, y.totalReal2025, y.medicaid, y.covidRelief, y.loanPrograms].map((value, i) => (
                <td key={i}>{formatBillions(toBillions(value), 2)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
