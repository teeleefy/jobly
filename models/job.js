"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, filterJobBy } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle } 
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE title = $1`,
        [title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title, salary, equity, companyHandle
        ],
    );
    const job = result.rows[0];
    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll(filterData) {
    //if there is no data passed into the request body by which to filter the data, proceed with selecting all jobs
    let jobsRes;
    if(!filterData){
          jobsRes = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY id`);}

    // if filterJobBy includes data, alter the db query appropriately to filter the data
    else{
      //call the helper function "filterJobBy" passing in the filterData
      //this will return an appropriate string that can be passed in the sql query after the word "WHERE"-- this will appropriately filter out the sql data
      const { filterCols, values } = filterJobBy(filterData);
      console.log('&&&&&&', filterCols);
      console.log('&&&&&&', values);
      let querySql;
      //this !filterCols is necessary in the event that the only filterData is hasEquity = false;
      //if hasEquity is set to false, then the fx filterJobBy will return empty filterCols and values as empty array
      //if those empty values were passed into the "WHERE" portion of the sql query, it will result in an error
      //therefore, this prevents the unnecessary "WHERE" portion of the sql query, and prevents an error
      if(!filterCols){
        querySql = `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs 
           ORDER BY id`;
      } else {
        querySql = `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs 
           WHERE ${filterCols}
           ORDER BY id`;
      }
      jobsRes = await db.query(querySql, [...values]);
    }
      return jobsRes.rows;  
  }
      
    
  /** Given a job title, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(title) {
    const jobRes = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = $1`,
        [title]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle AS "companyHandle"}
   *
   * Throws NotFoundError if not found.
   */

  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const titleVarIdx = "$" + (values.length + 1);
    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE title = ${titleVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, title]);
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${title}`);
    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(title) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE title = $1
           RETURNING title`,
        [title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);
    return {Deleted: title};
  }
}


module.exports = Job;
