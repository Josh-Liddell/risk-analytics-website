# Federal funding impact on the state of Utah
Developed by the USU computational finance team

<!--## Design system
The site follows the [Utah Design System](https://designsystem.utah.gov). `npm run build` runs `npm run lint` first, which fails on hardcoded colors or pixel font sizes and spacing in `src/styles`; use UDS tokens such as `var(--primary-color)`, `var(--font-size-l)` and `var(--spacing-l)` instead. The full conventions are in `.cursor/rules/utah-design-system.mdc`.

## Updating the data
The dashboard reads `src/data/federal-funds.json`, which is generated from the Federalism Commission workbook.
The workbook itself is kept out of git: place it at `data/Federalism Commission Brendan Dataset.xlsx` (the `data/` folder is gitignored), then run:

```bash
pip3 install openpyxl
npm run data
```

The script recomputes every published figure from the raw SEFA and COBI tabs and stops with an error if a total no longer matches the approved values.-->

```bash
git clone https://github.com/Josh-Liddell/risk-analytics-website.git
cd risk-analytics-website
npm i
npm run dev
```



<!--# Example of Importing the Design System in to a Vite-React Project
The Utah Design System library provides CSS and components to make development easier. This example shows how to import them into a  Vite-React project.

## Documentation

- [![Utah Header Options](https://img.shields.io/badge/Utah_Header_Options_Documentation-blue)](https://designsystem.utah.gov/library/utahHeader)
- [![Getting Started](https://img.shields.io/badge/Getting%20Started-blue)](https://designsystem.utah.gov/resources/gettingStarted)
- [![Design System Website](https://img.shields.io/badge/Design%20System%20Website-blue)](https://designsystem.utah.gov)

## Try-out This Example

```bash
cd examples/design-system/vite-react
npm i
npm run dev
```

## How This App Was Created
```bash
npm create vite@latest
npm i @utahdts/utah-design-system
npm run dev
```-->
