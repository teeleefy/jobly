const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
//Pass in the data json object the user wishes to update. Some of this data has js camelCased naming-syntax.  To prevent errors with sql, a second parameter will be passed called jsToSql.  This will be an object- its key will be the js version of a term; its value will be the sql version of the term that will be passed into the sql db query.

//For example: 
//jsToSql:
//{
    //   numEmployees: "num_employees",
    //   logoUrl: "logo_url",
    // }

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  //pull the keys out of the json object
  const keys = Object.keys(dataToUpdate);
  //if there are no keys, then throw an error because no data was provided for the update process
  if (keys.length === 0) throw new BadRequestError("No data");

  //This prepares the keys to be set to an array number in the sql query.  It will assign the key to equal its appropriate index value according to the sequal array. If the key is in js syntax (camelCase) and not in appropriate sql syntax (using snake_case), then the key will be reassigned an appropriate sql name by referring to the jsToSql translation object.
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
//This function will beturn an object that contains two keys.
//The setCols key will join all of the cols array with a comma and it will become a valid string that can be interjected into a sql query which will be able to set the keys to their appropriate array value using the $number syntax in the sql query. 
//The values key will contain all of the values that match appropriately with each key. These will be passed into the array at the end of the sql query so that it may be reassigned to each appropriate key upon updating the data. 
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
