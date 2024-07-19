const Employee = require("../models/employeeType");
const Project = require("../models/project");
const CrudRouter = require("../lib/crudrouter");
const nodemailer = require("nodemailer");
// const mongoose = require("mongoose");
const User = require("../models/user");
const redis = require("redis");
const redisClient = redis.createClient();
const mongoose = require("mongoose");

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});
redisClient.connect().catch(console.error);
const validator = require("../lib/validate");
const defaultFilter = (req, res, next) => {
  //let { siteInfo } = res.locals;
  res.locals.query = {
    // siteId: "123",
    // isActive: 1
  };
  //res.locals.defaultQuery = {...res.locals.query};
  next();
};


//For Post End Point
const checkRedisPost = async (req, res, next) => {
  // let unique = req.params.id;
  let { id } = req.body;
  id = String(id);
  let checkData = await redisClient.get(id);
  const parsedData = JSON.parse(checkData);
  if (!!!checkData || parsedData.data === null) {
    next();
  } else {
    return res.send(JSON.parse(checkData));
  }
};
const setPostRedisCache = async (req, res, next) => {
  let { record } = res.locals;
  let { id } = req.body;
  id = String(id);
  const currentTime = new Date().getTime();
  const dataToCache = {
    data: record,
    timestamp: currentTime,
    expiryTime: 60000,
  };
  redisClient.setEx(id, 60, JSON.stringify(dataToCache));
  next();
};


//For Update End Point
const checkRedisUpdate = async (req, res, next) => {
  let unique = req.params.id;
  let checkData = await redisClient.get(unique);
  const parsedData = JSON.parse(checkData);
  if (!!!checkData || parsedData.data === null) {
    next();
  } else {
    return res.send(JSON.parse(checkData));
  }
};
const setRedisCacheUpdate = async (req, res, next) => {
  let unique = req.params.id;
  let { record } = res.locals;
  async function refreshCache(unique) {
    const currentTime = new Date().getTime();
    const dataToCache = {
      data: record,
      timestamp: currentTime,
      expiryTime: 60000,
    };
    try {
      // Start a transaction
      const pipeline = redis.pipeline();
      // Delete the old cache value
      pipeline.del(unique);
      // Set the new data in Redis cache
      pipeline.set(unique, JSON.stringify(dataToCache));
      // Execute the transaction
      await pipeline.exec();
    } catch (err) {
      console.error("Error refreshing cache:", err);
    }
  }
  await refreshCache(unique);
  next();
};


//For Delete End Point
const checkRedisForDelete = async (req,res,next) => {
  let unique = req.params.id;
  let checkData = await redisClient.get(unique);
  const parsedData = JSON.parse(checkData);
  let {record} = res.locals;
  if (!!!checkData || !(checkData==null)) {
    next();
  } else {
    return res.send("No Data");
  }
}
const setRedisCacheForDelete = async(req,res,next) => {
  let unique = req.params.id;
  let { record } = res.locals;
  const currentTime = new Date().getTime();
  const dataToCache = {
    data: record,
    timestamp: currentTime,
    expiryTime: 60000,
  };
  redisClient.setEx(unique, 60, JSON.stringify(dataToCache));
  await redisClient.del(unique);
  next();
}


//For Get by ID End Point
const checkRedis = async (req, res, next) => {
  // const a = new Promise(async (resolve, reject) => {
  let unique = req.params.id;
  let checkData = await redisClient.get(unique);
  const parsedData = JSON.parse(checkData);
  if (!!!checkData || parsedData.data === null) {
    next();
  } else {
    return res.send(JSON.parse(checkData));
  }
};
const setRedisCache = (req, res, next) => {
  let { record } = res.locals;
  let unique = req.params.id;
  const currentTime = new Date().getTime();
  const dataToCache = {
    data: record,
    timestamp: currentTime,
    expiryTime: 60000,
  };
  redisClient.setEx(unique, 60, JSON.stringify(dataToCache));
  next();
};



const defaultProjection = (req, res, next) => {
  res.locals.projection = {};
  next();
};

const defaultSort = (req, res, next) => {
  res.locals.sort = {
    order: "asc",
  };
  next();
};

const dynamicSort = (req, res, next) => {
  let { sort = {} } = res.locals || {};
  let sortKeys = Object.keys(sort);

  let defalutSortBy = sortKeys && sortKeys[0] ? sortKeys[0] : "order";
  let defalutSortOrder = sortKeys && sortKeys[0] ? sort[sortKeys[0]] : "asc";

  let { sortBy = defalutSortBy, order = defalutSortOrder } = req.query || {};

  let possibleOrderValues = {
    asc: 1,
    desc: -1,
  };

  let possibleOrderFields = {
    id: "_id",
    name: "name",
    order: "order",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  };

  if (!Object.keys(possibleOrderValues).includes(order)) {
    order = defalutSortOrder;
  }

  if (!Object.keys(possibleOrderFields).includes(sortBy)) {
    sortBy = defalutSortBy;
  }

  res.locals.sort = {
    [possibleOrderFields[sortBy]]: possibleOrderValues[order],
  };
  next();
};

