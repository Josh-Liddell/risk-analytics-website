import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Tooltip } from '@utahdts/utah-design-system';
import {
  agencies,
  areas,
  formatMoney,
  formatPercent,
  headline,
  meta,
  stressTests,
} from '../../config/federalFunds';

import { Hero } from '../Hero';
import { FederalTimeline } from '../FederalTimeline';

const EXPOSED_AGENCIES_SHOWN = 10;

const TIER_TAG_CLASS = {
  High: 'tag--primary-color',
  Moderate: 'tag--primary-color-light',
  Low: undefined,
};

function ShareBar({ value, max }) {
  return (
    <span className="dashboard__bar-track">
      <span className="dashboard__bar-fill" style={{ width: `${(value / max) * 100}%` }} />
    </span>
  );
}

function StatCard({ id, label, value, note, math, primary = false }) {
  const [card, setCard] = useState(null);
  return (
    <>
      <div
        ref={setCard}
        className={`card dashboard__stat${primary ? ' dashboard__stat--primary' : ''}`}
        tabIndex={0}
        aria-describedby={`${id}-math`}
      >
        <div className="dashboard__stat-label utds-icon-after-info">{label}</div>
        <div className="dashboard__stat-value">{value}</div>
        <div className="dashboard__stat-note">{note}</div>
      </div>
      <Tooltip referenceElement={card} placement="bottom" className="dashboard__tooltip">
        <div id={`${id}-math`} className="dashboard__math">
          <div className="dashboard__math-title">How this is calculated</div>
          {math.lines.map((line, index) => (
            <div key={line.label}>
              {index > 0 && <div className="dashboard__math-op">{math.operator}</div>}
              <div className="dashboard__math-row">
                <span>{line.label}</span>
                <strong>{line.amount}</strong>
              </div>
            </div>
          ))}
          <div className="dashboard__math-result">= {value}</div>
          {math.footnote && <p className="dashboard__math-note">{math.footnote}</p>}
        </div>
      </Tooltip>
    </>
  );
}

