"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", () => {
    const newJob = {
            title: "NewTitle",
            salary: 400000,
            equity: "0.75",
            company_handle: "c1"
        }

    test("ok for admins", async () => {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                    id: resp.body.job.id,
                    title: "NewTitle",
                    salary: 400000,
                    equity: "0.75",
                    company_handle: "c1"
                }
        });
    });


    test("fails for non-admins", async () => {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails for anons", async () => {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async () => {
        const resp = await request(app)
            .post("/companies")
            .send({
                salary: 400000,
                equity: "0.75",
                company_handle: "c1"
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async () => {
        const resp = await request(app)
            .post("/companies")
            .send({
                title: "NewTitle",
                salary: "400000",
                equity: "0.75",
                company_handle: "c1"
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", () => {
  test("ok for anon", async () => {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
                {
                    id: resp.body.jobs[0].id,
                    title: "Title1",
                    salary: 100000,
                    equity: "0",
                    company_handle: "c1"
                },
                {
                    id: resp.body.jobs[1].id,
                    title: "Title2",
                    salary: 200000,
                    equity: "0.25",
                    company_handle: "c2"
                },
                {
                    id: resp.body.jobs[2].id,
                    title: "Title3",
                    salary: 300000,
                    equity: "0.5",
                    company_handle: "c3"
                },
            ]
        })
    })

    test('works: filter by complete title', async () => {
        const resp = await request(app).get("/jobs?title=Title1");
        expect(resp.body.jobs).toEqual([
            {
                id: resp.body.jobs[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            }
        ])
    })

    test('works: filter by partial title', async () => {
        const resp = await request(app).get("/jobs?title=1");
        expect(resp.body.jobs).toEqual([
            {
                id: resp.body.jobs[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            }
        ])
    })

    test('works: filter by job salary & equity', async () => {
        const resp = await request(app).get("/jobs?minSalary=200000&hasEquity=true");
        expect(resp.body.jobs).toEqual([
            {
                id: resp.body.jobs[0].id,
                title: 'Title2',
                salary: 200000,
                equity: '0.25',
                company_handle: 'c2'
            },
            {
                id: resp.body.jobs[1].id,
                title: 'Title3',
                salary: 300000,
                equity: '0.5',
                company_handle: 'c3'
            }
        ])
    })

    test('works: filter by job salary', async () => {
        const resp = await request(app).get("/jobs?minSalary=200000");
        expect(resp.body.jobs).toEqual([
            {
                id: resp.body.jobs[0].id,
                title: 'Title2',
                salary: 200000,
                equity: '0.25',
                company_handle: 'c2'
            },
            {
                id: resp.body.jobs[1].id,
                title: 'Title3',
                salary: 300000,
                equity: '0.5',
                company_handle: 'c3'
            }
        ])
    })

    test('works: filter by equity = true', async () => {
        const resp = await request(app).get("/jobs?hasEquity=true");
        expect(resp.body.jobs).toEqual([
            {
                id: resp.body.jobs[0].id,
                title: 'Title2',
                salary: 200000,
                equity: '0.25',
                company_handle: 'c2'
            },
            {
                id: resp.body.jobs[1].id,
                title: 'Title3',
                salary: 300000,
                equity: '0.5',
                company_handle: 'c3'
            }
        ])
    })

    test('works: filter by equity = false', async () => {
        const resp = await request(app).get("/jobs?hasEquity=false");
        expect(resp.body.jobs).toEqual([
            {
                id: resp.body.jobs[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            }
        ])
    })
});

// /************************************** GET /jobs/:id */

describe("GET /companies/:id", () => {
    test("works for anon", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app).get(`/jobs/${req.body.jobs[0].id}`);
        expect(resp.body).toEqual({
            job: {
                id: req.body.jobs[0].id,
                title: 'Title1',
                salary: 100000,
                equity: '0',
                company_handle: 'c1'
            }
        })
    });

//   test("works for anon: company w/o jobs", async function () {
//     const resp = await request(app).get(`/companies/c2`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//     });
//   });

    test("not found for invalid ID", async () => {
        const resp = await request(app).get(`/jobs/1000`);
        expect(resp.statusCode).toEqual(404);
    });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", () => {
    test("works for admins", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .patch(`/jobs/${req.body.jobs[0].id}`)
            .send({
                title: 'Title1',
                salary: 500000
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
            job: {
                id: req.body.jobs[0].id,
                title: 'Title1',
                salary: 500000,
                equity: '0',
                company_handle: 'c1'
            }
        });
    });

    test("fails for non-admins", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .patch(`/jobs/${req.body.jobs[0].id}`)
            .send({
                title: 'Title1',
                salary: 500000
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .patch(`/jobs/${req.body.jobs[0].id}`)
            .send({
                title: 'Title1',
                salary: 500000
            })
        expect(resp.statusCode).toEqual(401);
    });
    
      test("not found on no such company", async () => {
        const resp = await request(app)
            .patch(`/jobs/1000`)
            .send({
                title: 'Title1',
                salary: 500000
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
     });


     test("bad request on id change attempt", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .patch(`/jobs/${req.body.jobs[0].id}`)
            .send({
                id: 1000,
                title: 'Title1',
                salary: 500000
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .patch(`/jobs/${req.body.jobs[0].id}`)
            .send({
                title: 'Title1',
                salary: '500000'            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

// /************************************** DELETE /companies/:handle */

describe("DELETE /companies/:id", () => {
    test("works for admins", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .delete(`/jobs/${req.body.jobs[0].id}`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({ deleted: `Job ${req.body.jobs[0].id}` });
    });

    test("fails for non-admins", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .delete(`/jobs/${req.body.jobs[0].id}`)
            .set("authorization", `Bearer ${u1Token}`);
        
            expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async () => {
        const req = await request(app).get(`/jobs`)
        const resp = await request(app)
            .delete(`/jobs/${req.body.jobs[0].id}`)
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async () => {
        const resp = await request(app)
            .delete(`/jobs/1000`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