const dynamicProjection = (req, res, next) => {
  let { fieldSet = null } = req.query || {};
  if (fieldSet) {
    fieldSet = fieldSet.split(",");
    res.locals.projection = fieldSet.reduce((a, b) => ((a[b] = 1), a), {});
  }
  next();
};

const dynamicSearchAndFilter = (req, res, next) => {
  let values = {};
  let { query = {} } = res.locals || {};

  if (req.method == "POST") {
    let { search = undefined, filter = {} } = req.body || {};

    if (search) values["search"] = search;

    if (filter) {
      if (filter.ids) {
        values["ids"] = filter.ids;
      }
      if (
        filter.hasOwnProperty("isActive") &&
        typeof filter.isActive === "boolean"
      ) {
        values["isActive"] = filter.isActive ? true : false;
      }
    }
  }

  if (req.method == "GET") {
    let { search = undefined, ids = undefined } = req.query || {};
    if (search) values["search"] = search;
    if (ids) values["ids"] = ids.split(",");
  }

  let rules = {
    search: "sometimes|required|string|max:300",
    ids: "sometimes|required|array|min:1",
    "ids.*": "required|mongo_object_id",
  };

  validator(values, rules, {}, {}, (err, status) => {
    if (!status) {
      if (err && err.errors) {
        let errorMessage = new Error(err.errors[Object.keys(err.errors)[0]][0]);
        errorMessage.status = 400;
        next(errorMessage);
      } else {
        next(err);
      }
    } else {
      if (values["search"]) {
        query = Object.assign(query, {
          $text: {
            $search: values["search"],
          },
        });
      }

      if (values["ids"]) {
        query = Object.assign(query, {
          _id: {
            $in: values["ids"],
          },
        });
      }
      if (values.hasOwnProperty("isActive")) {
        query.isActive = values.isActive;
      }
      next();
    }
  });
};

const sendingMail = (req, res, next) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "yaswanth35000@gmail.com",
      pass: "bmct egzh pqca jzsp",
    },
  });
  //  console.log(res.locals);
  let { data } = res.locals;

  let mailOptions = {
    from: "yaswanth35000@gmail.com",
    to: `${data.email}`,
    subject: "Test Email",
    text: "Data has been created !!!",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
  next();
};

const sendingUpdateMail = (req, res, next) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "yaswanth35000@gmail.com",
      pass: "bmct egzh pqca jzsp",
    },
  });
  //  console.log(res.locals);
  let { record } = res.locals;

  let mailOptions = {
    from: "yaswanth35000@gmail.com",
    to: `${record.email}`,
    subject: "Test Email",
    text: `Data has been updated, ID:${record.id}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
  next();
};

const formatRules = (req, res, next) => {
  res.locals.rules = {
    name: "required|string|max:300",
  };
  // if(req.method.toLowerCase() === 'patch') {
  //   Object.keys(res.locals.rules).forEach(x => {
  //     if(x.indexOf("*") === -1 && res.locals.rules[x].indexOf("required") !== -1) {
  //       res.locals.rules[x] = "sometimes" + res.locals.rules[x];
  //     }
  //   })
  // }
  next();
};

const validateRequest = (req, res, next) => {
  let { body: data } = req || {};
  let { rules = {}, customMessage = {} } = res.locals || {};

  validator(data, rules, customMessage, {}, (err, status) => {
    if (!status) {
      if (err && err.errors) {
        let errorMessage = new Error(err.errors[Object.keys(err.errors)[0]][0]);
        errorMessage.status = 400;
        next(errorMessage);
      } else {
        next(err);
      }
    } else {
      res.locals.validatedData = data;
      next();
    }
  });
};
 
const formatAgencyType = (req, res, next) => {
  let { validatedData } = res.locals || {};
  let {
    name = undefined,
    id = undefined,
    email,
    googleId,
  } = validatedData || {};
  let { siteInfo } = res.locals;
  res.locals.data = {
    name,
    id,
    email,
    googleId,
  };
  next();
};

const validations = {
  create: [formatRules, validateRequest, formatAgencyType, checkRedisPost],
  
  postCreate: [setPostRedisCache],

  list: [
    defaultFilter,
    defaultProjection,
    dynamicProjection,
    defaultSort,
    dynamicSort,
    dynamicSearchAndFilter,
  ],

  read: [defaultFilter, defaultProjection, dynamicProjection, checkRedis],

  postRead: [setRedisCache],

  update: [
    defaultFilter,
    formatRules,
    validateRequest,
    formatAgencyType,
    checkRedisUpdate,
  ],

  postUpdate: [sendingUpdateMail, setRedisCacheUpdate],

  delete: [defaultFilter, checkRedisForDelete],

  postDelete:[setRedisCacheForDelete]
};

const crudRouter = new CrudRouter(Employee, validations, "Employee Type");
// const cs = new CrudRouter(Project, validations, 'Project Type');
module.exports = [crudRouter.router];
// module.exports = [cs.router];
