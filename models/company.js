"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, filterCompBy } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filterData) {
    //if there is no data passed into the request body by which to filter the data, proceed with selecting all companies
    let companiesRes;
    if(!filterData){
    companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
          }
    //if filterCompBy includes data, alter the db query appropriately to filter the data
    else{
      //if minEmployees is higher than maxEmployees, then the app will throw an error since that is not a possible scenario
      if(filterData.minEmployees > filterData.maxEmployees){
        throw new BadRequestError(`The filter minEmployees cannot by greater than the filter maxEmployees`);
      }
      //call the helper function "filterCompBy" passing in the filterData
      //this will return an appropriate string that can be passed in the sql query after the word "WHERE"-- this will appropriately filter out the sql data
      const { filterCols, values } = filterCompBy(filterData);
      const querySql = `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies 
           WHERE ${filterCols}
           ORDER BY name`;
      companiesRes = await db.query(querySql, [...values]);
    }
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    //builds object in sql that provides company data along with associated jobs
    const companyRes = await db.query(
          `SELECT json_build_object ('handle', handle, 'name',
                  name,
                  'description', description, 'numEmployees',
                  num_employees, 'logoUrl',
                  logo_url, 'jobs', array_agg(json_build_object('id', jobs.id, 'title', jobs.title, 'salary', jobs.salary, 'equity', jobs.equity)))
           FROM companies JOIN jobs ON companies.handle = jobs.company_handle
           WHERE companies.handle = $1 GROUP BY companies.handle;`,
        [handle]);
    const company = companyRes.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company.json_build_object;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
