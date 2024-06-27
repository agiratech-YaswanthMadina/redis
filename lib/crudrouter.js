const express = require("express");
const mongoose = require("mongoose");
const Employee = require("../models/employeeType");
const validator = require("./validate");
// const success  = require('../config/messages');

const formatPagination = ({ query = {} }, res, next) => {
  let { perPage = 30, page = 1 } = query;

  if (+page <= 0) {
    page = 1;
  }
  let skip = (page - 1) * perPage;

  let { mongoExport = false } = res.locals || {};

  if (mongoExport !== false) {
    perPage = 0;
    skip = 0;
    page = 1;
  }

  res.locals.pagination = {
    limit: +perPage,
    skip: +skip,
    page: +page,
  };
  next();
};

const dynamicMsg = (message, value, data) => {
  let responseMessage = {};
  responseMessage["status"] = message["status"];
  responseMessage["code"] = message["code"];
  responseMessage["api-message"] = vsprintf(message["api-message"], value);
  responseMessage["message"] = vsprintf(message["message"], value);
  if (data) responseMessage["data"] = data;
  return responseMessage;
};

function CrudRouter(model, hooks, messageName = "") {
  const CrudService = require("./crudService");
  const service = new CrudService(model);
  const router = express.Router();
  const validateRecord = (req, res, next) => {
    let { id } = req.params || {};
    const validationRule = {
      id: "required|mongo_object_id",
    };
    validator(
      {
        id,
      },
      validationRule,
      {},
      {},
      (err, status) => {
        if (!status) {
          if (err && err.errors) {
            let errorMessage = new Error(
              err.errors[Object.keys(err.errors)[0]][0]
            );
            errorMessage.status = 400;
            next(errorMessage);
          } else {
            next(err);
          }
        } else {
          let { query = {}, projection = {}, populate = [] } = res.locals || {};
          service
            .read({
              query: Object.assign(query, { _id: mongoose.Types.ObjectId(id) }),
              projection,
              populate,
            })
            .then((result) => {
              res.locals.record = result;
              next();
            })

            .catch(next);
        }
      }
    );
  };

  // Create new contact
  router.post(
    "/",
    hooks.create,
    function (req, res, next) {
      let { data } = res.locals;
      service
        .create(data)
        .then((result) => {
          res.locals.record = result;
          next();
        })
        .catch(next);
    },
    hooks.postCreate || [],
    function (req, res) {
      let { record } = res.locals || {};
      return res
        .status(200)
        .send(
          `msg: New Employee with ID ${record._id} has been created Successfully`
        );
    }
  );

  const listLogic = [
    formatPagination,
    hooks.list,
    function (req, res, next) {
      let {
        pagination,
        query = {},
        projection = {},
        populate = [],
        sort = {},
        mongoExport = false,
        defaultQuery = {},
      } = res.locals;
      service
        .list({ query, pagination, projection, populate, sort })
        .then((results = []) => {
          if (pagination.limit === 0) {
            return [results, false, false];
          } else {
            return Promise.all([
              service.count(defaultQuery),
              service.count(query),
            ])
              .then(([count, found]) => {
                return [results, count, found];
              })
              .catch(next);
          }
        })
        .then(async ([results, count, found]) => {
          if (found === false) {
            let {
              fileName = messageName,
              transform,
              responseFormat,
              populate,
            } = mongoExport || {};
            res.writeHead(200, {
              "Content-Type": "text/csv",
              "Access-Control-Expose-Headers": "Content-Disposition",
              "Content-Disposition": `attachment; filename=${fileName.replace(
                /\s/g,
                "-"
              )}.csv`,
            });
            // populate datas
            results = await populate(results, req, res);
            // format response data
            results = results.map((x) => transform(x));
            // limit headers
            let { headers = {} } = req.body || {};
            if (Object.keys(headers).length === 0 && results[0]) {
              headers = Object.fromEntries(
                Object.keys(results[0]).map((k) => [k, k])
              );
            }
            // filter
            results = results.map((l) => responseFormat(l, headers));
            return csv().from([headers].concat(results)).to(res);
          } else {
            return res.status(200).send({
              pagination: {
                total: count,
                found: found,
                page: +pagination.page,
                perPage: +pagination.limit,
                pageSize: results.length,
              },
              results,
            });
          }
        })
        .catch(next);
    },
  ];

  // Retrieve all contacts
  router.post("/search", listLogic);

  router.get("/", listLogic);

  router.get(
    "/:id",
    hooks.read,
    validateRecord,
    hooks.postRead || [],
    function (req, res) {
      let { record } = res.locals || {};
      return res.status(200).send(record);
    }
  );

  router.patch(
    "/:id",
    hooks.update,
    validateRecord,
    hooks.preUpdate || [],
    function (req, res, next) {
      let { record, data } = res.locals || {};
      service
        .update(record, data)
        .then(() => {
          next();
        })
        .catch(next);
    },
    hooks.postUpdate || [],
    function (req, res) {
      let { record } = res.locals || {};
      let resultData = {
        id: record._id,
      };
      if (record.organizationId) {
        resultData.organizationId = record.organizationId;
      }
      return res.status(200).send(resultData);
    }
  );

  router.delete(
    "/:id",
    hooks.delete,
    validateRecord,
    hooks.preDelete || [],
    function (req, res, next) {
      let { record } = res.locals || {};
      service
        .delete(record)
        .then(() => {
          next();
        })
        .catch(next);
    },
    hooks.postDelete || [],
    function (req, res) {
      let { record } = res.locals || {};
      return res
        .status(200)
        .send(`msg: ID ${record._id} has been Deleted Successfully`);
    }
  );
  this.router = router;
}

module.exports = CrudRouter;
