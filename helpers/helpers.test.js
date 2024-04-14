"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, filterCompBy } = require("./sql.js");

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