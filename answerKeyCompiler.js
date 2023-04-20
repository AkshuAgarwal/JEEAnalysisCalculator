/*
Answer key page compiler.
Open the answer key page on NTA Result Portal and paste this code into the terminal.
This will return you the compiled json.
*/

let rows = document.getElementById("ctl00_LoginContent_grAnswerKey").tBodies[0].rows;
let mapping = {}

for (let i = 1; i < 91; i++) {
    let row = rows[i];
    mapping[row.cells[1].getElementsByTagName("span")[0].innerHTML] = row.cells[2].getElementsByTagName("span")[0].innerHTML;
}

console.log(mapping);
