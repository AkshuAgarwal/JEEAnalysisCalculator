function calculateResponses(dummyDocument) {
    let _mainPanelTable = dummyDocument.getElementsByClassName("main-info-pnl")[0].children[1].children[0];
    let examDate = _mainPanelTable.tBodies[0].rows[3].cells[1].innerHTML;
    let examTime = _mainPanelTable.tBodies[0].rows[4].cells[1].innerHTML;

    let __date = examDate.substring(0, 2);
    let __shift;
    if (examTime.substring(0, 1) === "9") {
        __shift = "1";
    } else if (examTime.substring(0, 1) === "3") {
        __shift = "2";
    }

    fetch("AnswerKeys/" + __date + "-" + __shift + ".json").then(response => { return response.json(); }).then(data => {

        let answerKey = data;

        let report = {};

        let menuTbls = dummyDocument.getElementsByClassName("menu-tbl");

        let totalMarks = 0;
        let correctQuestions = 0;
        let incorrectQuestions = 0;
        let notAttempted = 0;

        for (let i = 0; i < 90; i++) {
            let _table = menuTbls[i];
            let _tbody = _table.tBodies[0];
            let rows = _tbody.rows;

            let questionType = rows[0].cells[1].innerHTML;
            let questionID = rows[1].cells[1].innerHTML;

            if (questionType === "MCQ") {
                let chosenOption = rows[7].cells[1].innerHTML.trim();

                if (chosenOption === "--") {
                    report[i + 1] = "0";
                } else {
                    let chosenOptionID = rows[Number(chosenOption) + 1].cells[1].innerHTML;
                    if (answerKey[questionID] === "Dropped") {
                        report[i + 1] = "+4";
                    } else if (answerKey[questionID] === chosenOptionID) {
                        report[i + 1] = "+4";
                    } else {
                        report[i + 1] = "-1";
                    }
                }
            } else if (questionType === "SA") {
                let _tableParent = _table.closest("td");
                let _questionAreaTable = _tableParent.children[0];
                let chosenAnswer = _questionAreaTable.tBodies[0].rows[4].cells[1].innerHTML.trim();

                if (chosenAnswer === "--") {
                    report[i + 1] = "0";
                } else {
                    if (answerKey[questionID] === chosenAnswer) {
                        report[i + 1] = "+4";
                    } else {
                        report[i + 1] = "-1";
                    }
                }
            }
        }

        Object.entries(report).forEach(([k, v]) => {
            if (v === "+4") {
                totalMarks += 4;
                correctQuestions += 1;
            } else if (v === "-1") {
                totalMarks -= 1;
                incorrectQuestions += 1;
            } else if (v === "0") {
                notAttempted += 1;
            }
        });

        insertAnalytics(report, { totalMarks, correctQuestions, incorrectQuestions, notAttempted })
    });
}

function insertAnalytics(report, { totalMarks, correctQuestions, incorrectQuestions, notAttempted }) {
    document.getElementById("main-info").classList.add("hidden-el");
    document.getElementById("upload-area").classList.add("hidden-el");
    document.getElementById("analytics").classList.remove("hidden-el");

    document.getElementById("data-total-marks").innerHTML = totalMarks + "/300";
    document.getElementById("data-correct-questions").innerHTML = correctQuestions;
    document.getElementById("data-incorrect-questions").innerHTML = incorrectQuestions;
    document.getElementById("data-notattempted-questions").innerHTML = notAttempted;
}

function runAnalytics() {
    let fileToLoad = document.getElementById("response-document").files[0];

    if (fileToLoad) {
        let fileReader = new FileReader();
        fileReader.readAsText(fileToLoad, "UTF-8");

        fileReader.addEventListener("load", () => {
            let dummyDocument = document.implementation.createHTMLDocument("Response Sheet");
            dummyDocument.body.innerHTML = fileReader.result;
            calculateResponses(dummyDocument);
        })
    }
}
