const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

// The function accepts two objects
  // dataToUpdate consists is a json object containing the data that is intended to be updated in SQL
    // For example: {firstName: 'Aliya'} 
  // jsToSql is how the JS object is to be converted to SQL
    // {jsonKey: 'SQL_column'} 
    // For example: {firstName: 'first_name'}
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Generate an array of keys from dataToUpdate object
  const keys = Object.keys(dataToUpdate);
  // Verify that keys were passed in
  if (keys.length === 0) throw new BadRequestError("No data");

  // Create an array of commands to be inserted into the SET portion of the SQL command
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    // Convert array of SQL commands to string for insertion
    setCols: cols.join(", "),
    // Creates array of values that correspond to the SQL command
    values: Object.values(dataToUpdate),
  };
}


function companyQueryFilters(filters) {

  // Throw error if minimum employee count is greater than maximum employee count
  if (parseInt(filters.minEmp) > parseInt(filters.maxEmp)) throw new BadRequestError(`Minimum Employees must be greater than Maximum Employees`)
    
  let filtersArr = [];
  let filterVals = [];

  // Create SQL command string for name filter and add corresponding value to values array
  if (filters.name) {
    // Name value is reformatted to return all companies with a name containing the submitted value
    filterVals.push(`%${filters.name}%`); 
    // ILIKE is used to ignore capitalization
    filtersArr.push(`name ILIKE $${filterVals.indexOf(`%${filters.name}%`) + 1}`);
  }

  // Create SQL command for minimum employee count filter and add corresponding value to values array
  if (filters.minEmp) {
    filterVals.push(filters.minEmp); 
    filtersArr.push(`num_employees >= $${filterVals.indexOf(filters.minEmp) + 1}`);
  }

  // Create SQL command for maximum employee count filter and add corresponding value to values array
  if (filters.maxEmp) {
    filterVals.push(filters.maxEmp); 
    filtersArr.push(`num_employees <= $${filterVals.indexOf(filters.maxEmp) + 1}`);
  }

  // Join strings for SQL command into one string linked with "AND" if necessary
  const filterStr = filtersArr.join(' AND ')

  console.log(filterStr)
  console.log(filterVals)

  // Return SQL command string and array of corresponding values
  return {
    string: filterStr,
    values: filterVals
  }
}

function jobQueryFilters(filters) {

  let filtersArr = [];
  let filterVals = [];

  if (filters.title) {
    filterVals.push(`%${filters.title}%`); 
    filtersArr.push(`title ILIKE $${filterVals.indexOf(`%${filters.title}%`) + 1}`);
  }

  if (filters.minSalary) {
    filterVals.push(parseInt(filters.minSalary)); 
    filtersArr.push(`salary >= $${filterVals.indexOf(parseInt(filters.minSalary)) + 1}`);
  }

  if (filters.hasEquity) {
    if (filters.hasEquity === 'true') {
      filtersArr.push(`equity <> '0'`);
    } else if (filters.hasEquity === 'false') {
      filtersArr.push(`equity = '0'`);
    }
  } 

  const filterStr = filtersArr.join(' AND ')

  return {
    string: filterStr,
    values: filterVals
  }
}

module.exports = { sqlForPartialUpdate, companyQueryFilters, jobQueryFilters };
