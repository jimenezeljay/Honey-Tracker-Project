// "Go deeper" sources on the Learn page, plus the statistic on the "Why purity matters" tab.
//
// TO SWAP A SOURCE: edit, add or remove an entry below. learn.js builds the cards from
// this list, so no HTML changes are needed. Keep every field filled in so the team can
// see where each claim comes from and when someone last checked it.
//
//   id       short name used in code (the purity stat points at 'jrc-2023')
//   kind     small label above the title on the card
//   title    the source's own title
//   publisher, date   shown under the title (leave date '' if the source has none)
//   url      link that opens in a new tab
//   why      what it supports on our site (for the team; not shown on the page)
//   checked  when someone last opened the link and confirmed it says what we claim
//
// Sources chosen and checked Oct 23, 2026 (reviewed by Seamus). Testing source swapped Oct 24, 2026
// after the Bee Culture article went offline.

const LEARN_SOURCES = [
  {
    id: 'jrc-2023',
    kind: 'EU research',
    title: 'Food fraud: How genuine is your honey?',
    publisher: 'European Commission, Joint Research Centre',
    date: 'March 23, 2023',
    url: 'https://joint-research-centre.ec.europa.eu/jrc-news/food-fraud-how-genuine-your-honey-2023-03-23_en',
    why: 'Experts on adulteration. 320 imported honey samples (Nov 2021 to Feb 2022); 147, or 46%, flagged as suspected of added sugar syrups. Source of the 46% stat on the purity tab.',
    checked: '2026-10-23'
  },
  {
    id: 'tamu-bryant-2010',
    kind: 'Pollen expert',
    title: 'Scientist tracks origins of bootleg honey from China',
    publisher: 'Texas A&M University',
    date: 'April 29, 2010',
    url: 'https://stories.tamu.edu/news/2010/04/29/scientist-tracks-origins-of-bootleg-honey-from-china',
    why: 'How our mission works: palynologist Vaughn Bryant identifies where honey came from by its pollen, and explains that filtering removes that evidence.',
    checked: '2026-10-23'
  },
  {
    id: 'fda-testing-2026',
    kind: 'Testing',
    title: 'FDA Releases FY25 Sampling Results on Economically Motivated Adulteration in Honey',
    publisher: 'U.S. Food and Drug Administration',
    date: 'April 13, 2026',
    url: 'https://www.fda.gov/food/hfp-constituent-updates/fda-releases-fy25-sampling-results-economically-motivated-adulteration-honey',
    why: 'How honey is tested: FDA checked 102 samples (54 U.S., 48 imported) for cheap added syrups using stable carbon isotope ratio analysis; about 4% of each group failed. Replaced the Bee Culture "Two ways to tell" article, which went offline (404) by Oct 24, 2026.',
    checked: '2026-10-24'
  },
  {
    id: 'fda-labeling-2018',
    kind: 'Labeling law',
    title: 'Proper Labeling of Honey and Honey Products',
    publisher: 'U.S. Food and Drug Administration',
    date: 'February 2018',
    url: 'https://www.fda.gov/media/110846/download',
    why: 'Honey with added sweeteners cannot be labeled just "honey". Supports the Pure definition. "Raw" and "pure" have no federal definition, so those are our own standards.',
    checked: '2026-10-23'
  }
];

// The statistic on the "Why purity matters" tab
const PURITY_STAT = {
  value: '46%',
  text: 'of imported honey tested by the EU was suspected of added sugar syrups. Tracing each jar to its hive keeps honey honest.',
  sourceId: 'jrc-2023',
  sourceNote: '320 samples, 2021–22'
};
