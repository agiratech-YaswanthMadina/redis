const express = require('express');
// const { success } = require('../config/messages');
const mongoose = require('mongoose');
const Employee = require('../models/employeeType')
// const csv = require('csv');   
// const validator = require('./validate');
// const vsprintf = require('sprintf-js').vsprintf;
// const tools = require('../helpers/tools');

const formatPagination = ({ query = {} }, res, next) => {
  let {
    perPage = 10, page = 1
  } = query;

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
    page: +page
  };
  next();
}

const dynamicMsg = (message, value, data) => {
  let responseMessage = {};
  responseMessage['status'] = message['status'];
  responseMessage['code'] = message['code'];
  responseMessage['api-message'] = vsprintf(message['api-message'], value);
  responseMessage['message'] = vsprintf(message['message'], value);
  if (data)
    responseMessage['data'] = data;
  return responseMessage;
}

function CrudRouter(model, hooks, messageName = '') {
  const CrudService = require('./crudService');
  const service = new CrudService(model);
  const router = express.Router();

  // const validateRecord = (req, res, next) => {
  //   let { id } = req.params || {};
  //   const validationRule = {
  //     'id': 'required|mongo_object_id'
  //   };

  //   validator({
  //     id
  //   }, validationRule, {}, {}, (err, status) => {
  //     if (!status) {
  //       if (err && err.errors) {
  //         let errorMessage = new Error(err.errors[Object.keys(err.errors)[0]][0]);
  //         errorMessage.status = 400;
  //         next(errorMessage);
  //       } else {
  //         next(err);
  //       }
  //     } else {
  //       let { query = {}, projection = {}, populate = [] } = res.locals || {};
  //       service
  //         .read({
  //           query: Object.assign(query, { _id: mongoose.Types.ObjectId(id) }),
  //           projection,
  //           populate
  //         })
  //         .then((result) => {
  //           res.locals.record = result;
  //           next();
  //         })
  //         .catch(next)
  //     }
  //   });
  // }
  // Create new contact
  router.post(
    '/',
    hooks.create,
    function (req, res, next) {
      let { data } = res.locals;
      service.create(data)
        .then((result) => {
          res.locals.record = result;
          next();
        })
        .catch(next);
    },
    // hooks.postCreate || [],
    function (req, res) {
      let { record } = res.locals || {};
      // return res.status(200).send(dynamicMsg(success['recordCreated'], [messageName], { id: record._id }));4
      return res.status(200).send({result:'Success'})
    }
  );
  
  module.exports = router;

  const listLogic = [
    formatPagination,
    hooks.list,
    async function (req, res, next) {
      try {
        let { 
          pagination = {}, 
          query = {}, 
          projection = {}, 
          populate = [], 
          sort = {}, 
          mongoExport = false, 
          defaultQuery = {} 
        } = res.locals;
  
        // Fetch results using the service.list method
        const   results = await service.list({ query, pagination, projection, populate, sort });
  
        // If pagination limit is 0, return early with empty results
        if (pagination.limit === 0) {
          return res.status(200).send({
            pagination: {
              total: 0,
              found: 0,
              page: +pagination.page,
              perPage: 0,
              pageSize: 0
            },
            results: []
          });
        }
  
        // Fetch count and found values using service.count
        const [count, found] = await Promise.all([
          // service.count(defaultQuery),
          // service.count(query)
        ]);
  
        // If found is false, export to CSV
        if (found === false) {
          let { fileName = 'export', transform, responseFormat, populate: mongoPopulate } = mongoExport || {};
          res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Access-Control-Expose-Headers': 'Content-Disposition',
            'Content-Disposition': `attachment; filename=${fileName.replace(/\s/g, '-')}.csv`
          });
  
          // Populate data
          let populatedResults = await mongoPopulate(results, req, res);
          // Transform and format response data
          let transformedResults = populatedResults.map(x => transform(x));
          
          // Determine headers
          let { headers = {} } = req.body || {};
          if (Object.keys(headers).length === 0 && transformedResults[0]) {
            headers = Object.fromEntries(Object.keys(transformedResults[0]).map(k => [k, k]));
          }
          
          // Apply response format
          let formattedResults = transformedResults.map(l => responseFormat(l, headers));
          
          // Convert to CSV and send response
          return csv().from([headers].concat(formattedResults)).to(res);
        }
  
        // Send paginated results as JSON response
        res.status(200).send({
          pagination: {
            total: count,
            found: found,
            page: +pagination.page,
            perPage: +pagination.limit,
            pageSize: results.length
          },
          results
        });
      } catch (error) {
        next(error);
      }
    }
  ];


  const listById = [
    formatPagination,
    hooks.list,
    async function (req, res, next) {
      try {
        let { 
          pagination = {}, 
          query = {}, 
          projection = {}, 
          populate = [], 
          sort = {}, 
          mongoExport = false, 
          defaultQuery = {} 
        } = res.locals;
  
        // Check if specific ID is provided in request parameters
        if (req.params.id) {
          const id = req.params.id;
          // Fetch the specific result using the service.get method
          const result = await service.get({ id, projection, populate });
  
          if (!result) {
            return res.status(404).send({ message: 'Record not found' });
          }
  
          return res.status(200).send(result);
        }
  
        // Fetch results using the service.list method
        const results = await service.list({ query, pagination, projection, populate, sort });
  
        // If pagination limit is 0, return early with empty results
        if (pagination.limit === 0) {
          return res.status(200).send({
            pagination: {
              total: 0,
              found: 0,
              page: +pagination.page,
              perPage: 0,
              pageSize: 0
            },
            results: []
          });
        }
  
        // Fetch count and found values using service.count
        const [count, found] = await Promise.all([
          service.count(defaultQuery),
          service.count(query)
        ]);
  
        // If found is false, export to CSV
        if (found === false) {
          let { fileName = 'export', transform, responseFormat, populate: mongoPopulate } = mongoExport || {};
          res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Access-Control-Expose-Headers': 'Content-Disposition',
            'Content-Disposition': `attachment; filename=${fileName.replace(/\s/g, '-')}.csv`
          });
  
          // Populate data
          let populatedResults = await mongoPopulate(results, req, res);
          // Transform and format response data
          let transformedResults = populatedResults.map(x => transform(x));
          
          // Determine headers
          let { headers = {} } = req.body || {};
          if (Object.keys(headers).length === 0 && transformedResults[0]) {
            headers = Object.fromEntries(Object.keys(transformedResults[0]).map(k => [k, k]));
          }
          
          // Apply response format
          let formattedResults = transformedResults.map(l => responseFormat(l, headers));
          
          // Convert to CSV and send response
          return csv().from([headers].concat(formattedResults)).to(res);
        }
  
        // Send paginated results as JSON response
        res.status(200).send({
          pagination: {
            total: count,
            found: found,
            page: +pagination.page,
            perPage: +pagination.limit,
            pageSize: results.length
          },
          results
        });
      } catch (error) {
        next(error);
      }
    }
  ];
  
  // Retrieve all contacts
  router.post('/search', listLogic);
  router.get('/', listLogic);
  // export logic
