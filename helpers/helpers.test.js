"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, filterCompBy, filterJobBy } = require("./sql.js");

/***************************************/

describe("sqlForPartialUpdate", function () {
  const dataToUpdate = {
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  const jsToSql= {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        }

  test("works", async function () {
    let { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(setCols).toEqual(
        '"description"=$1, "num_employees"=$2, "logo_url"=$3'
    );
    expect(values).toEqual(["New Description", 1, "http://new.img"]);
  });

  test("throws error when no update data is provided", async function () {
    try {
      let { setCols, values } = sqlForPartialUpdate("", jsToSql);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
})

describe("filterCompBy", function () {
  const allFilterData = {
    name: "dav",
    minEmployees: 1,
    maxEmployees: 10,
  };

  const minMaxFilterData = {
    minEmployees: 1,
    maxEmployees: 10
  };

  const maxFilterData = {
    maxEmployees: 10
  };

  test("works when all filters applied", async function () {
    let { filterCols, values } = filterCompBy(allFilterData);
    expect(filterCols).toEqual(
        '"name" ILIKE $1 AND "num_employees" >= $2 AND "num_employees" <= $3'
    );
    expect(values).toEqual(["%dav%", 1, 10]);
  });

  test("works when only min and max filters applied", async function () {
    let { filterCols, values } = filterCompBy(minMaxFilterData);
    expect(filterCols).toEqual(
        '"num_employees" >= $1 AND "num_employees" <= $2'
    );
    expect(values).toEqual([1, 10]);
  });

  test("works when only max filter is applied", async function () {
    let { filterCols, values } = filterCompBy(maxFilterData);
    expect(filterCols).toEqual(
        '"num_employees" <= $1'
    );
    expect(values).toEqual([10]);
  });

  test("throws error when no inappropriate data is provided", async function () {
    try {
      let { setCols, values } = filterCompBy({notAnAppropriateFilter: "irrelevant"});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
})

describe("filterJobBy", function () {
  const allFilterData = {
    title: "job",
    minSalary: 90000,
    hasEquity: true
  };

  const falseEquityFilterData = {
    minSalary: 90000,
    hasEquity: false
  };

  const minSalaryOnlyFilterData = {
    minSalary: 90000
  };

  test("works when all filters applied", async function () {
    let { filterCols, values } = filterJobBy(allFilterData);
    expect(filterCols).toEqual(
        '"title" ILIKE $1 AND "salary" >= $2 AND "equity" > 0'
    );
    expect(values).toEqual(["%job%", 90000]);
  });

  test("works when hasEquity is set to false and one other filter is applied", async function () {
    let { filterCols, values } = filterJobBy(falseEquityFilterData);
    expect(filterCols).toEqual(
        '"salary" >= $1'
    );
    expect(values).toEqual([90000]);
  });

  test("works when only one filter is applied", async function () {
    let { filterCols, values } = filterJobBy(minSalaryOnlyFilterData);
    expect(filterCols).toEqual(
        '"salary" >= $1'
    );
    expect(values).toEqual([90000]);
  });

  test("throws error when no inappropriate data is provided", async function () {
    try {
      let { setCols, values } = filterJobBy({notAnAppropriateFilter: "irrelevant"});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
})