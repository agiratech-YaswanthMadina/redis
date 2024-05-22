// const { falt } = require('./flat');

const Employee = require("../models/employeeType");

const isObject = (x) => {
  return typeof x === "object" && x !== null;
};

const isArray = (x) => {
  return Array.isArray(x);
};

// const isUndefined = (x) => {
//   return x === undefined
// }

const omitUndefined = function (data) {
  for (const [key, value] of Object.entries(data)) {
    if (isObject(value) && isArray(value)) {
      data[key] = value.map((y) => omitUndefined(y));
    } else if (isObject(value)) {
      data[key] = omitUndefined(value);
      if (Object.keys(data[key]).length === 0) {
        delete data[key];
      }
    } else if (value === undefined) {
      delete data[key];
    }
  }
  return data;
};

const resetEmptyString = function (data) {
  for (const [key, value] of Object.entries(data)) {
    if (isObject(value) && isArray(value)) {
      data[key] = value.map((y) => resetEmptyString(y));
    } else if (isObject(value)) {
      data[key] = resetEmptyString(value);
      if (Object.keys(data[key]).length === 0) {
        delete data[key];
      }
    } else if (value === "") {
      data[key] = null;
    }
  }
  return data;
};

function CrudService(model) {
  this.model = model;
}

const service = {
  async get({ id, projection = {}, populate = [] }) {
    // Implement your logic to fetch a specific record by ID
    // Example using Mongoose:
    const result = await YourModel.findById(id, projection)
      .populate(populate)
      .exec();
    return result;
  },
  async list({
    query = {},
    pagination = {},
    projection = {},
    populate = [],
    sort = {},
  }) {
    // Implement your logic to list records
    // Example using Mongoose:
    const results = await YourModel.find(query, projection)
      .populate(populate)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .exec();
    return results;
  },
  async count(query = {}) {
    // Implement your logic to count records
    // Example using Mongoose:
    const count = await YourModel.countDocuments(query).exec();
    return count;
  },
};

CrudService.prototype.create = async function (data) {
  data = resetEmptyString(data);
  // console.log('createObj',JSON.stringify(data));
  // let test= await this.model.create(data);
  // console.log(`test`,JSON.stringify(test))
  // console.log(data,"jasbdddddd")
  return new Promise(async (resolve, reject) => {
    Employee.create(data)
      .then((result) => {
        console.log(result);
        resolve(result);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
    // this.model.create(data, (err, result) => {
    //   if (err) reject(err);
    //   resolve(result);
    // });
  });
};

CrudService.prototype.list = function ({
  query = {},
  pagination,
  projection = {},
  populate = [],
  sort = {},
}) {
  return new Promise((resolve, reject) => {
    console.log(query, this.model, pagination.limit, "limit");
    Employee.find(query, projection)
      .collation({ locale: "en" })
      .populate(populate)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .then(resolve)
      .catch(reject);
  });
};

// CrudService.prototype.count = function (query) {
//   return new Promise((resolve, reject) => {
//     this.model.countDocuments(query).then(resolve).catch(reject);
//   });
// };

CrudService.prototype.aggregate = function (query) {
  return new Promise((resolve, reject) => {
    this.model
      .aggregate(query)
      .allowDiskUse(true)
      .exec(function (err, results = []) {
        if (err) reject(err);
        resolve(results);
      });
  });
};

CrudService.prototype.read = function ({
  query,
  projection = {},
  populate = [],
}) {
  return new Promise(async (resolve, reject) => {
    this.model
      .findOne(query, projection)
      .populate(populate)
      .then((result) => {
        if (!result) {
          let error = new Error("Not Found");
          error.status = 400;

          reject(error);
        } else {
          resolve(result);
        }
      })
      .catch(reject);
  });
};

CrudService.prototype.update = async function (model, data, Id) {
  let { createdBy, createdAt, ...other } = data;

  other = omitUndefined(other);
  other = resetEmptyString(other);
  console.log(data);

  return await Employee.findByIdAndUpdate(
    Id,
    { $set: {name:data?.name} },
    { new: true, useFindAndModify: false }
  );

  // return await Employee.updateOne(Id, {
  //   name: data?.name,
  // });
  // return new Promise(async (resolve, reject) => {
  //   Employee
  //     .updateOne(
  //       {
  //         id: Id,
  //       },
  //       falt(other)
  //     )
  //     .then(resolve)
  //     .catch(reject);
  // });
};

CrudService.prototype.delete = async function (model, data, Id) {
  // let { createdBy, createdAt, ...other } = data;

  // other = omitUndefined(other);
  // other = resetEmptyString(other);
  // console.log(data);

  return await Employee.remove(
    Id,
    { $set: {name:data?.name} },
    { new: true, useFindAndModify: false }
  );

  // return await Employee.updateOne(Id, {
  //   name: data?.name,
  // });
  // return new Promise(async (resolve, reject) => {
  //   Employee
  //     .updateOne(
  //       {
  //         id: Id,
  //       },
  //       falt(other)
  //     )
  //     .then(resolve)
  //     .catch(reject);
  // });
};

module.exports = CrudService;