//   router.post('/export', hooks.export || [], tools.validateExport, listLogic)
  // Retrieve specific contact
  // router.get(
  //   '/:id',
  //   hooks.read,
  //   // validateRecord,
  //   hooks.postRead || [],
  //   function (req, res, next) {
  //     let { query } = res.locals || {};
      
  //     return res.status(200).send(query);
  //   }
  // );

  router.get(
    '/:id',
    // hooks.read,
    // validateRecord,
    // hooks.postRead || [],
    async (req, res, next)=> {
      // let { query } = res.locals || {};
      
      // return res.status(200).send(query);
      try{
        const oneemployee = await Employee.findById(req.params.id)
        res.json(oneemployee)

    }catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get employee' });
      }
    }
  );

  // router.get('/:id', async (req, res, next) => {
  //   try {
  //     let { pagination, query, projection, populate = [], sort = {}, mongoExport = false, defaultQuery } = res.locals;
  
  //     // Check if specific ID is provided in request parameters
  //     if (req.params.id) {
  //       const id = req.params.id;
  //       // Fetch the specific result using the service.get method
  //       const result = await service.get({ id, projection, populate });
  
  //       if (!result) {
  //         return res.status(404).send({ message: 'Record not found' });
  //       }
  
  //       return res.status(200).send(result);
  //     }
  
  //     // Fetch results using the service.list method
  //     const results = await service.list({ query, pagination, projection, populate, sort });
  
  //     // If pagination limit is 0, return early with empty results
  //     if (pagination.limit === 0) {
  //       return res.status(200).send({
  //         pagination: {
  //           total: 0,
  //           found: 0,
  //           page: +pagination.page,
  //           perPage: 0,
  //           pageSize: 0
  //         },
  //         results: []
  //       });
  //     }
  
  //     // Fetch count and found values using service.count
  //     const [count, found] = await Promise.all([
  //       service.count(defaultQuery),
  //       service.count(query)
  //     ]);
  
  //     // If found is false, export to CSV
  //     if (found === false) {
  //       let { fileName = 'export', transform, responseFormat, populate: mongoPopulate } = mongoExport || {};
  //       res.writeHead(200, {
  //         'Content-Type': 'text/csv',
  //         'Access-Control-Expose-Headers': 'Content-Disposition',
  //         'Content-Disposition': `attachment; filename=${fileName.replace(/\s/g, '-')}.csv`
  //       });
  
  //       // Populate data
  //       let populatedResults = await mongoPopulate(results, req, res);
  //       // Transform and format response data
  //       let transformedResults = populatedResults.map(x => transform(x));
        
  //       // Determine headers
  //       let { headers = {} } = req.body || {};
  //       if (Object.keys(headers).length === 0 && transformedResults[0]) {
  //         headers = Object.fromEntries(Object.keys(transformedResults[0]).map(k => [k, k]));
  //       }
        
  //       // Apply response format
  //       let formattedResults = transformedResults.map(l => responseFormat(l, headers));
        
  //       // Convert to CSV and send response
  //       return csv().from([headers].concat(formattedResults)).to(res);
  //     }
  
  //     // Send paginated results as JSON response
  //     res.status(200).send({
  //       pagination: {
  //         total: count,
  //         found: found,
  //         page: +pagination.page,
  //         perPage: +pagination.limit,
  //         pageSize: results.length
  //       },
  //       results
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // });
  
  // Update specific contact
  router.patch(
    '/:id',
    hooks.update,
    // validateRecord,
    hooks.preUpdate || [],
    function (req, res, next) {
      let { record, data } = res.locals || {};
      let Id = req?.params?.id;
      service.update(record, data,Id)
        .then(() => {
          next();
        })
        .catch(next);
    },
    hooks.postUpdate || [],
    function (req, res) {
      let { record } = res.locals || {};
      let resultData = {
        // id: record._id
      }
      // if (record.organizationId) {
      //   // resultData.organizationId = record.organizationId
      // }
      return res.status(200).send({status:200,msg:"Updated Successfully"});
    }
  );
  // Remove specific contact             

  router.delete(
    '/:id',
    hooks.delete,
    // validateRecord,
    hooks.preDelete || [],
    function (req, res, next) {
      
      let { record } = res.locals || {};
      let Id = req?.params?.id;
      service.delete(record, data,Id)
        .then(() => {
          next();
        })
        .catch(next);
    },
    hooks.postDelete || [],
    function (req, res) {
      let { record } = res.locals || {};
      return res.status(200).send(dynamicMsg(success['recordDeleted'], [messageName], { id: record._id }));
    }
  );
  this.router = router;
}

module.exports = CrudRouter;
