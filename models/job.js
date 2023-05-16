"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, jobQueryFilters } = require("../helpers/sql");

/** Related functions for companies. */

class Job {

  static async create({ title, salary, equity, company_handle }) {

    const result = await db.query(
            `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle`,
            [ title, salary, equity, company_handle ]
    );

    return result.rows[0];
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters = {}) {
    
    let jobs;

    if (Object.keys(filters).length != 0) {
        let filterVals = jobQueryFilters(filters)
        jobs = await db.query(
        `SELECT id,
                title,
                salary,
                equity,
                company_handle
            FROM jobs
            WHERE ${filterVals.string}`,
        filterVals.values);
    } else {
        jobs = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
                FROM jobs
                ORDER BY id`);
    }

    return jobs.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const result = await db.query(
        `SELECT id,
            title,
            salary,
            equity,
            company_handle
        FROM jobs
        WHERE id = $1`,
        [id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job found`);

    return job;
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

  static async update(id, data) {

    if (data.id) throw new BadRequestError(`Cannot change ID`);

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
            title: "title",
            salary: "salary",
            equity: "equity",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title,
                                salary,
                                equity,
                                company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
        `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}



module.exports = Job;
