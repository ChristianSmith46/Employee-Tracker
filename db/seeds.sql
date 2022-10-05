INSERT INTO department(name)
VALUES
("Offense"),
("Defense"),
("Special Teams");

INSERT INTO role(title, salary, department_id)
VALUES
("Quarterback", 1000000, 1),
("Tight End", 200000, 1);

INSERT INTO employee(first_name, last_name, role_id, manager_id)
VALUES
("Tom", "Brady", 1, NULL),
("Robert", "Gronkowski", 2, 1);