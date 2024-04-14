"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "coder",
    salary: 75000,
    equity: 0.5,
    company_handle: "c1"
  };

  const returnedJob = {
    title: "coder",
    salary: 75000,
    equity: "0.5",
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(returnedJob);

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'coder'`);
    expect(result.rows).toEqual([
        {
          title: "coder",
          salary: 75000,
          equity: "0.5",
          companyHandle: "c1"
        }
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
          title: "j1",
          salary: 75000,
          equity: "0.5",
          companyHandle: "c1"
        },
      {
          title: "j2",
          salary: 95000,
          equity: "0.5",
          companyHandle: "c2"
        },
      {
          title: "j3",
          salary: 175000,
          equity: "0.5",
          companyHandle: "c3"
        }]);
    });
  }
)

  // test("works: with filter", async function () {
  //   let companies = await Company.findAll({minEmployees: 1, maxEmployees: 2});
  //   expect(companies).toEqual([
  //     {
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     },
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     }
  //   ]);
  // });

//   test("with filter: throws error if minEmployees is greater than maxEmployees", async function(){
//     try {
//       let companies = await Company.findAll({minEmployees: 3, maxEmployees: 1});
//       fail();
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   })
// });

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j1");
    expect(job).toEqual({
          title: "j1",
          salary: 75000,
          equity: "0.5",
          companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "newTitle", 
    salary: 300000, 
    equity: 1.0
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      title: "newTitle",
      salary: 300000, 
      equity: "1",
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'newTitle'`);
    expect(result.rows).toEqual([{
      title: "newTitle",
      salary: 300000, 
      equity: "1",
      companyHandle: "c1"
    }]);
  });

  test("works: partial update", async function () {
    const updatePartialData = {
      salary: 300000
    };

    let job = await Job.update("j1", updatePartialData);
    expect(job).toEqual({
      title: "j1",
      salary: 300000,
      equity: "0.5",
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'j1'`);
    expect(result.rows).toEqual([{
      title: "j1",
      salary: 300000,
      equity: "0.5",
      companyHandle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("j1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const res = await Job.remove("j1");
    expect(res).toEqual({Deleted: "j1"});
  });

  test("not found if no such job", async function () {
    try {
      const res = await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
