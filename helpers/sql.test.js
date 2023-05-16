"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app.js");
const { sqlForPartialUpdate, queryFilters } = require("./sql.js");
const { BadRequestError } = require("../expressError");


const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("../routes/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Prepare JSON to be inserted into a SQL command", () => {
  test("Create strings for the SQL SET command and the array of corresponding values", async () => {
    const updatedData = {
      firstName: 'Updated',
      lastName: 'Names'
    }

    const jsToSql = {
      firstName: "first_name",
      lastName: "last_name", 
    }

    let updated = sqlForPartialUpdate(updatedData, jsToSql)

    // Verify that setCols is a string that is properly formatted to be inserted into SQL command
    expect(updated.setCols).toEqual('"first_name"=$1, "last_name"=$2')

    // Verify that values in values array are at the correct index for the SQL command
    expect(updated.values[0]).toEqual('Updated')
    expect(updated.values[1]).toEqual('Names')
  })

  test("No keys failure", async () => {
    try {
      const updatedData = {}
      const jsToSql = {
        firstName: "first_name"
      }
      sqlForPartialUpdate(updatedData, jsToSql)
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })
});

describe("Prepare SQL command for filtering based on query strings", () => {
  test("Create strings for the SQL SET command and the array of corresponding values with three filters", async () => {
    const filters = queryFilters({ name: 'ba', minEmp: '200', maxEmp: '1000' })

    expect(filters.string).toEqual('name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3')
    expect(filters.values[0]).toEqual('%ba%')
    expect(filters.values[1]).toEqual('200')
    expect(filters.values[2]).toEqual('1000')
  })

  test("Create strings for the SQL SET command and the array of corresponding values with two filters", async () => {
    const filters = queryFilters({ minEmp: '200', maxEmp: '1000' })

    expect(filters.string).toEqual('num_employees >= $1 AND num_employees <= $2')
    expect(filters.values[0]).toEqual('200')
    expect(filters.values[1]).toEqual('1000')
  })

  test("Create strings for the SQL SET command and the array of corresponding values with one filters", async () => {
    const filters = queryFilters({ maxEmp: '1000' })

    expect(filters.string).toEqual('num_employees <= $1')
    expect(filters.values[0]).toEqual('1000')
  })


  test("Min > Max error", async () => {
    try {
      queryFilters({ minEmp: '3', maxEmp: '2' });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })
});