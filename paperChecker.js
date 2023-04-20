function performCalculationAndAnalysisGeneration(report) {
    let totalMarks = 0;
    let correctQuestions = 0;
    let incorrectQuestions = 0;
    let notAttempted = 0;

    Object.entries(report).forEach(([questionNo, data]) => {
        if (data["score"] === "+4") {
            totalMarks += 4;
            correctQuestions += 1;
        } else if (data["score"] === "-1") {
            totalMarks -= 1;
            incorrectQuestions += 1;
        } else if (data["score"] === "0") {
            notAttempted += 1;
        }
    });

    return {totalMarks, correctQuestions, incorrectQuestions, notAttempted};
}

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

    fetch("AnswerKeys/" + __date + "-" + __shift + ".json")
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 404) {
                throw new Error("FileNotFound");
            }
        })
        .then(data => {
            let answerKey = data;
            let report = {};

            let menuTbls = dummyDocument.getElementsByClassName("menu-tbl");

            for (let i = 0; i < 90; i++) {
                let _table = menuTbls[i];
                let _tbody = _table.tBodies[0];
                let rows = _tbody.rows;

                let questionType = rows[0].cells[1].innerHTML;
                let questionID = rows[1].cells[1].innerHTML;

                if (questionType === "MCQ") {
                    if (answerKey[questionID] === "Dropped") {
                        // Question is dropped, adding +4
                        report[i+1] = {
                            "questionType": "MCQ",
                            "questionID": questionID,
                            "status": "dropped",
                            "score": "+4"
                        };
                    } else {
                        // Question is valid

                        let chosenOption = rows[7].cells[1].innerHTML.trim();

                        if (chosenOption === "--") {
                            // No answer given, no change in score
                            report[i+1] = {
                                "questionType": "MCQ",
                                "questionID": questionID,
                                "status": "notAttempted",
                                "score": "0",
                                "correctOptionID": questionID[answerKey]
                            };
                        } else {
                            // Question is attempted, either it is correct or incorrect
                            let chosenOptionID = rows[Number(chosenOption) + 1].cells[1].innerHTML;

                            if (answerKey[questionID] === chosenOptionID) {
                                // Answer is correct, adding +4
                                report[i+1] = {
                                    "questionType": "MCQ",
                                    "questionID": questionID,
                                    "status": "correct",
                                    "score": "+4",
                                    "chosenOptionID": chosenOptionID
                                };
                            } else {
                                // Answer is incorrect, subtracting -1
                                report[i+1] = {
                                    "questionType": "MCQ",
                                    "questionID": questionID,
                                    "status": "incorrect",
                                    "score": "-1",
                                    "chosenOptionID": chosenOptionID,
                                    "correctOptionID": answerKey[questionID]
                                };
                            }
                        }
                    }
                } else if (questionType === "SA") {
                    let _tableParent = _table.closest("td");
                    let _questionAreaTable = _tableParent.children[0];
                    let chosenAnswer = _questionAreaTable.tBodies[0].rows[4].cells[1].innerHTML.trim();

                    if (answerKey[questionID] === "Dropped") {
                        // Question is dropped, adding +4
                        report[i+1] = {
                            "questionType": "SA",
                            "questionID": questionID,
                            "status": "dropped",
                            "score": "+4"
                        };
                    } else {
                        // Question is valid
                        
                        if (chosenAnswer === "--") {
                            // No answer given, no change in score

                            report[i + 1] = {
                                "questionType": "SA",
                                "questionID": questionID,
                                "status": "notAttempted",
                                "score": "0",
                                "correctAnswer": questionID[answerKey]
                            };
                        } else {
                            // Question is attempted, either it is correct or incorrect

                            if (answerKey[questionID] === chosenAnswer) {
                                // Answer is correct, adding +4
                                report[i+1] = {
                                    "questionType": "SA",
                                    "questionID": questionID,
                                    "status": "correct",
                                    "score": "+4",
                                    "chosenAnswer": chosenAnswer
                                };
                            } else {
                                // Answer is incorrect, subtracting -1
                                report[i+1] = {
                                    "questionType": "SA",
                                    "questionID": questionID,
                                    "status": "incorrect",
                                    "score": "-1",
                                    "chosenAnswer": chosenAnswer,
                                    "correctAnswer": answerKey[questionID]
                                };
                            }
                        }
                    }
                }
            }

            let { totalMarks, correctQuestions, incorrectQuestions, notAttempted } = performCalculationAndAnalysisGeneration(report);
            insertAnalytics(report, { totalMarks, correctQuestions, incorrectQuestions, notAttempted });

        }).catch(e => {
            if (e.message === "FileNotFound") {
                let errorWindow = document.getElementById("upload-error-card");
                let errorText = document.getElementById("upload-error-text-disp");
                errorText.innerHTML = "The answer key for your shift is not found. Consider helping the site by sending us your answer key! More Info: <a href='https://www.reddit.com/r/JEENEETards/comments/12s5q6q/send_me_answer_keys_please_urgent/'>Click Here</a>";
                errorWindow.classList.remove("hidden-el");
            }
        });
}

