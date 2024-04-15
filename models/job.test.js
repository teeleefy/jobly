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
    equity: "0.5",
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "coder",
      salary: 75000,
      equity: "0.5",
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'coder'`);
    expect(result.rows).toEqual([
        {
          id: expect.any(Number),
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
            id: expect.any(Number),
            title: "j1",
            salary: 75000,
            equity: "0.5",
            companyHandle: "c1"
          },
        { 
            id: expect.any(Number),
            title: "j2",
            salary: 95000,
            equity: "0.5",
            companyHandle: "c2"
          },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 175000,
            equity: "0.5",
            companyHandle: "c3"
          }]);
      });

    test("works: with filter", async function () {
      await db.query(`
      INSERT INTO jobs(title, salary, equity, company_handle)
           VALUES ('j4', 125000, null, 'c1')`);
      let jobs = await Job.findAll({minSalary: 90000, hasEquity: true});
      expect(jobs).toEqual([
        { 
            id: expect.any(Number),
            title: "j2",
            salary: 95000,
            equity: "0.5",
            companyHandle: "c2"
          },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 175000,
            equity: "0.5",
            companyHandle: "c3"
          }
      ]);
    });

    test("works: with only hasEquity as filter and set to false", async function () {
      await db.query(`
      INSERT INTO jobs(title, salary, equity, company_handle)
           VALUES ('j4', 125000, null, 'c1')`)
      let jobs = await Job.findAll({hasEquity: false});
      expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "j1",
            salary: 75000,
            equity: "0.5",
            companyHandle: "c1"
          },
        { 
            id: expect.any(Number),
            title: "j2",
            salary: 95000,
            equity: "0.5",
            companyHandle: "c2"
          },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 175000,
            equity: "0.5",
            companyHandle: "c3"
          },
        {
            id: expect.any(Number),
            title: "j4",
            salary: 125000,
            equity: null,
            companyHandle: "c1"
          }
      ]);
    });
  }
);

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j1");
    expect(job).toEqual({
          id: expect.any(Number),
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
      id: expect.any(Number),
      title: "newTitle",
      salary: 300000, 
      equity: "1",
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'newTitle'`);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
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
      id: expect.any(Number),
      title: "j1",
      salary: 300000,
      equity: "0.5",
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'j1'`);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
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
