"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql.js");

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

  test("throws error when no update data is passed", async function () {
    try {
      let { setCols, values } = sqlForPartialUpdate("", jsToSql);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
})