function insertAnalytics(report, { totalMarks, correctQuestions, incorrectQuestions, notAttempted }) {
    document.getElementById("main-info").classList.add("hidden-el");
    document.getElementById("upload-area").classList.add("hidden-el");
    document.getElementById("score-card").classList.remove("hidden-el");
    document.getElementById("analytics").classList.remove("hidden-el");

    document.getElementById("data-total-marks").innerHTML = totalMarks + "/300";
    document.getElementById("data-correct-questions").innerHTML = correctQuestions;
    document.getElementById("data-incorrect-questions").innerHTML = incorrectQuestions;
    document.getElementById("data-notattempted-questions").innerHTML = notAttempted;

    let analyticsTable1Body = document.getElementById("analytics-table-root-1").getElementsByTagName("tbody")[0];
    let analyticsTable2Body = document.getElementById("analytics-table-root-2").getElementsByTagName("tbody")[0];
    let analyticsTable3Body = document.getElementById("analytics-table-root-3").getElementsByTagName("tbody")[0];

    for (let i = 0; i < 90; i++) {
        let row;
        if (i < 30) {
            row = analyticsTable1Body.insertRow();
        } else if (i >= 30 && i < 60) {
            row = analyticsTable2Body.insertRow();
        } else if (i >= 60 && i < 90) {
            row = analyticsTable3Body.insertRow();
        }
        let questionCell = row.insertCell();
        questionCell.innerHTML = String(i+1) + " (" + report[i + 1]["questionID"] + ")";

        let responseCell = row.insertCell();
        let responseCellText = "";
        let reportData = report[i + 1];

        responseCellText += reportData["score"];
        if (reportData["status"] === "correct") {
            responseCell.style.color = "#06ff06";
        } else if (reportData["status"] === "incorrect") {
            responseCell.style.color = "red";
        } else if (reportData["status"] === "notAttempted") {
            responseCell.style.color = "#01f3ff";
        } else if (reportData["status"] === "dropped") {
            responseCell.style.color = "#06ff06";
            responseCellText += " (Dropped)";
        }
        responseCell.innerHTML = responseCellText;

    }
}

function runAnalytics() {
    let fileToLoad = document.getElementById("response-document").files[0];

    let errorWindow = document.getElementById("upload-error-card");
    let errorText = document.getElementById("upload-error-text-disp");
    errorWindow.classList.add("hidden-el");

    if (fileToLoad) {
        let fileReader = new FileReader();
        fileReader.readAsText(fileToLoad, "UTF-8");

        fileReader.addEventListener("load", () => {
            let dummyDocument = document.implementation.createHTMLDocument("Response Sheet");
            dummyDocument.body.innerHTML = fileReader.result;
            try {
                calculateResponses(dummyDocument);
            } catch (e) {
                errorText.innerHTML = "Some error occured. Please check if the file is valid and not corrputed.";
                errorWindow.classList.remove("hidden-el");
            }
        });
    } else {
        errorText.innerHTML = "Please upload a file first!";
        errorWindow.classList.remove("hidden-el");
    }
}
