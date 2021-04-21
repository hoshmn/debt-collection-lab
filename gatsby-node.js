const d3 = require("d3");
const { getStateNameForFips, loadCsv, slugify } = require("./scripts/utils");

const MONTH_PARSE = d3.timeParse("%m/%Y");

/**
 * Returns an array of county objects
 * @param {*} data
 * @returns
 */
function getCounties(data) {
  const counties = data.filter((d) => d.geoid.length === 5);
  return counties.map((c) => ({
    ...c,
    state: getStateNameForFips(c.geoid),
    tracts: data.filter(
      (d) => d.geoid.length > 5 && d.geoid.indexOf(c.geoid) === 0
    ),
  }));
}

/**
 * Returns an array of state objects
 * @param {*} data
 * @returns
 */
function getStates(data) {
  const states = data.filter((d) => d.geoid.length === 2);
  return states.map((s) => ({
    ...s,
    counties: data
      .filter((d) => d.geoid.length === 5 && d.geoid.indexOf(s.geoid) === 0)
      .map((c) => ({ ...c, state: s.name })),
  }));
}

/**
 * Creates source nodes for a dataset
 * @param {*} id
 * @param {*} data
 * @param {*} param2
 */
const createSourceNodes = (
  id,
  data,
  { actions, createNodeId, createContentDigest, reporter }
) => {
  const activity = reporter.activityTimer(`created source node for ${id}`);
  activity.start();
  data.forEach((d, i) => {
    const node = {
      ...d,
      id: createNodeId(`${id}-${i}`),
      internal: {
        type: id,
        contentDigest: createContentDigest(d),
      },
    };
    actions.createNode(node);
  });
  activity.end();
};

/**
 * Parses a row from the lawsuits csv
 * @param {object} row
 * @returns {object}
 */
const lawsuitParser = (row) => {
  return {
    geoid: row.id,
    name: row.name,
    lawsuits: Number(row.lawsuits),
    lawsuits_date: MONTH_PARSE(row.lawsuits_date),
    lawsuit_history: row.lawsuit_history
      .split("|")
      .map((v) => ({
        month: v.split(";")[0],
        lawsuits: Number(v.split(";")[1]),
      }))
      .filter((d) => d.month.indexOf("1969") === -1),
    top_collectors: row.collectors.split("|").map((v) => {
      const values = v.split(";");
      return {
        collector: values[0],
        lawsuits: values[1],
        amount: values[2],
      };
    }),
    default_judgement: Number(row.default_judgement),
    no_rep_percent: Number(row.no_rep_percent),
  };
};

const createCountyPages = async ({ graphql, actions }) => {
  const CountyTemplate = require.resolve(
    `./src/lawsuit-tracker/layouts/county/layout.js`
  );
  const { createPage } = actions;
  const result = await graphql(`
    query {
      allCounties {
        nodes {
          geoid
          name
        }
      }
    }
  `);
  const counties = result.data.allCounties.nodes;
  counties.forEach(({ geoid, name }) => {
    if (name) {
      const stateName = getStateNameForFips(geoid);
      const slugStateName = slugify(stateName);
      const pageName = slugify(name);
      createPage({
        path: `/lawsuit-tracker/${slugStateName}/${pageName}/`,
        component: CountyTemplate,
        context: {
          slug: pageName,
          county: name,
          state: stateName,
          geoid: geoid,
        },
      });
    }
  });
};

const createStatePages = async ({ graphql, actions }) => {
  const StateTemplate = require.resolve(
    `./src/lawsuit-tracker/layouts/state/layout.js`
  );
  const { createPage } = actions;
  const result = await graphql(`
    query {
      allStates {
        nodes {
          geoid
          name
        }
      }
    }
  `);
  const states = result.data.allStates.nodes;
  states.forEach(({ geoid, name }) => {
    if (name) {
      const pageName = slugify(name);
      createPage({
        path: `/lawsuit-tracker/${pageName}/`,
        component: StateTemplate,
        context: {
          slug: pageName,
          state: name,
          geoid: geoid,
        },
      });
    }
  });
};

const createLawsuitTrackerIndex = async ({ graphql, actions }) => {
  const IndexTemplate = require.resolve(
    `./src/lawsuit-tracker/layouts/index/layout.js`
  );
  const { createPage } = actions;
  createPage({
    path: `/lawsuit-tracker/`,
    component: IndexTemplate,
    context: {},
  });
};

exports.sourceNodes = async (params) => {
  const data = loadCsv("./static/data/lawsuits.csv", lawsuitParser);
  createSourceNodes("States", getStates(data), params);
  createSourceNodes("Counties", getCounties(data), params);
};

exports.createPages = async ({ graphql, actions }) => {
  await createLawsuitTrackerIndex({ graphql, actions });
  await createStatePages({ graphql, actions });
  await createCountyPages({ graphql, actions });
};