export function HomeLanding() {
  const [cut, setCut] = useState(meta.cutScenarios[1]);
  const largestArea = Math.max(...areas.map((area) => area.share));
  const exposed = agencies.slice(0, EXPOSED_AGENCIES_SHOWN);
  const lossAt = (test) => test.impacts.find((impact) => impact.cutPct === cut).loss;
  const totalLoss = stressTests.reduce((sum, test) => sum + lossAt(test), 0);
  const areaNotes = areas.filter((area) => area.note);

  return (
    <main id="main-content" className="dashboard">
      <Hero />
      <div className="dashboard__notice">
        <div className="banner__wrapper banner--inline banner--accent-light">
          <div className="banner__message">
            <strong>Preliminary figures.</strong>
            Built from Utah&apos;s {meta.sefaFiscalYear} federal awards schedule and financial report, and the
            {' '}Legislature&apos;s {meta.cobiBudgetPeriod} budget. Not yet reviewed for publication.
          </div>
        </div>
      </div>

      <div className="dashboard__content">
        <div className="dashboard__intro">
          <div className="dashboard__eyebrow">State of Utah · Federal funds · {meta.sefaFiscalYear}</div>
          <h1>How dependent is Utah on federal money?</h1>
          <p>
            How much federal money Utah state government spends, which programs and agencies depend on it,
            and what a cut would cost.
          </p>
        </div>

        <div className="dashboard__stats">
          <StatCard
            id="stat-dependency"
            primary
            label="Federal dependency"
            value={formatPercent(headline.ownSourceDependency)}
            note={`Federal dollars spent for every dollar of Utah's own money, ${meta.sefaFiscalYear}. ${formatPercent(headline.ownSourceDependencyExCovid)} excluding COVID-era funds.`}
            math={{
              operator: '÷',
              lines: [
                {
                  label: `Federal money state agencies, colleges, and universities spent in ${meta.sefaFiscalYear}`,
                  amount: formatMoney(headline.sefaFederalTotal),
                },
                {
                  label: `Everything else they spent that year: ${formatMoney(headline.acfrTotalSpending)} in total spending minus the federal part`,
                  amount: formatMoney(headline.acfrOwnSource),
                },
              ],
              footnote: `Both figures are audited ${meta.acfrFiscalYear} spending. Federal money was ${formatPercent(headline.federalShareOfSpending)} of all spending. Leaving out ${formatMoney(headline.sefaCovidEra)} in COVID-era relief gives ${formatPercent(headline.ownSourceDependencyExCovid)}.`,
            }}
          />
          <StatCard
            id="stat-budget-share"
            label="Share of total appropriated budget"
            value={formatPercent(headline.allFundsFederalShare)}
            note={`${formatMoney(headline.cobiFederalFunds)} federal of ${formatMoney(headline.cobiAllFunds)}, ${meta.cobiBudgetPeriod}`}
            math={{
              operator: '÷',
              lines: [
                {
                  label: `Federal funds in the ${meta.cobiBudgetPeriod} state budget`,
                  amount: formatMoney(headline.cobiFederalFunds),
                },
                {
                  label: `The entire ${meta.cobiBudgetPeriod} state budget, from all sources`,
                  amount: formatMoney(headline.cobiAllFunds),
                },
              ],
              footnote: 'Both figures come from the Legislature\'s budget, so this compares like with like.',
            }}
          />
          <StatCard
            id="stat-top-ten"
            label="Top 10 federal programs"
            value={formatPercent(headline.top10Share)}
            note={`of all federal dollars. Concentration index ${Math.round(headline.top10Hhi).toLocaleString()} (above 2,500 is highly concentrated).`}
            math={{
              operator: '÷',
              lines: [
                {
                  label: 'Federal money spent through the 10 largest programs',
                  amount: formatMoney(headline.top10Total),
                },
                {
                  label: `All federal money spent in ${meta.sefaFiscalYear}`,
                  amount: formatMoney(headline.sefaFederalTotal),
                },
              ],
              footnote: `The concentration index squares each top program's share of the top-10 total and adds them up. Higher means a few programs, led by ${stressTests[0].group}, hold most of the money.`,
            }}
          />
          <StatCard
            id="stat-federal-spending"
            label="Federal spending"
            value={formatMoney(headline.sefaFederalTotal)}
            note={`Audited, ${meta.sefaFiscalYear}. Includes ${formatMoney(headline.sefaCovidEra)} in COVID-era funds.`}
            math={{
              operator: '+',
              lines: [
                {
                  label: 'Spent directly by state agencies',
                  amount: formatMoney(headline.sefaFederalTotal - headline.toSubrecipients),
                },
                {
                  label: 'Passed on to local governments, schools, and other organizations',
                  amount: formatMoney(headline.toSubrecipients),
                },
              ],
              footnote: `Adds up every federal award in the state's ${meta.sefaFiscalYear} federal spending audit.`,
            }}
          />
        </div>

        <div className="dashboard__split">
          <div>
            <h2>Federal spending by granting agency</h2>
            <p className="dashboard__subtitle">{meta.sefaFiscalYear}, grouped by the federal agency that awarded the funds.</p>
            <div className="table__wrapper table__wrapper--full-width">
              <table className="table table--lines-x table--full-width table--v-align-center">
                <thead>
                  <tr>
                    <th scope="col">Area</th>
                    <th scope="col" className="dashboard__share-col">Share</th>
                    <th scope="col" className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.id}>
                      <td className="dashboard__row-label">
                        {area.label}
                        {area.note && <sup aria-hidden="true">*</sup>}
                      </td>
                      <td>
                        <div className="dashboard__bar">
                          <ShareBar value={area.share} max={largestArea} />
                          <span className="dashboard__bar-pct">{formatPercent(area.share, 0)}</span>
                        </div>
                      </td>
                      <td className="dashboard__amount">{formatMoney(area.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {areaNotes.map((area) => (
              <p key={area.id} className="dashboard__footnote">* {area.label}: {area.note}</p>
            ))}
          </div>

          <div className="dashboard__risk">
            <h2>How we measure risk</h2>
            <p>
              Our stress tests apply flat {meta.cutScenarios.map((c) => formatPercent(c, 0)).join(', ')} cuts
              to Utah&apos;s ten largest federal programs to show what each cut would cost. They are not yet a
              probability model or a forecast.
            </p>
            <ol>
              <li>Federal spending from the state&apos;s audited federal awards schedule</li>
              <li>State budget from the Legislature&apos;s appropriations</li>
              <li>Flat cuts applied to the ten largest programs</li>
            </ol>
            <Link to="/about#methodology" className="button button--primary-color button--solid">
              Read the methodology
            </Link>
          </div>
        </div>

        <div>
          <h2>Most exposed state agencies</h2>
          <p className="dashboard__subtitle">
            Federal funds as a share of each agency&apos;s {meta.cobiBudgetPeriod} budget.
            High is {formatPercent(meta.exposureThresholds.high, 0)} or more,
            Moderate is {formatPercent(meta.exposureThresholds.moderate, 0)} or more.
          </p>
          <div className="table__wrapper table__wrapper--full-width">
            <table className="table table--lines-x table--full-width table--v-align-center">
              <thead>
                <tr>
                  <th scope="col">Agency</th>
                  <th scope="col" className="dashboard__share-col">Federal share of budget</th>
                  <th scope="col">Exposure</th>
                  <th scope="col" className="text-right">Federal funds</th>
                </tr>
              </thead>
              <tbody>
                {exposed.map((agency) => (
                  <tr key={agency.id}>
                    <td className="dashboard__row-label">{agency.name}</td>
                    <td>
                      <div className="dashboard__bar">
                        <ShareBar value={agency.cobiFederalPct} max={1} />
                        <span className="dashboard__bar-pct">{formatPercent(agency.cobiFederalPct, 0)}</span>
                      </div>
                    </td>
                    <td>
                      <Tag className={TIER_TAG_CLASS[agency.tier]} size="small">{agency.tier}</Tag>
                    </td>
                    <td className="dashboard__amount">{formatMoney(agency.cobiFederalFunds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="dashboard__section-head">
            <div>
              <h2>Stress test: ten largest federal programs</h2>
              <p className="dashboard__subtitle">Loss to Utah if each program were cut by a flat percentage, at {meta.sefaFiscalYear} spending levels.</p>
            </div>
            <div role="group" aria-label="Cut size" className="dashboard__cuts">
              {meta.cutScenarios.map((scenario) => (
                <button
                  key={scenario}
                  type="button"
                  className={`button button--primary-color${scenario === cut ? ' button--solid' : ''}`}
                  aria-pressed={scenario === cut}
                  onClick={() => setCut(scenario)}
                >
                  {formatPercent(scenario, 0)} cut
                </button>
              ))}
            </div>
          </div>
          <div className="dashboard__impact accent-color-light-background">
            A {formatPercent(cut, 0)} cut to these programs would cost Utah
            {' '}<strong>{formatMoney(totalLoss)}</strong>, which is {formatPercent(totalLoss / headline.cobiOwnSource)} of
            the state&apos;s own-source budget.
          </div>
          <div className="table__wrapper table__wrapper--full-width">
            <table className="table table--lines-x table--full-width table--v-align-center">
              <thead>
                <tr>
                  <th scope="col">Program</th>
                  <th scope="col" className="text-right">{meta.sefaFiscalYear} federal spending</th>
                  <th scope="col" className="text-right">Share of all federal $</th>
                  <th scope="col" className="text-right">Loss at {formatPercent(cut, 0)} cut</th>
                </tr>
              </thead>
              <tbody>
                {stressTests.map((test) => (
                  <tr key={test.group}>
                    <td className="dashboard__row-label">{test.group}</td>
                    <td className="text-right">{formatMoney(test.base)}</td>
                    <td className="text-right">{formatPercent(test.shareOfSefa)}</td>
                    <td className="dashboard__amount">{formatMoney(lossAt(test))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FederalTimeline />

        <div className="dashboard__caveats">
          <h2>About these numbers</h2>
          <ul>
            {meta.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
          </ul>
        </div>
      </div>

      <div className="dashboard__credits">
        <div className="dashboard__credits-inner">
          <div>
            <div className="dashboard__credits-title">Utah Federal Funding Impact</div>
            <div>Analysis by the Utah State University Computational Finance team</div>
          </div>
          <div className="dashboard__credits-links">
            <Link to="/about#methodology">Methodology</Link>
            <Link to="/about">Our team</Link>
            <a href="https://github.com/Josh-Liddell/risk-analytics-website" target="_blank" rel="noreferrer">
              Code repository
              <span className="utds-new-tab-link-a11y">
                <span className="visually-hidden">, opens in a new tab</span>
                <span className="utds-icon-after-external-link" aria-hidden="true"></span>
              </span>
            </a>
            <Link to="/about#contact">Contact</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
