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

function filterCompBy(filterData){
  //grabs the keys from the filter data object
  const keys = Object.keys(filterData);
  //from the keys, returns appropriate sql query WHERE statements with reference to the appropriate array index number
  const cols = keys.map((colName, idx) =>{
      if(colName === "name"){
        return `"name" ILIKE $${idx + 1}`
      }
      else if(colName === "minEmployees"){
        return `"num_employees" >= $${idx + 1}`
      } 
      else if(colName === "maxEmployees"){
        return `"num_employees" <= $${idx + 1}`
      } else {
        throw new BadRequestError(`${colName} is not an appropriate filter option`);
      }
  }) 
  //grabs the values from the filter data object
  const values = Object.values(filterData);
  //checks to see whether the value is a number or not.  If it is a number, it returns the number.  If it is not a number, it returns a sql version of the string using the percent sign sql syntax (example: "%filter%") as a sql filter string. 
  const valuesArray = values.map(value =>
    typeof value === 'number'? value : `%${value}%`
  )
  return {
    //joins with " AND " to connect the sql strings for the WHERE portion of the sql query 
    filterCols: cols.join(" AND "),
    values: valuesArray,
  };
}

function filterJobBy(filterData){
  //grabs the keys from the filter data object
  const keys = Object.keys(filterData);
//grabs the values from the filter data object
  const values = Object.values(filterData);

  //from the keys, returns appropriate sql query WHERE statements with reference to the appropriate array index number
  const cols = keys.map((colName, idx) =>{
      if(colName === "title"){
        return `"title" ILIKE $${idx + 1}`
      }
      else if(colName === "minSalary"){
        return `"salary" >= $${idx + 1}`
      } 
      else if(colName === "hasEquity"){
        if(filterData["hasEquity"] === true){
        return `"equity" > 0`}
        //if hasEquity is false, then it will return -1. It will then be filtered out in the variable below called "checkedCols"
        else{
          return -1;
        }
      } else {
        throw new BadRequestError(`${colName} is not an appropriate filter option`);
      }
  }) 
  
  //filter out "hasEquity" from the sql statement if hasEquity was false (which returned -1)
  const checkedCols = cols.filter(col => col !== -1);

  //checks to see whether the value is a number or not.  If it is a number, it returns the number.  If it is not a number, it returns a sql version of the string using the percent sign sql syntax (example: "%filter%") as a sql filter string. 
  const valuesArray = values.map(value => {
    if (typeof(value) === 'boolean'){
      return -1;
    } else if (typeof value === 'number'){
      return value;
    } else {
      return `%${value}%`;
  }}
  )
  //filter out hasEquity value (its value not being necessary to the sql query)
  const checkedVals = valuesArray.filter(val => val !== -1);

  return {
    //joins with " AND " to connect the sql strings for the WHERE portion of the sql query 
    filterCols: checkedCols.join(" AND "),
    values: checkedVals,
  };
}
module.exports = { sqlForPartialUpdate, filterCompBy, filterJobBy };

