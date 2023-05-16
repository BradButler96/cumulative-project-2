"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll
} = require("./_testCommon");
  
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", () => {
    const newJob = {
        title: "NewTitle",
        salary: 400000,
        equity: "0.75",
        company_handle: "c1"
    }

    test("works", async () => {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: job.id,
            title: 'NewTitle',
            salary: 400000,
            equity: '0.75',
            company_handle: 'c1'
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = ${job.id}`);

        expect(result.rows).toEqual([
            {
                id: job.id,
                title: "NewTitle",
                salary: 400000,
                equity: "0.75",
                company_handle: "c1"
            },
        ]);
    });
});

/************************************** findAll */

describe("findAll", () => {
    test("works: no filter", async () => {
        let jobs = await Job.findAll()
        expect(jobs).toEqual([
            {
                id: jobs[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            },
            {
                id: jobs[1].id,
                title: 'Title2',
                salary: 200000,
                equity: '0.5',
                company_handle: 'c2'
            },
            {
                id: jobs[2].id,
                title: 'Title3',
                salary: 300000,
                equity: '1',
                company_handle: 'c3'
            }
        ]);
    });

    test('works: filter by complete name', async () => {
        let job = await Job.findAll({ title: 'Title1' });
        expect(job).toEqual([
            {
                id: job[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            }
        ])
    })

    test('works: filter by partial name', async () => {
        let job = await Job.findAll({ title: '1' });
        expect(job).toEqual([
            {
                id: job[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            }
        ])
    })

    test('works: filter by minSalary', async () => {
        let job = await Job.findAll({ minSalary: 200000 });
        expect(job).toEqual([
            {
                id: job[0].id,
                title: 'Title2',
                salary: 200000,
                equity: '0.5',
                company_handle: 'c2'
            },
            {
                id: job[1].id,
                title: 'Title3',
                salary: 300000,
                equity: '1',
                company_handle: 'c3'
            }
        ])
    })

    test('works: filter by equity = false', async () => {
        let job = await Job.findAll({ hasEquity: 'false' });
        expect(job).toEqual([
            {
                id: job[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            }
        ])
    })

    test('works: filter by equity = true', async () => {
        let job = await Job.findAll({ hasEquity: 'true' });
        expect(job).toEqual([
            {
                id: job[0].id,
                title: 'Title2',
                salary: 200000,
                equity: '0.5',
                company_handle: 'c2'
            },
            {
                id: job[1].id,
                title: 'Title3',
                salary: 300000,
                equity: '1',
                company_handle: 'c3'
            }
        ])
    })
});

// /************************************** get */

describe("get", () => {
    const newJob = {
        title: "NewTitle",
        salary: 400000,
        equity: "0.75",
        company_handle: "c1"
    }
    test("works", async () => {
        let sampleJob = await Job.create(newJob);
        let job = await Job.get(sampleJob.id);
        expect(job).toEqual({
            id: sampleJob.id,
            title: 'NewTitle',
            salary: 400000,
            equity: '0.75',
            company_handle: 'c1'
        });
    });
    test("not found if no such ID", async function () {
        try {
            await Job.get(100000);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

// /************************************** update */

describe("update", () => {
    const updateData = {
		title: "Updated",
		salary: 500000,
		equity: "0"
    };
    test("works", async () => {
        let sampleId = await Job.findAll()
        let job = await Job.update(sampleId[0].id, updateData);
        expect(job).toEqual({
            id: sampleId[0].id,
            title: 'Updated',
            salary: 500000,
            equity: '0',
            company_handle: 'c1'
        })
        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = ${sampleId[0].id}`);
        expect(result.rows).toEqual([{
            id: sampleId[0].id,
            title: 'Updated',
            salary: 500000,
            equity: '0',
            company_handle: 'c1'
        }]);
    });

    test("works: null fields", async () => {
        const updateDataSetNulls = {
	    	title: "Updated",
	    	salary: null,
	    	equity: null
        };
        let sampleId = await Job.findAll()
        let job = await Job.update(sampleId[0].id, updateDataSetNulls);
        expect(job).toEqual({
                id: sampleId[0].id,
                title: 'Updated',
                salary: null,
                equity: null,
                company_handle: 'c1'
        });
        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = ${sampleId[0].id}`);
        expect(result.rows).toEqual([{
            id: sampleId[0].id,
            title: 'Updated',
            salary: null,
            equity: null,
            company_handle: 'c1'
        }]);
    });

    test("not found if no such company", async () => {
        try {
            const updateData = {
                title: "Updated",
                salary: 500000,
                equity: "0"
            };
            await Job.update(100000, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async () => {
        try {
            await Job.update(100000, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

// /************************************** remove */

describe("remove", () => {
    const newJob = {
        title: "NewTitle",
        salary: 400000,
        equity: "0.75",
        company_handle: "c1"
    }
    test("works", async () => {
        let sampleJob = await Job.create(newJob);
        await Job.remove(sampleJob.id);
        const res = await db.query(
            `SELECT id FROM jobs WHERE id = ${sampleJob.id}`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such company", async () => {
        try {
            await Job.remove(100000);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
