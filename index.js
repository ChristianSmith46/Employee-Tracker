// Import Libraries
const mysql = require('mysql2');
const inquirer = require('inquirer');

// List the actions
const promptChoices = ['View All Employees', 'Add Employee', 'Update Employee Role', 'View All Roles', 'Add Role', 'View All Departments', 'Add Department', 'Quit'];

// Create our db connection password and username are your own
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'employee_db'
});

// Initial function that asks for the action and calls the corresponding functions
const init = async () => {
    // Await the prompt for response
    const response = await inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to do?',
            name: 'choice',
            choices: promptChoices
        }
    ]);
    // Handle functions based on response
    if (response.choice === "View All Employees") {
        displayAll("employees");
    } else if (response.choice === "View All Roles") {
        displayAll("roles");
    } else if (response.choice === "View All Departments") {
        displayAll("departments");
    } else if (response.choice === "Add Department") {
        addDepartment();
    } else if (response.choice === "Add Role"){
        addRole();
    } else if (response.choice === "Add Employee") {
        addEmployee();
    } else if (response.choice === "Update Employee Role") {
        updateEmployee();
    }
    // End the connection if they quit or the action isn't set up so that the program ends
    else {
        db.end();
    }
}

// Function to add a department
const addDepartment = async () => {
    const response = await inquirer.prompt([
        {
            type: 'input',
            message: 'What is the name of the deparment?',
            name: 'departmentName'
        }
    ]);

    // Insert the department name into db
    db.query("INSERT INTO department(name) VALUES (?)", response.departmentName, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Added ${response.departmentName} to the database`);
        }
        // Go back to asking for an action
        init();
    });
}

// Function to add a role
const addRole = async () => {
    const response = await inquirer.prompt([
        {
            type: 'input',
            message: 'What is the name of the role?',
            name: 'roleName'
        },
        {
            type: 'number',
            message: 'What is the salary of the role?',
            name: 'roleSalary'
        },
        {
            type: 'list',
            message: 'Which department does the role belong to?',
            name: 'roleDepartment',
            choices: await listDepartments() //Await the department list to choose from
        }
    ]);
    // Insert role into db
    db.query("INSERT INTO role(title, salary, department_id) VALUES(?,?,?)", [response.roleName, response.roleSalary, response.roleDepartment], (err, result) => {
        if(err) {
            console.log(err);
            db.end();
        } else {
            console.log(`Added ${response.roleName} to the database`);
            init();
        }
    });
}

// Function to add an employee to db
const addEmployee = async () => {
    const response = await inquirer.prompt([
        {
            type: 'input',
            message: "What is the employee's first name?",
            name: 'employeeFirstName'
        },
        {
            type: 'input',
            message: "What is the employee's last name?",
            name: 'employeeLastName'
        },
        {
            type: 'list',
            message: "What is the employee's role?",
            name: 'employeeRole',
            choices: await listRoles() //await the roles list
        },
        {
            type: 'list',
            message: "Who is the employee's manager?",
            name: 'employeeManager',
            choices: await listEmployees(true) //await employees list
        }
    ]);
    // Insert employee into db
    db.query("INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES(?,?,?,?)", [response.employeeFirstName, response.employeeLastName, response.employeeRole, response.employeeManager], (err, result) => {
        if(err) {
            console.log(err);
            db.end();
        } else {
            console.log(`Added ${response.employeeFirstName} ${response.employeeLastName} to the database`);
            init();
        }
    });

}

// Function to update employee role
const updateEmployee = async () => {
    const response = await inquirer.prompt([
        {
            type: 'list',
            message: "Which employee's role do you want to update?",
            name: 'employee',
            choices: await listEmployees(false) //await employees list false param so there is no "None" option
        },
        {
            type: 'list',
            message: "Which role do you want to assign the selected employee?",
            name: 'newRole',
            choices: await listRoles() //await the roles list
        }
    ]);
    // db query to update the role based on employee id
    db.query("UPDATE employee SET role_id=? WHERE id=?", [response.newRole, response.employee], (err, result) => {
        if (err) {
            console.error(err);
            db.end()
        } else {
            console.log(`Updated employee's role`);
            init();
        }
    })
}

// Function to list departments
const listDepartments = async () => {
    // Use a promise so that we can actually return the array for the choices in prompts
    const result = await db.promise().query("SELECT name, id FROM department");
    // Map the array so that each object has a name and value(found on documentation)
    // This allows us to display a name to user but the response gives value in this case the id of the department for inserting into dbs
    const deparments = result[0].map((element) => {
        return {
            name: element.name,
            value: element.id
        };
    });
    return deparments;
}

// Function to list roles
const listRoles = async () => {
    // Use a promise so that we can actually return the array for the choices in prompts
    const result = await db.promise().query("SELECT title, id FROM role");
    // Map the array so that each object has a name and value(found on documentation)
    // This allows us to display a name to user but the response gives value in this case the id of the role for inserting into dbs
    const roles = result[0].map((element) => {
        return {
            name: element.title,
            value: element.id
        };
    });
    return roles;
}

// Function to list employees
const listEmployees = async (noneOption) => {
    // Use a promise so that we can actually return the array for the choices in prompts
    // I chose to concat the first and last name when displaying to user
    const result = await db.promise().query("SELECT concat(first_name, ' ', last_name) AS name, id FROM employee");
    // Map the array so that each object has a name and value(found on documentation)
    // This allows us to display a name to user but the response gives value in this case the id of the employee for inserting into dbs
    const employees = result[0].map((element) => {
        return {
            name: element.name,
            value: element.id
        };
    });
    // Add an option for no employee for when creating an employee that way they can have no manager
    if(noneOption) {
        employees.splice(0,0,{
            name: "None",
            value: null
        });
    }
    return employees;
}

// Function to display all employees roles or departments
const displayAll = async (type) => {
    // Used a switch this time
    switch(type) {
        case "employees":
            // query db for everything related to an employee and joined on their role and manager
            db.query("SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary, IF(e.manager_id IS NOT NULL, concat(manager.first_name, ' ', manager.last_name), NULL) AS manager FROM employee e INNER JOIN role ON e.role_id = role.id LEFT JOIN employee manager ON e.manager_id = manager.id INNER JOIN department ON role.department_id=department.id ORDER BY e.id", function (err, result) {
                console.table(result);
                init();
            });
            break;
        case "roles":
            // query db for all the necessary information regarding a role
            db.query("SELECT role.id, role.title, department.name AS department, role.salary FROM role INNER JOIN department ON role.department_id = department.id ORDER BY role.id", function (err, result) {
                console.table(result);
                init();
            });
            break;
        case "departments":
            // query db for all the necessary information regarding a department
            db.query("SELECT * FROM department ORDER BY department.id", function (err, result) {
                console.table(result);
                init();
            });
            break;
    }
}

// Call init function to start program
init();